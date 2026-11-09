/* =========================================================
   validar.js — normaliza tamanho/formato do que vem de fora
   Estratégia: clamp-recupera. Campo inválido volta ao padrão ou
   é descartado; nada quebra o site por causa de uma edição ruim.
   ========================================================= */
const { CONFIG_BASE, clone } = require('./db');

function texto(v, max, padrao = '') {
  const t = (typeof v === 'string' ? v : '')
    .replace(/<[^>]*>/g, ' ')   // remove etiquetas HTML inteiras
    .replace(/[<>]/g, '')       // e qualquer < > sobrando (defesa em profundidade)
    .replace(/\s+/g, ' ')       // colapsa espaços deixados pelas remoções
    .trim()
    .slice(0, max);
  return t || padrao;
}

function numeroEntre(v, min, max, padrao) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (typeof n !== 'number' || isNaN(n)) return padrao;
  return Math.min(max, Math.max(min, n));
}

function hexCor(v, padrao) {
  return (typeof v === 'string' && /^#([0-9a-f]{6})$/i.test(v)) ? v.toLowerCase() : padrao;
}

function nomeIcone(v, padrao) {
  return (typeof v === 'string' && /^[a-z0-9-]{1,32}$/.test(v)) ? v : padrao;
}

function urlSegura(v, padrao) {
  const t = typeof v === 'string' ? v.trim() : '';
  if (t && /^(https?:\/\/|\/|#)/i.test(t) && t.length <= 500) return t;
  return padrao;
}

function slug(textoAlvo) {
  const s = String(textoAlvo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'categoria';
}

/* ---------- config ---------- */
function normalizaConfig(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    return { ok: false, motivo: 'config deve ser um objeto' };
  }
  const cfg = clone(CONFIG_BASE); // começa do padrão; campos válidos sobrescrevem

  if (typeof entrada.loja === 'string' && entrada.loja.trim()) {
    const limpa = texto(entrada.loja, 40);
    if (limpa) cfg.loja = limpa;
  }
  if (typeof entrada.logoIniciais === 'string' && entrada.logoIniciais.trim()) {
    const iniciais = texto(entrada.logoIniciais, 3).toUpperCase();
    if (iniciais) cfg.logoIniciais = iniciais;
  }
  if (typeof entrada.anuncio === 'string' && entrada.anuncio.trim()) {
    const limpa = texto(entrada.anuncio, 180);
    if (limpa) cfg.anuncio = limpa;
  }
  if (typeof entrada.pilares === 'string' && entrada.pilares.trim()) {
    const limpa = texto(entrada.pilares, 120);
    if (limpa) cfg.pilares = limpa;
  }

  if (entrada.cupom && typeof entrada.cupom === 'object') {
    if (typeof entrada.cupom.codigo === 'string' && entrada.cupom.codigo.trim()) {
      const codigo = texto(entrada.cupom.codigo, 24).toUpperCase();
      if (codigo) cfg.cupom.codigo = codigo;
    }
    cfg.cupom.desconto = numeroEntre(entrada.cupom.desconto, 1, 99, cfg.cupom.desconto);
    cfg.cupom.minimo = numeroEntre(entrada.cupom.minimo, 0, 100000, cfg.cupom.minimo);
  }

  if (entrada.servidor && typeof entrada.servidor === 'object') {
    cfg.servidor.link = urlSegura(entrada.servidor.link, cfg.servidor.link);
    cfg.servidor.jogadores = Math.round(numeroEntre(entrada.servidor.jogadores, 0, 1000000, cfg.servidor.jogadores));
  }

  if (Array.isArray(entrada.pagamentos)) {
    const lista = entrada.pagamentos
      .map((p) => texto(p, 30))
      .filter(Boolean)
      .slice(0, 8);
    if (lista.length) cfg.pagamentos = lista;
  }

  if (Array.isArray(entrada.frasesHero)) {
    const lista = entrada.frasesHero.slice(0, 8).map((f) => ({
      inicio: texto(f && f.inicio, 48),
      destaque: texto(f && f.destaque, 48)
    })).filter((f) => f.inicio || f.destaque);
    if (lista.length) cfg.frasesHero = lista;
  }

  if (['laranja', 'rosa', 'verde'].includes(entrada.temaPadrao)) cfg.temaPadrao = entrada.temaPadrao;

  if (Array.isArray(entrada.numeros) && entrada.numeros.length) {
    cfg.numeros = entrada.numeros.slice(0, 8).map((n) => ({
      icone: nomeIcone(n && n.icone, 'star'),
      prefixo: n && n.prefixo ? texto(n.prefixo, 12) : null,
      valor: numeroEntre(n && n.valor, 0, 100000000, 0),
      decimais: Math.round(numeroEntre(n && n.decimais, 0, 2, 0)),
      rotulo: texto(n && n.rotulo, 48, '')
    })).filter((n) => n.rotulo);
  }

  if (Array.isArray(entrada.podio)) {
    const lista = entrada.podio.slice(0, 3).map((p) => ({
      nome: texto(p && p.nome, 32),
      valor: texto(p && p.valor, 40)
    })).filter((p) => p.nome);
    cfg.podio = lista;
  }

  if (Array.isArray(entrada.categorias) && entrada.categorias.length) {
    const usados = new Set();
    cfg.categorias = entrada.categorias.slice(0, 40).map((c) => {
      const nome = texto(c && c.nome, 40);
      if (!nome) return null;
      let id = slug(c && c.id ? c.id : nome).slice(0, 32);
      let base = id;
      let n = 1;
      while (usados.has(id)) {
        n += 1;
        id = (base + '-' + n).slice(0, 32);
      }
      usados.add(id);
      return { nome, id, destaque: !!(c && c.destaque) };
    }).filter(Boolean);
    if (!cfg.categorias.length) cfg.categorias = clone(CONFIG_BASE.categorias);
  }

  if (Array.isArray(entrada.produtos)) {
    const idsValidos = cfg.categorias.map((c) => c.id);
    cfg.produtos = entrada.produtos.slice(0, 200).map((p) => {
      const preco = numeroEntre(p && p.preco, 0, 100000, 0);
      let precoAntigo = p && p.precoAntigo !== undefined && p.precoAntigo !== null
        ? numeroEntre(p.precoAntigo, 0, 100000, null)
        : null;
      if (precoAntigo !== null && precoAntigo <= preco) precoAntigo = null;
      const categoria = idsValidos.includes(p && p.categoria) ? p.categoria : (idsValidos[0] || 'vips');
      return {
        categoria,
        nome: texto(p && p.nome, 60, 'Produto'),
        preco,
        precoAntigo,
        icone: nomeIcone(p && p.icone, 'package'),
        cores: [hexCor(p && p.cores && p.cores[0], '#2a2030'), hexCor(p && p.cores && p.cores[1], '#141118')],
        tag: p && p.tag ? texto(p.tag, 24) : ''
      };
    });
  }

  if (Array.isArray(entrada.depoimentos)) {
    cfg.depoimentos = entrada.depoimentos.slice(0, 30).map((d) => ({
      nome: texto(d && d.nome, 32, 'Anônimo'),
      nota: Math.round(numeroEntre(d && d.nota, 1, 5, 5)),
      texto: texto(d && d.texto, 220),
      produto: texto(d && d.produto, 60),
      data: texto(d && d.data, 16)
    }));
  }

  if (Array.isArray(entrada.links)) {
    cfg.links = entrada.links.slice(0, 12).map((l) => ({
      nome: texto(l && l.nome, 32),
      url: urlSegura(l && l.url, '#'),
      icone: nomeIcone(l && l.icone, 'link')
    })).filter((l) => l.nome);
  }

  return { ok: true, config: cfg };
}

/* ---------- pedido ---------- */
function normalizaPedido(entrada, config) {
  if (!entrada || typeof entrada !== 'object' || !Array.isArray(entrada.itens)) {
    return { ok: false, motivo: 'corpo do pedido inválido' };
  }
  const itens = [];
  for (const bruto of entrada.itens.slice(0, 60)) {
    if (!bruto || typeof bruto !== 'object') continue;
    const nome = typeof bruto.nome === 'string' ? bruto.nome.trim().slice(0, 80) : '';
    const produto = config.produtos.find((p) => p.nome === nome);
    if (!produto) return { ok: false, motivo: 'produto inexistente no catálogo: ' + (nome || '(vazio)') };
    const quantidade = Math.round(numeroEntre(bruto.quantidade, 1, 50, 1));
    const existente = itens.find((i) => i.nome === nome);
    if (existente) existente.quantidade = Math.min(50, existente.quantidade + quantidade);
    else itens.push({ nome, quantidade });
  }
  if (!itens.length) return { ok: false, motivo: 'carrinho vazio' };

  let subtotal = 0;
  for (const item of itens) {
    const produto = config.produtos.find((p) => p.nome === item.nome);
    item.precoUnitario = produto.preco;
    subtotal += produto.preco * item.quantidade;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  let descontoPct = 0;
  let cupomUsado = null;
  const cupom = (typeof entrada.cupom === 'string' ? entrada.cupom : '').trim().toUpperCase();
  if (cupom && cupom === (config.cupom.codigo || '').toUpperCase() && subtotal >= (config.cupom.minimo || 0)) {
    descontoPct = config.cupom.desconto || 0;
    cupomUsado = cupom;
  }

  const desconto = Math.round(subtotal * descontoPct) / 100;
  const total = Math.round((subtotal - desconto) * 100) / 100;

  return {
    ok: true,
    pedido: {
      itens,
      subtotal,
      descontoPct,
      desconto,
      total,
      cupom: cupomUsado
    }
  };
}

module.exports = { normalizaConfig, normalizaPedido };
