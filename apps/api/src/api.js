/* =========================================================
   api.js — rotas de /api/*

   Fase 2: checkout público (Pix manual + automático via MP),
   login Discord (OAuth) e webhook do Mercado Pago.
   Fase 3: fila de entregas para o servidor FiveM (X-Server-Key).
   Fase 4: auditoria das ações e CORS cabe no server.js.
   ========================================================= */
const crypto = require('crypto');
const db = require('./db');
const auth = require('./auth');
const { normalizaConfig, normalizaPedido, normalizaStatusPedido } = require('./validar');

function tokenDe(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

function logado(req) {
  return auth.tokenValido(tokenDe(req));
}

function gerarIdPedido() {
  return 'PED-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function ipDe(req) {
  return (req.socket && req.socket.remoteAddress) || '?';
}

/* ---------- proteções do checkout ---------- */
const limitesCheckout = new Map(); // ip → [momentos das criações]

function limiteCheckoutOk(ip, max = 8, janelaMs = 10 * 60 * 1000) {
  const agora = Date.now();
  const lista = (limitesCheckout.get(ip) || []).filter((t) => agora - t < janelaMs);
  if (lista.length >= max) { limitesCheckout.set(ip, lista); return false; }
  lista.push(agora);
  limitesCheckout.set(ip, lista);
  return true;
}

function zerarLimitesCheckout() {
  limitesCheckout.clear();
}

/* sessões temporárias do login Discord (em memória, 30 min) */
const sessoesDiscord = new Map(); // token → { id, tag, expira }

function sessaoDiscord(token) {
  const s = sessoesDiscord.get(String(token || ''));
  if (!s) return null;
  if (s.expira < Date.now()) { sessoesDiscord.delete(token); return null; }
  return s;
}

/* states anti-CSRF do OAuth (10 min, uso único) — guardam para onde voltar */
const estadosDiscord = new Map(); // state → { expira, volta }

function estadoDiscordOk(state) {
  const s = estadosDiscord.get(state);
  if (!s || s.expira < Date.now()) return false;
  estadosDiscord.delete(state); // uso único
  return s;
}

/* cria a sessão do Discord (usada pelo callback e pelos testes) */
function criarSessaoDiscord(id, tag) {
  const token = crypto.randomBytes(24).toString('hex');
  sessoesDiscord.set(token, {
    id: String(id).slice(0, 25),
    tag: String(tag || 'discord').slice(0, 40),
    expira: Date.now() + 30 * 60 * 1000
  });
  if (sessoesDiscord.size > 500) {
    for (const [k, s] of sessoesDiscord) if (s.expira < Date.now()) sessoesDiscord.delete(k);
  }
  return token;
}

/* chave do servidor FiveM — comparação em tempo constante (sha256 antes) */
function servidorOk(req) {
  const segredo = process.env.GHRP_SERVER_KEY;
  const recebida = String(req.headers['x-server-key'] || '');
  if (!segredo || !recebida) return false;
  const a = crypto.createHash('sha256').update(segredo).digest();
  const b = crypto.createHash('sha256').update(recebida).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------- Mercado Pago ---------- */
function idPagamentoMp(url, corpo) {
  if (corpo && typeof corpo === 'object' && !Array.isArray(corpo)) {
    if (corpo.data && corpo.data.id != null && String(corpo.data.id).trim()) return String(corpo.data.id);
    if (corpo.type === 'payment' && corpo.id != null) return String(corpo.id);
  }
  const q = url.searchParams;
  if (q.get('topic') === 'payment' && q.get('id')) return q.get('id');
  if (q.get('data.type') === 'payment' && q.get('data.id')) return q.get('data.id');
  return null;
}

/* cria o pagamento Pix no MP (copia e cola). null = cai no modo manual */
async function criarPixMp(pedido, cfg) {
  try {
    const r = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN,
        'X-Idempotency-Key': pedido.id
      },
      body: JSON.stringify({
        transaction_amount: Number(pedido.total.toFixed(2)),
        description: (cfg.loja + ' — ' + pedido.itens.map((i) => i.quantidade + 'x ' + i.nome).join(', ')).slice(0, 200),
        payment_method_id: 'pix',
        external_reference: pedido.id,
        payer: { email: 'cliente@ghroleplay.local', first_name: 'Cliente' }
      })
    });
    if (!r.ok) return null;
    const pg = await r.json();
    const td = pg.point_of_interaction && pg.point_of_interaction.transaction_data;
    if (!td || !td.qr_code) return null;
    return { mpId: String(pg.id || ''), copiaECola: String(td.qr_code), qrBase64: td.qr_code_base64 || null };
  } catch (e) {
    return null;
  }
}

/* reaproveita a config viva em rotas que precisam dela */
function configLoja() {
  return db.getConfig();
}

/* deep-merge: config salva do banco + campos novos do padrão de fábrica.
   Bancos antigos (antes da Fase 2) não têm `checkout` — o padrão entra. */
function mesclarFundos(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  if (base && typeof base === 'object' && extra && typeof extra === 'object') {
    const saida = { ...base };
    for (const k of Object.keys(extra)) saida[k] = mesclarFundos(base[k], extra[k]);
    return saida;
  }
  return extra === undefined ? base : extra;
}

async function despachar(req, res, ctx) {
  const { metodo, pathname, url, corpo, enviar, redirecionar } = ctx;
  const rota = metodo + ' ' + pathname;

  /* PATCH /api/orders/:codigo — dono muda o status pelo painel */
  const matchPedido = pathname.match(/^\/api\/orders\/([A-Za-z0-9-]{4,64})$/);
  if (matchPedido && metodo === 'PATCH') {
    if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
    const status = normalizaStatusPedido(corpo && corpo.status);
    if (!status) return enviar(400, { erro: 'status inválido (use pendente, pago, entregue ou cancelado)' });
    const antes = db.pedidoPorCodigo(matchPedido[1]);
    if (!antes) return enviar(404, { erro: 'pedido não encontrado' });
    /* ir para 'pago' passa pelo pagarPedido: grava pago_em e gera a fila de entregas */
    const pedido = status === 'pago'
      ? db.pagarPedido(matchPedido[1], { origem: 'painel' })
      : db.setStatusPedido(matchPedido[1], status);
    if (!pedido) return enviar(404, { erro: 'pedido não encontrado' });
    if (status !== 'pago') db.registrarAuditoria('pedido_status', matchPedido[1] + ': ' + antes.status + ' → ' + status);
    return enviar(200, { pedido });
  }

  /* GET /api/checkout/:codigo — acompanhamento público (só o essencial) */
  const matchAcompanha = pathname.match(/^\/api\/checkout\/([A-Za-z0-9-]{4,64})$/);
  if (matchAcompanha && metodo === 'GET') {
    const pedido = db.pedidoPorCodigo(matchAcompanha[1]);
    if (!pedido) return enviar(404, { erro: 'pedido não encontrado' });
    return enviar(200, { id: pedido.id, status: pedido.status, total: pedido.total });
  }

  /* GET /api/vendas?nome= — unidades vendidas de um produto (pedidos
     pagos/entregues). Público, mas só expõe um número agregado. */
  if (pathname === '/api/vendas' && metodo === 'GET') {
    const nome = (url.searchParams.get('nome') || '').trim();
    if (!nome) return enviar(400, { erro: 'informe o nome do produto (?nome=)' });
    let vendas = 0;
    for (const p of db.listarPedidos({ limite: 5000 })) {
      if (p.status !== 'pago' && p.status !== 'entregue') continue;
      for (const i of p.itens || []) if (i.nome === nome) vendas += Number(i.quantidade) || 0;
    }
    return enviar(200, { vendas });
  }

  /* POST /api/deliveries/:id/marcar — o servidor FiveM marca o que entregou */
  const matchEntrega = pathname.match(/^\/api\/deliveries\/(\d+)\/marcar$/);
  if (matchEntrega && metodo === 'POST') {
    if (!process.env.GHRP_SERVER_KEY) return enviar(503, { erro: 'GHRP_SERVER_KEY não configurada no backend.' });
    if (!servidorOk(req)) return enviar(401, { erro: 'chave do servidor inválida (header X-Server-Key)' });
    const status = corpo && typeof corpo.status === 'string' ? corpo.status : 'entregue';
    if (!db.STATUSES_ENTREGA.includes(status)) return enviar(400, { erro: 'status inválido (use pendente, entregue ou falhou)' });
    if (!db.marcarEntrega(Number(matchEntrega[1]), status)) return enviar(404, { erro: 'entrega não encontrada' });
    db.registrarAuditoria('entrega_marcada', 'entrega #' + matchEntrega[1] + ' → ' + status + ' (servidor)');
    return enviar(200, { ok: true });
  }

  /* POST /api/entregas/:id/marcar — a staff marca a entrega na mão pelo painel */
  const matchEntregaAdmin = pathname.match(/^\/api\/entregas\/(\d+)\/marcar$/);
  if (matchEntregaAdmin && metodo === 'POST') {
    if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
    const status = corpo && typeof corpo.status === 'string' ? corpo.status : 'entregue';
    if (!db.STATUSES_ENTREGA.includes(status)) return enviar(400, { erro: 'status inválido (use pendente, entregue ou falhou)' });
    if (!db.marcarEntrega(Number(matchEntregaAdmin[1]), status)) return enviar(404, { erro: 'entrega não encontrada' });
    db.registrarAuditoria('entrega_manual', 'entrega #' + matchEntregaAdmin[1] + ' → ' + status + ' (painel)');
    return enviar(200, { ok: true });
  }

  switch (rota) {
    case 'GET /api/health':
      return enviar(200, { ok: true, nome: 'gh-roleplay-api', hora: new Date().toISOString() });

    /* GET /api/stats — números da aba Estatísticas */
    case 'GET /api/stats': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      return enviar(200, db.estatisticas());
    }

    /* GET /api/entregas — fila completa no painel */
    case 'GET /api/entregas': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      const status = url.searchParams.get('status') || 'pendente';
      return enviar(200, { entregas: db.listarEntregas({ status, limite: 200, ordem: 'desc' }) });
    }

    case 'GET /api/config':
      /* recursos avisa ao frontend o que este servidor tem ligado;
         mesclamos com o padrão de fábrica para bancos antigos ganharem
         as seções novas (ex.: checkout) sem perder a config do dono */
      return enviar(200, {
        ...mesclarFundos(db.CONFIG_BASE, db.getConfig()),
        recursos: {
          pixAutomatico: !!process.env.MP_ACCESS_TOKEN,
          discordLogin: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
          serverKey: !!process.env.GHRP_SERVER_KEY
        }
      });

    case 'PUT /api/config': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      const resultado = normalizaConfig(corpo);
      if (!resultado.ok) return enviar(400, { erro: resultado.motivo });
      const cfg = db.putConfig(resultado.config);
      db.registrarAuditoria('config_atualizada', 'loja: ' + (cfg.loja || '?'));
      return enviar(200, cfg);
    }

    case 'DELETE /api/config': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      db.registrarAuditoria('config_reset', 'config voltou ao padrão de fábrica');
      return enviar(200, db.resetConfig());
    }

    case 'GET /api/products': {
      const cfg = db.getConfig();
      const categoria = url.searchParams.get('categoria');
      const produtos = categoria ? cfg.produtos.filter((p) => p.categoria === categoria) : cfg.produtos;
      return enviar(200, { produtos });
    }

    case 'GET /api/categories':
      return enviar(200, { categorias: db.getConfig().categorias });

    case 'POST /api/auth/login': {
      const ip = req.socket.remoteAddress || '?';
      if (!auth.limiteOk(ip)) return enviar(429, { erro: 'Muitas tentativas — espere um minutinho.' });
      const senha = corpo && typeof corpo.senha === 'string' ? corpo.senha : null;
      if (senha !== null && auth.confereSenha(senha, db.getAdmin())) {
        db.registrarAuditoria('admin_login', 'login do painel');
        return enviar(200, { token: auth.criarToken(), modo: 'servidor' });
      }
      return enviar(401, { erro: 'Senha incorreta.' });
    }

    case 'POST /api/auth/logout': {
      if (!logado(req)) return enviar(401, { erro: 'sessão inválida' });
      auth.revogarToken(tokenDe(req));
      return enviar(200, { ok: true });
    }

    case 'POST /api/auth/trocar-senha': {
      if (!logado(req)) return enviar(401, { erro: 'sessão inválida' });
      const atual = corpo && typeof corpo.atual === 'string' ? corpo.atual : '';
      const nova = corpo && typeof corpo.nova === 'string' ? corpo.nova : '';
      if (!auth.confereSenha(atual, db.getAdmin())) return enviar(400, { erro: 'Senha atual incorreta.' });
      if (nova.length < 4 || nova.length > 72) return enviar(400, { erro: 'A nova senha deve ter entre 4 e 72 caracteres.' });
      db.setAdmin(auth.hashSenha(nova));
      db.registrarAuditoria('senha_alterada', 'senha do painel trocada');
      return enviar(200, { ok: true });
    }

    case 'GET /api/auditoria': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      return enviar(200, { registros: db.listarAuditoria({ limite: 200 }) });
    }

    /* ---------- OAuth Discord (Fase 2) ---------- */

    /* GET /api/auth/discord — manda o cliente para o Discord
       (?volta=conta faz o OAuth voltar para a página Minha conta) */
    case 'GET /api/auth/discord': {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const origem = (process.env.GHRP_ORIGIN || '').replace(/\/+$/, '');
      if (!clientId || !process.env.DISCORD_CLIENT_SECRET || !origem) {
        return enviar(503, {
          erro: 'Login com Discord não configurado (defina DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET e GHRP_ORIGIN).'
        });
      }
      const volta = url.searchParams.get('volta') === 'conta' ? '/conta' : '/checkout';
      const state = crypto.randomBytes(16).toString('hex');
      estadosDiscord.set(state, { expira: Date.now() + 10 * 60 * 1000, volta });
      const urlAutoriza = 'https://discord.com/oauth2/authorize?' + new URLSearchParams({
        client_id: clientId,
        redirect_uri: origem + '/api/auth/discord/callback',
        response_type: 'code',
        scope: 'identify',
        state
      });
      return redirecionar(urlAutoriza);
    }

    /* GET /api/auth/discord/callback — Discord devolve o code; troca por perfil */
    case 'GET /api/auth/discord/callback': {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;
      const origem = (process.env.GHRP_ORIGIN || '').replace(/\/+$/, '');
      if (!clientId || !clientSecret || !origem) return redirecionar('/checkout?erro=discord');
      if (url.searchParams.get('error')) return redirecionar('/checkout?erro=discord');
      const state = url.searchParams.get('state') || '';
      const estado = estadoDiscordOk(state);
      if (!estado) return redirecionar('/checkout?erro=discord');
      const code = url.searchParams.get('code') || '';

      let perfil = null;
      try {
        const rToken = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: origem + '/api/auth/discord/callback'
          })
        });
        if (rToken.ok) {
          const tk = await rToken.json();
          const rEu = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: 'Bearer ' + (tk.access_token || '') }
          });
          if (rEu.ok) perfil = await rEu.json();
        }
      } catch (e) { /* rede caiu → volta com erro */ }

      if (!perfil || !perfil.id) return redirecionar(estado.volta + '?erro=discord');
      const token = criarSessaoDiscord(perfil.id, perfil.global_name || perfil.username || 'discord');
      return redirecionar(estado.volta + '?dc=' + token);
    }

    /* GET /api/auth/discord/sessao — o checkout consulta quem logou */
    case 'GET /api/auth/discord/sessao': {
      const s = sessaoDiscord(req.headers['x-discord-token']);
      if (!s) return enviar(404, { erro: 'sessão Discord inexistente ou expirada' });
      return enviar(200, { id: s.id, tag: s.tag });
    }

    /* ---------- checkout (Fase 2) ---------- */

    /* POST /api/checkout — o cliente cria o pedido dele (público, com rate limit) */
    case 'POST /api/checkout': {
      if (!limiteCheckoutOk(ipDe(req))) {
        return enviar(429, { erro: 'Muitos pedidos seguidos — espere alguns minutos.' });
      }
      const cfg = configLoja();
      const resultado = normalizaPedido(corpo, cfg);
      if (!resultado.ok) return enviar(400, { erro: resultado.motivo });
      if (!resultado.pedido.playerId) {
        return enviar(400, { erro: 'informe seu ID no servidor para receber a entrega' });
      }

      /* o Discord só vale pela sessão OAuth — o corpo nunca define isso */
      const sessao = sessaoDiscord(req.headers['x-discord-token']);
      const pedido = {
        id: gerarIdPedido(),
        ...resultado.pedido,
        status: 'pendente',
        discordId: sessao ? sessao.id : resultado.pedido.discordId,
        discordTag: sessao ? sessao.tag : resultado.pedido.discordTag,
        criadoEm: new Date().toISOString()
      };
      db.addPedido(pedido);

      /* Pix automático quando o servidor tem MP_ACCESS_TOKEN; senão manual */
      let pix = null;
      if (process.env.MP_ACCESS_TOKEN) {
        pix = await criarPixMp(pedido, cfg);
        if (pix) db.setMpIdPedido(pedido.id, pix.mpId);
      }
      db.registrarAuditoria(
        'pedido_criado',
        pedido.id + ' · jogador ' + pedido.playerId + (pix ? ' · Pix automático' : ' · Pix manual')
      );

      return enviar(201, {
        pedido: { id: pedido.id, status: pedido.status, total: pedido.total, itens: pedido.itens },
        pix: pix ? { copiaECola: pix.copiaECola, qrBase64: pix.qrBase64 } : null,
        manual: {
          chavePix: (cfg.checkout && cfg.checkout.chavePix) || null,
          tipoChavePix: (cfg.checkout && cfg.checkout.tipoChavePix) || 'aleatoria',
          instrucoesPix: (cfg.checkout && cfg.checkout.instrucoesPix) || ''
        }
      });
    }

    /* ---------- entregas (Fase 3) ---------- */

    /* GET /api/deliveries/queue — o servidor FiveM busca a fila (mais antiga primeiro) */
    case 'GET /api/deliveries/queue': {
      if (!process.env.GHRP_SERVER_KEY) return enviar(503, { erro: 'GHRP_SERVER_KEY não configurada no backend.' });
      if (!servidorOk(req)) return enviar(401, { erro: 'chave do servidor inválida (header X-Server-Key)' });
      const status = url.searchParams.get('status') || 'pendente';
      return enviar(200, { entregas: db.listarEntregas({ status, limite: 50, ordem: 'asc' }) });
    }

    /* GET /api/minha/conta — histórico do próprio cliente (sessão Discord) */
    case 'GET /api/minha/conta': {
      const s = sessaoDiscord(req.headers['x-discord-token']);
      if (!s) return enviar(404, { erro: 'sessão Discord inexistente ou expirada' });
      const pedidos = db.listarPedidosPorDiscord(s.id).map((p) => ({
        id: p.id,
        status: p.status,
        total: p.total,
        itens: p.itens,
        criadoEm: p.criadoEm
      }));
      return enviar(200, { tag: s.tag, pedidos });
    }

    case 'POST /api/orders': {
      if (!limiteCheckoutOk(ipDe(req))) {
        return enviar(429, { erro: 'Muitos pedidos seguidos — espere alguns minutos.' });
      }
      const resultado = normalizaPedido(corpo, db.getConfig());
      if (!resultado.ok) return enviar(400, { erro: resultado.motivo });
      const pedido = { id: gerarIdPedido(), ...resultado.pedido, criadoEm: new Date().toISOString() };
      db.addPedido(pedido);
      db.registrarAuditoria('pedido_criado', pedido.id + ' · jogador ' + (pedido.playerId || '?'));
      return enviar(201, { pedido });
    }

    case 'GET /api/orders': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      const status = normalizaStatusPedido(url.searchParams.get('status') || '');
      const pedidos = db.listarPedidos(status ? { status } : {});
      return enviar(200, { pedidos, resumo: db.resumoPedidos() });
    }

    /* ---------- webhook do Mercado Pago ---------- */

    /* POST /api/webhooks/mercadopago — o MP avisa que o pagamento caiu.
       Nunca confiamos no corpo: re-buscamos o pagamento na API do MP e
       usamos external_reference (= código do pedido) para pagar. */
    case 'POST /api/webhooks/mercadopago': {
      if (!process.env.MP_ACCESS_TOKEN) {
        return enviar(503, { erro: 'Mercado Pago não configurado (defina MP_ACCESS_TOKEN).' });
      }
      const idPagamento = idPagamentoMp(url, corpo);
      if (!idPagamento) return enviar(400, { erro: 'notificação sem id de pagamento' });

      let pagamento = null;
      try {
        const r = await fetch('https://api.mercadopago.com/v1/payments/' + encodeURIComponent(idPagamento), {
          headers: { Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN }
        });
        if (r.ok) pagamento = await r.json();
      } catch (e) { /* rede: 503 faz o MP tentar de novo */ }
      if (!pagamento) return enviar(503, { erro: 'não foi possível consultar o pagamento' });

      if (pagamento.status !== 'approved') {
        return enviar(200, { ok: true, ignorado: true, status: pagamento.status || null });
      }
      const codigo = typeof pagamento.external_reference === 'string' ? pagamento.external_reference : '';
      if (!codigo) return enviar(200, { ok: true, ignorado: true, motivo: 'sem external_reference' });

      const pedido = db.pagarPedido(codigo, { mpId: String(pagamento.id || idPagamento), origem: 'webhook_mp' });
      if (!pedido) return enviar(200, { ok: true, ignorado: true, motivo: 'pedido inexistente' });
      return enviar(200, { ok: true, status: pedido.status });
    }

    default:
      return enviar(404, { erro: 'rota não encontrada: ' + rota });
  }
}

module.exports = { despachar, zerarLimitesCheckout, criarSessaoDiscord };
