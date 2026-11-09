/* =========================================================
   ADMIN — painel do dono (GH Roleplay)
   Lê/escreve a configuração da loja no localStorage (gh_config).
   O site aplica essa configuração ao carregar (scripts.js).
   ========================================================= */

const $  = (sel, escopo = document) => escopo.querySelector(sel);
const $$ = (sel, escopo = document) => Array.from(escopo.querySelectorAll(sel));

const CHAVE_CONFIG = 'gh_config';
const CHAVE_SENHA  = 'gh_admin_senha';
const SENHA_PADRAO = 'admin123';

function mesclar(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  if (base && typeof base === 'object' && extra && typeof extra === 'object') {
    const saida = { ...base };
    for (const k of Object.keys(extra)) saida[k] = mesclar(base[k], extra[k]);
    return saida;
  }
  return extra === undefined ? base : extra;
}

function lerConfig() {
  let salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(CHAVE_CONFIG)); } catch (e) {}
  return mesclar(CONFIG_BASE, salvo || {});
}

function escreverConfig(cfg) {
  try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(cfg)); } catch (e) {}
}

/* =========================================================
   Ícones do Lucide oferecidos nos selects
   ========================================================= */
const ICONES = [
  'award','book','briefcase','building-2','car','coffee','crown','crosshair',
  'flag','flame','gem','gift','gamepad-2','ghost','hammer','heart','home','key',
  'map','medal','mic','music','package','party-popper','radio','refresh-cw','rocket',
  'shield','shirt','skull','sparkles','star','swords','target','ticket','timer',
  'trophy','users','zap'
];

const ICONES_OPTIONS = ICONES.map((i) => `<option value="${i}">${i}</option>`).join('');

/* =========================================================
   Login
   ========================================================= */
function senhaAtual() {
  try { return localStorage.getItem(CHAVE_SENHA) || SENHA_PADRAO; } catch (e) { return SENHA_PADRAO; }
}

/* =========================================================
   Conexão com o backend (apps/api) — com fallback para o modo
   local (sem servidor) que guarda tudo no navegador.
   ========================================================= */
const API_RAIZ = (location.protocol === 'http:' || location.protocol === 'https:')
  ? ''
  : 'http://localhost:8123';

function tokenSessao() {
  try { return sessionStorage.getItem('gh_admin_token'); } catch (err) { return null; }
}

function modoNome() {
  try { return sessionStorage.getItem('gh_admin_modo') || 'local'; } catch (err) { return 'local'; }
}

function cabecalhoAuth() {
  const token = tokenSessao();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function marcarModo() {
  const el = $('#modo-conexao');
  if (el) el.textContent = modoNome() === 'servidor' ? 'conectado ao servidor' : 'modo local (sem servidor)';
}

async function salvarNoServidor(cfg) {
  try {
    const r = await fetch(API_RAIZ + '/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cabecalhoAuth() },
      body: JSON.stringify(cfg)
    });
    if (r.ok) return 'ok';
    if (r.status === 401) return 'auth';
    return 'erro';
  } catch (e) {
    return 'offline';
  }
}

async function lerDoServidor() {
  try {
    const r = await fetch(API_RAIZ + '/api/config');
    if (!r.ok) return null;
    const dados = await r.json();
    return (dados && typeof dados === 'object' && !Array.isArray(dados)) ? dados : null;
  } catch (e) {
    return null;
  }
}

function mostrarErro(msg) {
  $('#login-erro').textContent = msg;
  $('#login-erro').hidden = false;
  $('#login-senha').focus();
}

function montarLogin() {
  $('#login-nome').textContent = CONFIG_BASE.loja;
  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const senha = $('#login-senha').value;
    let modo = 'local';
    let token = null;
    let entrouNoServidor = false;

    try {
      const r = await fetch(API_RAIZ + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      });
      if (r.ok) {
        const dados = await r.json();
        modo = 'servidor';
        token = dados.token;
        entrouNoServidor = true;
      } else if (r.status === 401) {
        mostrarErro('Senha incorreta.');
        return;
      } else if (r.status === 429) {
        mostrarErro('Muitas tentativas — espere um minutinho.');
        return;
      }
      /* outros erros do servidor → cai no modo local abaixo */
    } catch (err) { /* sem servidor: tenta o modo local */ }

    if (!entrouNoServidor && senha !== senhaAtual()) {
      mostrarErro('Senha incorreta.');
      return;
    }

    try {
      sessionStorage.setItem('gh_admin_ok', '1');
      sessionStorage.setItem('gh_admin_modo', modo);
      if (token) sessionStorage.setItem('gh_admin_token', token);
      else sessionStorage.removeItem('gh_admin_token');
    } catch (err) {}
    abrirPainel();
  });
}

async function abrirPainel() {
  $('#tela-login').hidden = true;
  $('#app').hidden = false;
  marcarModo();
  await montarTudo();
}

/* =========================================================
   Toast (com SVG embutido — funciona até sem internet)
   ========================================================= */
const SVG_OK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const SVG_ERRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

let toastTimer = null;
function toast(msg, ok = true) {
  const el = $('#toast');
  el.innerHTML = `${ok ? SVG_OK : SVG_ERRO}<span>${escapeHtml(msg)}</span>`;
  el.classList.toggle('ok', ok);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* =========================================================
   Helpers de formulário
   ========================================================= */
function campoTexto(seletor, valor) {
  $(seletor).value = valor === null || valor === undefined ? '' : valor;
}

function lerTexto(seletor) {
  return $(seletor).value.trim();
}

function lerNumero(seletor, padrao = 0) {
  const v = parseFloat($(seletor).value);
  return isNaN(v) ? padrao : v;
}

function slug(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'categoria';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* =========================================================
   Moldura da linha (campos + botão excluir)
   ========================================================= */
function linhaHtml(campos) {
  return `
    <div class="linha">
      ${campos}
      <button type="button" class="btn-excluir" data-excluir aria-label="Excluir linha"><i data-lucide="trash-2"></i></button>
    </div>`;
}

/* Seleciona os `<select data-prop="x">` da linha i para o valor do item i
   (chamar logo depois do innerHTML, na mesma ordem do array) */
function definirSelects(seletorLista, itens) {
  $$('.linha', $(seletorLista)).forEach((linha, i) => {
    const item = itens[i] || {};
    $$('select[data-prop]', linha).forEach((sel) => {
      const v = item[sel.dataset.prop];
      sel.value = (v === undefined || v === null) ? '' : String(v);
    });
  });
}

/* =========================================================
   Desenho dos repeaters (objeto → linhas de formulário)
   ========================================================= */
function desenharNumeros(numeros) {
  $('#lista-numeros').innerHTML = numeros.map((n) => linhaHtml(`
    <select class="campo b-medio" data-prop="icone">${ICONES_OPTIONS}</select>
    <input class="campo c-curto" data-prop="prefixo" value="${escapeHtml(n.prefixo || '')}" placeholder="+ de">
    <input class="campo b-medio" type="number" step="0.1" min="0" data-prop="valor" value="${n.valor}">
    <input class="campo c-curto" type="number" min="0" max="2" data-prop="decimais" value="${n.decimais || 0}">
    <input class="campo b-largo" data-prop="rotulo" value="${escapeHtml(n.rotulo)}" placeholder="Rótulo">
  `)).join('');
}

function desenharPodio(podio) {
  const tres = [podio[0], podio[1], podio[2]].map((p) => p || { nome: '', valor: '' });
  $('#lista-podio').innerHTML = tres.map((p, i) => linhaHtml(`
    <span class="c-curto" style="text-align:center;color:hsl(var(--primary));font-weight:800">${i + 1}º</span>
    <input class="campo b-medio" data-prop="nome" value="${escapeHtml(p.nome)}" placeholder="Nome">
    <input class="campo b-largo" data-prop="valor" value="${escapeHtml(p.valor)}" placeholder="R$ 0,00">
  `)).join('');
}

function desenharCategorias(cats) {
  $('#lista-categorias').innerHTML = cats.map((c) => linhaHtml(`
    <input class="campo b-largo" data-prop="nome" value="${escapeHtml(c.nome)}" placeholder="Nome exibido">
    <input class="campo b-medio campo-mono" data-prop="id" value="${escapeHtml(c.id)}" placeholder="id">
    <label style="display:flex;align-items:center;gap:.35rem;font-size:.74rem;color:#cfcfcf;cursor:pointer">
      <input type="checkbox" data-prop="destaque" ${c.destaque ? 'checked' : ''}>
      <span>destaque</span>
    </label>
  `)).join('');
}

function desenharProdutos(produtos, categorias) {
  const ops = categorias.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nome)}</option>`).join('');
  $('#lista-produtos').innerHTML = produtos.map((p) => linhaHtml(`
    <select class="campo b-medio" data-prop="categoria">${ops}</select>
    <input class="campo b-largo" data-prop="nome" value="${escapeHtml(p.nome)}" placeholder="Nome do produto">
    <input class="campo c-curto" type="number" step="0.01" min="0" data-prop="preco" value="${p.preco}" placeholder="R$">
    <input class="campo c-curto" type="number" step="0.01" min="0" data-prop="precoAntigo" value="${p.precoAntigo ?? ''}" placeholder="era R$">
    <select class="campo b-medio" data-prop="icone">${ICONES_OPTIONS}</select>
    <input type="color" class="b-cor" data-prop="cor1" value="${p.cores[0]}" title="Cor 1 do gradiente">
    <input type="color" class="b-cor" data-prop="cor2" value="${p.cores[1]}" title="Cor 2 do gradiente">
    <input class="campo b-medio" data-prop="tag" value="${escapeHtml(p.tag || '')}" placeholder="selo (opcional)">
  `)).join('');
  definirSelects('#lista-produtos', produtos);
}

function desenharDepoimentos(dep) {
  $('#lista-depoimentos').innerHTML = dep.map((d) => linhaHtml(`
    <input class="campo b-medio" data-prop="nome" value="${escapeHtml(d.nome)}" placeholder="Nome">
    <select class="campo c-curto" data-prop="nota">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${n} ★</option>`).join('')}</select>
    <input class="campo b-largo" data-prop="texto" value="${escapeHtml(d.texto)}" placeholder="Depoimento">
    <input class="campo b-medio" data-prop="produto" value="${escapeHtml(d.produto)}" placeholder="Produto">
    <input class="campo c-curto" data-prop="data" value="${escapeHtml(d.data)}" placeholder="quando">
  `)).join('');
  definirSelects('#lista-depoimentos', dep);
}

function desenharLinks(links) {
  $('#lista-links').innerHTML = links.map((l) => linhaHtml(`
    <input class="campo b-medio" data-prop="nome" value="${escapeHtml(l.nome)}" placeholder="Nome">
    <input class="campo b-largo campo-mono" data-prop="url" value="${escapeHtml(l.url)}" placeholder="https://...">
    <select class="campo b-medio" data-prop="icone">${ICONES_OPTIONS}</select>
  `)).join('');
  definirSelects('#lista-links', links);
}

/* =========================================================
   Coleta (linhas de formulário → objetos)
   ========================================================= */
function coletarLinha(linha) {
  const saida = {};
  $$('[data-prop]', linha).forEach((el) => {
    const prop = el.dataset.prop;
    if (el.type === 'checkbox') {
      saida[prop] = el.checked;
    } else if (el.type === 'number') {
      const v = parseFloat(el.value);
      saida[prop] = (el.value.trim() === '' || isNaN(v)) ? null : v;
    } else {
      saida[prop] = el.value.trim(); // input de texto, select e cor
    }
  });
  return saida;
}

function coletarNumeros() {
  return $$('#lista-numeros .linha').map((l) => {
    const o = coletarLinha(l);
    return {
      icone: o.icone || 'star',
      prefixo: o.prefixo || null,
      valor: o.valor === null ? 0 : o.valor,
      decimais: o.decimais === null ? 0 : Math.max(0, Math.min(2, Math.round(o.decimais))),
      rotulo: o.rotulo || ''
    };
  });
}

function coletarPodio() {
  return $$('#lista-podio .linha').map((l) => {
    const o = coletarLinha(l);
    return { nome: o.nome || '', valor: o.valor || '' };
  }).filter((p) => p.nome);
}

function coletarCategorias() {
  const usados = new Set();
  return $$('#lista-categorias .linha').map((l) => {
    const o = coletarLinha(l);
    const nome = (o.nome || '').trim();
    let id = (o.id || slug(nome)).replace(/[^a-z0-9-]/g, '').toLowerCase();
    let base = id;
    let n = 1;
    while (usados.has(id)) {
      n += 1;
      id = (base + '-' + n).replace(/[^a-z0-9-]/g, '').toLowerCase(); // ids não podem repetir
    }
    usados.add(id);
    return { nome, id, destaque: !!o.destaque };
  }).filter((c) => c.nome);
}

function coletarProdutos(categorias) {
  const idsValidos = categorias.map((c) => c.id);
  return $$('#lista-produtos .linha').map((l) => {
    const o = coletarLinha(l);
    const categoria = idsValidos.includes(o.categoria) ? o.categoria : (idsValidos[0] || 'vips');
    const preco = o.preco === null ? 0 : Math.max(0, o.preco);
    let precoAntigo = o.precoAntigo;
    if (precoAntigo !== null && precoAntigo <= preco) precoAntigo = null; // sem promoção inválida
    return {
      categoria,
      nome: (o.nome || '').trim() || 'Produto',
      preco,
      precoAntigo,
      icone: o.icone || 'package',
      cores: [o.cor1 || '#2a2030', o.cor2 || '#141118'],
      tag: o.tag || ''
    };
  });
}

function coletarDepoimentos() {
  return $$('#lista-depoimentos .linha').map((l) => {
    const o = coletarLinha(l);
    return {
      nome: o.nome || 'Anônimo',
      nota: Math.max(1, Math.min(5, Math.round(o.nota || 5))),
      texto: o.texto || '',
      produto: o.produto || '',
      data: o.data || ''
    };
  });
}

function coletarLinks() {
  return $$('#lista-links .linha').map((l) => {
    const o = coletarLinha(l);
    return { nome: o.nome || '', url: o.url || '#', icone: o.icone || 'link' };
  }).filter((x) => x.nome);
}

function coletarTudo() {
  if ($('#app').hidden) return lerConfig(); // painel fechado: nada foi digitado
  const cfg = lerConfig(); // partimos do atual para não perder campos sem editor

  cfg.loja         = lerTexto('#conf-loja') || CONFIG_BASE.loja;
  cfg.logoIniciais = (lerTexto('#conf-iniciais') || 'GH').toUpperCase().slice(0, 3);
  cfg.anuncio      = lerTexto('#conf-anuncio') || CONFIG_BASE.anuncio;
  cfg.cupom = {
    codigo: (lerTexto('#conf-cod') || 'CUPOM').toUpperCase(),
    desconto: Math.min(99, Math.max(1, lerNumero('#conf-desc', CONFIG_BASE.cupom.desconto))),
    minimo: Math.max(0, lerNumero('#conf-min', CONFIG_BASE.cupom.minimo))
  };
  cfg.servidor = {
    link: lerTexto('#conf-servlink') || '#',
    jogadores: Math.max(0, Math.round(lerNumero('#conf-servjog', CONFIG_BASE.servidor.jogadores)))
  };
  cfg.pagamentos = $('#conf-pag').value.split('\n').map((s) => s.trim()).filter(Boolean);
  cfg.frasesHero = $('#conf-frases').value.split('\n').map((s) => s.trim()).filter(Boolean).map((linha) => {
    const [inicio, destaque] = linha.split('|');
    return { inicio: (inicio || '').trim(), destaque: (destaque || '').trim() };
  }).filter((f) => f.inicio || f.destaque);
  cfg.pilares = lerTexto('#conf-pilares') || CONFIG_BASE.pilares;
  const temaEscolhido = $$('input[name="conf-tema"]').find((t) => t.checked);
  if (temaEscolhido) cfg.temaPadrao = temaEscolhido.value;

  cfg.numeros      = coletarNumeros();
  cfg.podio        = coletarPodio();
  cfg.categorias   = coletarCategorias();
  cfg.produtos     = coletarProdutos(cfg.categorias);
  cfg.depoimentos  = coletarDepoimentos();
  cfg.links        = coletarLinks();

  return cfg;
}

/* =========================================================
   Seções estáticas (objeto → campos fixos)
   ========================================================= */
function preencherCamposFixos(cfg) {
  campoTexto('#conf-loja', cfg.loja);
  campoTexto('#conf-iniciais', cfg.logoIniciais);
  campoTexto('#conf-anuncio', cfg.anuncio);
  campoTexto('#conf-cod', cfg.cupom.codigo);
  $('#conf-desc').value = cfg.cupom.desconto;
  $('#conf-min').value = cfg.cupom.minimo;
  campoTexto('#conf-servlink', cfg.servidor.link);
  $('#conf-servjog').value = cfg.servidor.jogadores;
  $('#conf-pag').value = cfg.pagamentos.join('\n');
  $('#conf-frases').value = cfg.frasesHero.map((f) => `${f.inicio}|${f.destaque}`).join('\n');
  campoTexto('#conf-pilares', cfg.pilares);
  $$('input[name="conf-tema"]').forEach((t) => { t.checked = t.value === (cfg.temaPadrao || 'laranja'); });
}

/* =========================================================
   Montagem completa
   ========================================================= */
async function montarTudo() {
  /* prioridade: config do servidor; espelha no navegador para o
     modo offline continuar coerente se o servidor sumir depois */
  const doServidor = await lerDoServidor();
  const cfg = doServidor || lerConfig();
  if (doServidor) escreverConfig(doServidor);

  $('#barra-nome').textContent = cfg.loja;
  $('#barra-iniciais').textContent = cfg.logoIniciais;
  preencherCamposFixos(cfg);
  desenharNumeros(cfg.numeros);
  desenharPodio(cfg.podio);
  desenharCategorias(cfg.categorias);
  desenharProdutos(cfg.produtos, cfg.categorias);
  desenharDepoimentos(cfg.depoimentos);
  desenharLinks(cfg.links);
  icons();
}

/* =========================================================
   Botões do topo
   ========================================================= */
function montarAcoes() {
  $('#btn-salvar').addEventListener('click', async () => {
    const cfg = coletarTudo();
    const resultado = await salvarNoServidor(cfg);
    if (resultado === 'ok') {
      escreverConfig(cfg); // espelha para o modo offline continuarem coerente
      toast('Configuração salva no servidor!');
      return;
    }
    escreverConfig(cfg); // guarda local para não perder a edição
    if (resultado === 'auth') toast('Sessão expirou — salvo no navegador. Entre de novo para enviar ao servidor.', false);
    else toast('Sem servidor — salvo localmente (só neste navegador).');
  });

  $('#btn-exportar').addEventListener('click', () => {
    const cfg = coletarTudo();
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gh-roleplay-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup exportado.');
  });

  $('#btn-importar').addEventListener('click', () => $('#input-importar').click());
  $('#input-importar').addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dados = JSON.parse(reader.result);
        if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new Error('formato');
        escreverConfig(dados);
        const resultado = await salvarNoServidor(dados);
        await montarTudo();
        toast(resultado === 'ok' ? 'Configuração importada e enviada ao servidor!' : 'Importado — salvo apenas neste navegador.');
      } catch (err) {
        toast('Arquivo inválido — use um JSON exportado pelo painel.', false);
      }
    };
    reader.readAsText(arquivo);
    e.target.value = '';
  });

  $('#btn-resetar').addEventListener('click', async () => {
    if (!confirm('Voltar tudo para o padrão de fábrica?')) return;
    let servidorOk = false;
    try {
      const r = await fetch(API_RAIZ + '/api/config', { method: 'DELETE', headers: cabecalhoAuth() });
      servidorOk = r.ok;
    } catch (e) { /* sem servidor */ }
    try { localStorage.removeItem(CHAVE_CONFIG); } catch (e) {}
    await montarTudo();
    toast(servidorOk ? 'Padrão de fábrica restaurado (no servidor e aqui).' : 'Restaurado apenas neste navegador.');
  });

  /* ----- Adicionar linha (preserva edições não salvas das linhas atuais) ----- */
  $$('[data-add-linha]').forEach((b) => b.addEventListener('click', () => {
    const qual = b.dataset.addLinha;
    if (qual === 'categorias') {
      const linhas = coletarCategorias();
      linhas.push({ nome: 'NOVA CATEGORIA', id: 'nova-' + Date.now().toString(36), destaque: false });
      desenharCategorias(linhas);
    }
    if (qual === 'produtos') {
      const cats = coletarCategorias();
      const itens = coletarProdutos(cats);
      itens.push({
        categoria: cats.length ? cats[0].id : 'vips',
        nome: 'NOVO PRODUTO', preco: 9.99, precoAntigo: null,
        icone: 'package', cores: ['#2a2030', '#141118'], tag: ''
      });
      desenharProdutos(itens, cats);
    }
    if (qual === 'depoimentos') {
      const itens = coletarDepoimentos();
      itens.push({ nome: 'Cliente', nota: 5, texto: '', produto: '', data: 'hoje' });
      desenharDepoimentos(itens);
    }
    if (qual === 'links') {
      const itens = coletarLinks();
      itens.push({ nome: 'Rede', url: '#', icone: 'link' });
      desenharLinks(itens);
    }
    icons();
  }));

  /* ----- Excluir linha (delegação, com confirmação) ----- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-excluir]');
    if (!btn) return;
    if (confirm('Remover esta linha? Ela vai valer quando você clicar em "Salvar tudo".')) {
      btn.closest('.linha').remove();
    }
  });

  /* ----- Abas laterais ----- */
  $$('.aba-lateral').forEach((b) => b.addEventListener('click', () => {
    $$('.aba-lateral').forEach((x) => x.classList.remove('ativa'));
    b.classList.add('ativa');
    $$('.secao').forEach((s) => s.classList.remove('ativa'));
    $(`[data-secao="${b.dataset.secaoBtn}"]`).classList.add('ativa');
    $$('.miolo').forEach((m) => { m.scrollTop = 0; });
  }));

  /* ----- Troca de senha (servidor primeiro, local como fallback) ----- */
  function limparCamposSenha() {
    $('#seg-atual').value = '';
    $('#seg-nova1').value = '';
    $('#seg-nova2').value = '';
  }
  $('#btn-senha').addEventListener('click', async () => {
    const atual = $('#seg-atual').value;
    const n1 = $('#seg-nova1').value;
    const n2 = $('#seg-nova2').value;
    if (!n1) { toast('Digite a nova senha.', false); return; }
    if (n1 !== n2) { toast('As duas senhas novas não são iguais.', false); return; }
    if (modoNome() === 'servidor') {
      try {
        const r = await fetch(API_RAIZ + '/api/auth/trocar-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...cabecalhoAuth() },
          body: JSON.stringify({ atual, nova: n1 })
        });
        const dados = await r.json().catch(() => ({}));
        if (r.ok) {
          limparCamposSenha();
          toast('Senha trocada no servidor!');
          return;
        }
        toast(dados.erro || 'Não foi possível trocar a senha no servidor.', false);
        return;
      } catch (e) { /* servidor sumiu → modo local */ }
    }
    if (atual !== senhaAtual()) { toast('Senha atual incorreta.', false); return; }
    try { localStorage.setItem(CHAVE_SENHA, n1); } catch (e) {}
    limparCamposSenha();
    toast('Senha trocada (modo local).');
  });
}

/* =========================================================
   Ícones + boot
   ========================================================= */
function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function boot() {
  let logado = false;
  try { logado = sessionStorage.getItem('gh_admin_ok') === '1'; } catch (e) {}
  if (logado) abrirPainel();
  else montarLogin();
  montarAcoes();
}

boot();
