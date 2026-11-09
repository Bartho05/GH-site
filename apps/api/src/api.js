/* =========================================================
   api.js — rotas de /api/*
   ========================================================= */
const crypto = require('crypto');
const db = require('./db');
const auth = require('./auth');
const { normalizaConfig, normalizaPedido } = require('./validar');

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

async function despachar(req, res, ctx) {
  const { metodo, pathname, url, corpo, enviar } = ctx;
  const rota = metodo + ' ' + pathname;

  switch (rota) {
    case 'GET /api/health':
      return enviar(200, { ok: true, nome: 'gh-roleplay-api', hora: new Date().toISOString() });

    case 'GET /api/config':
      return enviar(200, db.getConfig());

    case 'PUT /api/config': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      const resultado = normalizaConfig(corpo);
      if (!resultado.ok) return enviar(400, { erro: resultado.motivo });
      return enviar(200, db.putConfig(resultado.config));
    }

    case 'DELETE /api/config': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
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
      return enviar(200, { ok: true });
    }

    case 'POST /api/orders': {
      const resultado = normalizaPedido(corpo, db.getConfig());
      if (!resultado.ok) return enviar(400, { erro: resultado.motivo });
      const pedido = { id: gerarIdPedido(), ...resultado.pedido, criadoEm: new Date().toISOString() };
      db.addPedido(pedido);
      return enviar(201, { pedido });
    }

    case 'GET /api/orders': {
      if (!logado(req)) return enviar(401, { erro: 'precisa estar logado (Bearer do /api/auth/login)' });
      return enviar(200, { pedidos: db.listarPedidos() });
    }

    default:
      return enviar(404, { erro: 'rota não encontrada: ' + rota });
  }
}

module.exports = { despachar };
