/* =========================================================
   GH ROLEPLAY — Lógica da loja

   As configurações que aparecem AQUI são o padrão. Quando o
   dono salva algo no painel (admin.html), entra uma camada
   salva no navegador (localStorage) por cima delas.
   ========================================================= */

/* CONFIG PADRAO vive em config-base.js (carregado antes deste arquivo) */

/* ---------- CONFIG final = padrão + salvas do admin ---------- */
const CHAVE_CONFIG = 'gh_config';

function mesclar(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  if (base && typeof base === 'object' && extra && typeof extra === 'object') {
    const saida = { ...base };
    for (const k of Object.keys(extra)) saida[k] = mesclar(base[k], extra[k]);
    return saida;
  }
  return extra === undefined ? base : extra;
}

let salvoAdmin = null;
try { salvoAdmin = JSON.parse(localStorage.getItem(CHAVE_CONFIG)); } catch (e) {}
let CONFIG = mesclar(CONFIG_BASE, salvoAdmin || {});

/* =========================================================
   Utilidades
   ========================================================= */
const $  = (sel, escopo = document) => escopo.querySelector(sel);
const $$ = (sel, escopo = document) => Array.from(escopo.querySelectorAll(sel));

const BRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function aplicarNome() {
  document.title = CONFIG.loja;
  $('#marca-nome').textContent = CONFIG.loja;
  $('#rodape-nome').textContent = CONFIG.loja;
  $$('.marca-logo').forEach((el) => { el.textContent = CONFIG.logoIniciais; });
  $('#anuncio p').innerHTML = (CONFIG.anuncio || '')
    .replaceAll('{cod}', `<span class="anuncio-codigo">${CONFIG.cupom.codigo}</span>`)
    .replaceAll('{pct}', String(CONFIG.cupom.desconto));
  $('#cupom-progresso-texto').innerHTML =
    'Faltam <strong>R$ —</strong> para ' + CONFIG.cupom.desconto + '% OFF';
  $('#hero-pilares').textContent = CONFIG.pilares;
  $('#servidor-num').textContent = CONFIG.servidor.jogadores;
  $('#hero-servidor').href = CONFIG.servidor.link;
}

/* =========================================================
   Tema + animações
   ========================================================= */
const TEMA_CHAVE = 'gh_tema';

function montarTemas() {
  const opcoes = $$('[data-tema-opcao]');
  const atual = document.documentElement.dataset.tema || CONFIG.temaPadrao || 'laranja';
  opcoes.forEach((op) => op.setAttribute('aria-checked', String(op.dataset.temaOpcao === atual)));

  opcoes.forEach((op) => op.addEventListener('click', () => {
    const tema = op.dataset.temaOpcao;
    document.documentElement.dataset.tema = tema;
    try { localStorage.setItem(TEMA_CHAVE, tema); } catch (e) {}
    opcoes.forEach((o) => o.setAttribute('aria-checked', String(o === op)));
  }));
}

function montarChaveAnimacao() {
  const chave = $('#chave-animacao');
  chave.setAttribute('aria-pressed', String(document.documentElement.dataset.anim === 'off'));
  chave.addEventListener('click', () => {
    const vaiReligar = chave.getAttribute('aria-pressed') === 'true';
    if (vaiReligar) {
      delete document.documentElement.dataset.anim;
      try { localStorage.removeItem('gh_anim'); } catch (e) {}
    } else {
      document.documentElement.dataset.anim = 'off';
      try { localStorage.setItem('gh_anim', 'off'); } catch (e) {}
    }
    chave.setAttribute('aria-pressed', String(!vaiReligar));
    iniciarDatilo.reset(vaiReligar);
  });
}

const animsDesligadas = () =>
  document.documentElement.dataset.anim === 'off' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   Título com efeito de digitação
   ========================================================= */
const iniciarDatilo = (() => {
  let timer = null;
  let ativo = false;

  const linha = $('#datilo-inicio');
  const destaqueEl = $('#datilo-destaque');
  const c1 = $('#cursor-1');
  const c2 = $('#cursor-2');

  if (!linha || !destaqueEl) return { reset() {} };

  const frases = CONFIG.frasesHero;
  const espera = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });

  async function ciclo() {
    for (const item of frases) {
      if (!ativo) return;
      linha.textContent = ''; destaqueEl.textContent = '';
      c1.hidden = false; c2.hidden = true;

      for (const ch of item.inicio)      { linha.textContent += ch; await espera(55); }
      c1.hidden = true; c2.hidden = false;
      for (const ch of item.destaque)    { destaqueEl.textContent += ch; await espera(55); }
      await espera(2200);
      for (let i = item.destaque.length; i > 0 && ativo; i--) { destaqueEl.textContent = item.destaque.slice(0, i - 1); await espera(22); }
      c2.hidden = true; c1.hidden = false;
      for (let i = item.inicio.length; i > 0 && ativo; i--)   { linha.textContent = item.inicio.slice(0, i - 1); await espera(22); }
      await espera(350);
    }
  }

  function start() {
    if (ativo || !frases.length) return;
    if (animsDesligadas()) return;               // frase inicial fica estática
    ativo = true;
    ciclo();
  }

  function stop() {
    ativo = false;
    if (timer) clearTimeout(timer);
    const primeira = frases[0] || { inicio: linha.textContent, destaque: destaqueEl.textContent };
    linha.textContent = primeira.inicio;
    destaqueEl.textContent = primeira.destaque;
    c1.hidden = false; c2.hidden = true;
  }

  function reset(ligandoAnim) { ligandoAnim ? start() : stop(); }

  return { start, stop, reset };
})();

/* =========================================================
   Destaques suaves ao rolar
   ========================================================= */
function montarReveal() {
  const alvo = $$('.reveal');
  if (!alvo.length) return;
  if (animsDesligadas()) { alvo.forEach((el) => el.classList.add('visivel')); return; }
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  alvo.forEach((el) => obs.observe(el));
}

/* =========================================================
   Contadores
   ========================================================= */
function montarNumeros() {
  const caixa = $('#numeros');
  caixa.innerHTML = CONFIG.numeros.map((n) => `
    <div class="numero-card reveal">
      <i data-lucide="${n.icone}" class="numero-icone" aria-hidden="true"></i>
      <div>
        <p class="numero-valor">
          ${n.prefixo ? `<span class="numero-prefixo">${n.prefixo}</span>` : ''}
          <span data-contar="${n.valor}" data-decimais="${n.decimais || 0}">0</span>
        </p>
        <p class="numero-rotulo">${n.rotulo}</p>
      </div>
    </div>
  `).join('');
}

function animarContadores() {
  $$('[data-contar]').forEach((el) => {
    const fim = parseFloat(el.dataset.contar);
    const dec = parseInt(el.dataset.decimais || '0', 10);
    const fmt = (v) => dec
      ? v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      : Math.floor(v).toLocaleString('pt-BR');

    if (animsDesligadas()) { el.textContent = fmt(fim); return; }

    const obs = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      const dur = 1300; const t0 = performance.now();
      const passo = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(fim * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.4 });
    obs.observe(el);
  });
}

/* =========================================================
   Pódio + mini-ranking
   ========================================================= */
const coroaSvg = `<svg class="podio-coroa-desenho" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>`;

function montarPodio() {
  const ol = $('#podio');
  ol.innerHTML = CONFIG.podio.slice(0, 3).map((p, i) => `
    <li class="podio-lugar reveal" data-posicao="${i + 1}" style="--delay:${0.15 + i * 0.08}s">
      <span class="podio-figura">
        <span class="podio-coroa" aria-hidden="true">${coroaSvg}</span>
        <span class="podio-avatar" aria-hidden="true">${p.nome.charAt(0)}</span>
        <span class="podio-nome"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:12px;height:12px"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 9"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 9"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg><span>${p.nome}</span></span>
        <span class="podio-valor">${p.valor}</span>
      </span>
      <span class="podio-degrau" aria-hidden="true"><span class="podio-numero">${i + 1}</span></span>
    </li>
  `).join('');

  // mini-ranking do cabeçalho
  const pilula = $('#pilula-ranking');
  if (CONFIG.podio.length) {
    pilula.hidden = false;
    pilula.innerHTML = CONFIG.podio.slice(0, 3).map((p, i) => `
      <span class="pilula-item" title="${i + 1}º ${p.nome} · ${p.valor}">
        ${coroaSvg}
        <span class="pilula-fig">${p.nome.charAt(0)}</span>
        <span>${p.nome}</span>
      </span>
    `).join('');
    $$('.pilula-item svg').forEach((s) => { s.style.width = '11px'; s.style.height = '11px'; s.style.color = 'hsl(var(--primary))'; });
  }
}

/* =========================================================
   Pagamentos (chips de texto)
   ========================================================= */
function montarPagamentos() {
  $('#pay-chips').innerHTML = CONFIG.pagamentos.map((nome) => `
    <span class="pay-chip"><i data-lucide="circle-check"></i>${nome}</span>
  `).join('');
}

/* =========================================================
   Catálogo
   ========================================================= */
function fimDoDia() {
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  return fim.getTime();
}

function montarCatalogo() {
  const raiz = $('#secoes-produtos');

  raiz.innerHTML = CONFIG.categorias.map((cat) => {
    const itens = CONFIG.produtos.filter((p) => p.categoria === cat.id);
    if (!itens.length) return '';
    return `
      <div class="categoria-secao ${cat.destaque ? 'destaque' : ''}" id="secao-${cat.id}">
        <div class="cat-cabeca reveal">
          <span class="cat-cabeca-traco" aria-hidden="true"></span>
          <h3 class="cat-cabeca-titulo">${cat.nome}</h3>
          <span class="cat-cabeca-qtd">${itens.length}<span class="sr-only"> produtos</span></span>
          <span class="cat-cabeca-linha" aria-hidden="true"></span>
          <a href="#secao-${cat.id}" class="cat-cabeca-ver" aria-label="Ver categoria ${cat.nome}">
            <span>Ver categoria</span>
            <i data-lucide="arrow-right"></i>
          </a>
        </div>
        <div class="grid-produtos" data-lista-cards>
          ${itens.map((p, idx) => cardProduto(p, cat.destaque, idx)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function cardProduto(p, comPromo, idx) {
  const [c1, c2] = p.cores || ['#2a2030', '#141118'];
  const desconto = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) + '% OFF' : null;
  return `
  <article class="produto-card reveal" id="produto-${p.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" style="--delay:${Math.min(idx * 0.05, 0.3)}s">
    <div class="produto-marcas" aria-hidden="true">
      <div class="produto-marca-fig" style="--c1:${c1};--c2:${c2}">
        <i data-lucide="${p.icone}"></i>
      </div>
      ${desconto ? `<span class="marca-desconto">${desconto}</span>` : ''}
      ${p.tag ? `<span class="marca-tag"><i data-lucide="flame"></i>${p.tag}</span>` : ''}
      ${comPromo && desconto ? `
      <span class="produto-contagem"><i data-lucide="timer"></i><span class="card-contagem" data-fim="${fimDoDia()}">23:59:59</span></span>` : ''}
    </div>
    <div class="produto-corpo">
      <h3 class="produto-nome">${p.nome}</h3>
      <p class="produto-meta"><i data-lucide="zap"></i>Entrega instantânea</p>
      <div class="produto-preco">
        ${p.precoAntigo ? `<span class="preco-antigo">${BRL(p.precoAntigo)}</span>` : ''}
        <span class="preco-atual">${BRL(p.preco)}</span>
      </div>
      <div class="produto-acoes">
        <button type="button" class="btn-adicionar" data-add="${p.nome}">
          <i data-lucide="shopping-cart"></i> Adicionar
        </button>
      </div>
    </div>
  </article>`;
}

function montarContagens() {
  const tique = () => {
    $$('.card-contagem').forEach((el) => {
      const faltam = Math.max(0, parseInt(el.dataset.fim, 10) - Date.now());
      const h = String(Math.floor(faltam / 3600000)).padStart(2, '0');
      const m = String(Math.floor(faltam / 60000) % 60).padStart(2, '0');
      const s = String(Math.floor(faltam / 1000) % 60).padStart(2, '0');
      el.textContent = `${h}:${m}:${s}`;
    });
  };
  tique();
  setInterval(tique, 1000);
}

/* =========================================================
   Faixa de categorias
   ========================================================= */
function montarFaixaCategorias() {
  const trilho = $('#cat-trilho');
  const esq = $('#cat-seta-esq');
  const dir = $('#cat-seta-dir');

  trilho.innerHTML = CONFIG.categorias.map((cat) => `
    <li><a href="#secao-${cat.id}" class="cat-link">${cat.nome}</a></li>
  `).join('');

  function atualizar() {
    const max = trilho.scrollWidth - trilho.clientWidth;
    esq.hidden = trilho.scrollLeft <= 4;
    dir.hidden = trilho.scrollLeft >= max - 4;
  }

  /* os listeners são ligados uma única vez (a função pode rodar de novo
     quando a config chega do servidor) */
  if (!trilho.dataset.vinculado) {
    trilho.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    esq.addEventListener('click', () => trilho.scrollBy({ left: -260, behavior: 'smooth' }));
    dir.addEventListener('click', () => trilho.scrollBy({ left: 260, behavior: 'smooth' }));
    trilho.dataset.vinculado = '1';
  }
  setTimeout(atualizar, 300);
}

/* =========================================================
   Depoimentos
   ========================================================= */
function montarDepoimentos() {
  const estrelas = (nota) => Array.from({ length: 5 }, (_, i) =>
    `<svg viewBox="0 0 24 24" class="${i < nota ? '' : 'vazia'}"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`
  ).join('');

  $('#depoimentos-trilho').innerHTML = CONFIG.depoimentos.map((d) => `
    <article class="depoimento">
      <span class="canto-mira" aria-hidden="true"></span>
      <div class="depoimento-topo">
        <span class="depoimento-avatar" aria-hidden="true">${d.nome.slice(0, 2).toUpperCase()}</span>
        <div>
          <p class="depoimento-nome">${d.nome}</p>
          <div class="depoimento-estrelas" role="img" aria-label="${d.nota} de 5 estrelas">${estrelas(d.nota)}</div>
        </div>
      </div>
      <p class="depoimento-texto">${d.texto}</p>
      <div class="depoimento-pe">
        <span class="depoimento-item">
          <span class="depoimento-item-fig"><i data-lucide="package"></i></span>
          <span>${d.produto}</span>
        </span>
        <span>${d.data}</span>
      </div>
    </article>
  `).join('');
}

/* =========================================================
   Busca
   ========================================================= */
function montarBusca() {
  const campo = $('#campo-busca');
  const caixa = $('#busca-resultados');
  const campoM = $('#campo-busca-mobile');

  function resultados(termo) {
    const t = termo.trim().toLowerCase();
    if (!t) { caixa.hidden = true; return; }
    const achados = CONFIG.produtos.filter((p) => p.nome.toLowerCase().includes(t)).slice(0, 7);
    caixa.innerHTML = achados.length
      ? achados.map((p) => `
        <button type="button" class="busca-item" data-ir="${p.nome}">
          <span class="busca-item-figura" style="background:linear-gradient(140deg, ${p.cores[0]}, ${p.cores[1]})"><i data-lucide="${p.icone}"></i></span>
          <span><span class="busca-item-nome">${p.nome}</span><br><span class="busca-item-preco">${BRL(p.preco)}</span></span>
        </button>`).join('')
      : `<p class="busca-vazia">Nenhum produto encontrado.</p>`;
    caixa.hidden = false;
    icons();
    $$('[data-ir]', caixa).forEach((b) => b.addEventListener('click', () => {
      irParaProduto(b.dataset.ir);
      caixa.hidden = true; campo.value = '';
    }));
  }

  campo.addEventListener('input', () => resultados(campo.value));
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const primeiro = $('.busca-item', caixa);
      if (primeiro) primeiro.click();
    }
  });
  document.addEventListener('click', (e) => {
    if (!caixa.hidden && !e.target.closest('#busca-desktop')) caixa.hidden = true;
  });

  // mobile: filtra direto na grade
  campoM.addEventListener('input', () => {
    const t = campoM.value.trim().toLowerCase();
    $$('.produto-card').forEach((card) => {
      card.style.display = !t || cardNome(card).toLowerCase().includes(t) ? '' : 'none';
    });
  });
  campoM.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') campoM.blur();
    if (e.key === 'Escape') { campoM.value = ''; campoM.dispatchEvent(new Event('input')); }
  });
}

function cardNome(card) {
  return $('.produto-nome', card)?.textContent.trim() || card.id.replace('produto-', '');
}

function irParaProduto(nome) {
  const id = 'produto-' + nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const alvo = document.getElementById(id);
  if (!alvo) return;
  alvo.scrollIntoView({ behavior: animsDesligadas() ? 'auto' : 'smooth', block: 'center' });
  alvo.style.borderColor = 'hsl(var(--primary))';
  setTimeout(() => { alvo.style.borderColor = ''; }, 1800);
}

/* =========================================================
   CARRINHO
   ========================================================= */
let carrinho = carregarCarrinho();

function carregarCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem('gh_carrinho'));
    if (Array.isArray(salvo)) return salvo.filter((n) => CONFIG.produtos.some((p) => p.nome === n));
  } catch (e) {}
  return [];
}

function salvarCarrinho() {
  try { localStorage.setItem('gh_carrinho', JSON.stringify(carrinho)); } catch (e) {}
}

function qtdDe(nome) { return carrinho.filter((n) => n === nome).length; }

function adicionarAoCarrinho(nome) {
  carrinho.push(nome);
  salvarCarrinho();
  desenharCarrinho();
}

function remover(nome, todas = false) {
  if (todas) carrinho = carrinho.filter((n) => n !== nome);
  else {
    const i = carrinho.indexOf(nome);
    if (i >= 0) carrinho.splice(i, 1);
  }
  salvarCarrinho();
  desenharCarrinho();
}

function total() {
  return carrinho.reduce((soma, nome) => {
    const prod = CONFIG.produtos.find((p) => p.nome === nome);
    return soma + (prod ? prod.preco : 0);
  }, 0);
}

function desenharCarrinho() {
  const lista = $('#carrinho-lista');
  const unicos = [...new Set(carrinho)];
  unicos.sort((a, b) => carrinho.filter((n) => n === b).length - carrinho.filter((n) => n === a).length);
  const contagem = unicos;

  if (!contagem.length) {
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <i data-lucide="shopping-cart"></i>
        Seu carrinho está vazio.<br>Explore o catálogo para começar.
      </div>`;
  } else {
    lista.innerHTML = contagem.map((nome) => {
      const p = CONFIG.produtos.find((x) => x.nome === nome);
      const [c1, c2] = p.cores || ['#2a2030', '#141118'];
      return `
      <div class="carrinho-item" data-item="${nome}">
        <span class="carrinho-item-fig" style="--c1:${c1};--c2:${c2}"><i data-lucide="${p.icone}"></i></span>
        <div class="carrinho-item-info">
          <p class="carrinho-item-nome">${p.nome}</p>
          <div class="carrinho-item-controles">
            <button type="button" class="carrinho-qty" data-menos="${nome}" aria-label="Menos um"><i data-lucide="minus"></i></button>
            <span class="carrinho-qty-n">${qtdDe(nome)}</span>
            <button type="button" class="carrinho-qty" data-mais="${nome}" aria-label="Mais um"><i data-lucide="plus"></i></button>
          </div>
        </div>
        <div class="carrinho-item-lado">
          <span class="carrinho-item-preco">${BRL(p.preco * qtdDe(nome))}</span>
          <button type="button" class="carrinho-item-remover" data-remover-tudo="${nome}" aria-label="Remover do carrinho"><i data-lucide="trash-2"></i></button>
        </div>
      </div>`;
    }).join('');
  }

  // totais + barra do cupom
  const soma = total();
  $('#carrinho-total-valor').textContent = BRL(soma);
  const falta = Math.max(0, CONFIG.cupom.minimo - soma);
  $('#cupom-progresso-texto').innerHTML = falta > 0
    ? `Faltam <strong>${BRL(falta)}</strong> para ${CONFIG.cupom.desconto}% OFF`
    : `<strong style="color:hsl(var(--primary))">Cupom liberado!</strong> ${CONFIG.cupom.desconto}% OFF pronto para usar`;
  $('#cupom-progresso-barra').style.width =
    (Math.min(soma, CONFIG.cupom.minimo) / CONFIG.cupom.minimo * 100) + '%';

  icons();
}

function abrirCarrinho() {
  const cx = $('#carrinho');
  cx.hidden = false;
  document.body.style.overflow = 'hidden';
}
function fecharCarrinho() {
  $('#carrinho').hidden = true;
  document.body.style.overflow = '';
}

/* =========================================================
   Finalizar compra via backend
   ========================================================= */
const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

async function finalizarCompra() {
  if (!carrinho.length) return;
  const contagens = {};
  carrinho.forEach((nome) => { contagens[nome] = (contagens[nome] || 0) + 1; });
  const itens = Object.entries(contagens).map(([nome, quantidade]) => ({ nome, quantidade }));

  const btn = $('#btn-checkout');
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '.6';

  let resposta = null;
  try {
    const r = await fetch(API_RAIZ + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens, cupom: CONFIG.cupom.codigo })
    });
    if (r.ok) resposta = await r.json();
  } catch (e) { /* sem servidor */ }

  btn.style.pointerEvents = '';
  btn.style.opacity = '';

  if (resposta && resposta.pedido) {
    const p = resposta.pedido;
    carrinho.length = 0;
    salvarCarrinho();
    $('#carrinho-lista').innerHTML = `
      <div class="carrinho-vazio pedido-ok">
        ${CHECK_SVG}
        <p><strong>Pedido ${p.id} recebido!</strong></p>
        <p>Total ${BRL(p.total)}${p.descontoPct ? ' · ' + p.descontoPct + '% OFF' : ''}</p>
        <p class="pedido-dica">Envie o comprovante no chat do servidor para o staff confirmar.</p>
      </div>`;
    $('#carrinho-total-valor').textContent = BRL(0);
  } else {
    const textoAntigo = btn.innerHTML;
    btn.innerHTML = 'Sem servidor — checkout indisponível';
    setTimeout(() => { btn.innerHTML = textoAntigo; icons(); }, 2600);
  }
}

function montarCarrinho() {
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      adicionarAoCarrinho(add.dataset.add);
      add.classList.add('ok');
      setTimeout(() => add.classList.remove('ok'), 800);
      return;
    }
    if (e.target.closest('[data-mais]'))   { adicionarAoCarrinho(e.target.closest('[data-mais]').dataset.mais); return; }
    if (e.target.closest('[data-menos]'))  { remover(e.target.closest('[data-menos]').dataset.menos); return; }
    if (e.target.closest('[data-remover-tudo]')) { remover(e.target.closest('[data-remover-tudo]').dataset.removerTudo, true); return; }
    if (e.target.closest('[data-abrir-carrinho]')) { abrirCarrinho(); return; }
    if (e.target.closest('[data-fechar-carrinho]')) { fecharCarrinho(); return; }
  });
  $('#btn-carrinho').addEventListener('click', abrirCarrinho);
  $('#btn-checkout').addEventListener('click', (e) => {
    e.preventDefault();
    finalizarCompra();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharCarrinho();
      fecharAjustes(); fecharSuporte();
      fecharAba('#painel-cupom', '#aba-cupom'); fecharAba('#painel-brinde', '#aba-brinde');
    }
  });
}

/* =========================================================
   Painéis do cabeçalho (ajustes / suporte) + abas fixas
   ========================================================= */
function alternar(btn, painel, abrir, fechar) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    painel.hidden ? abrir() : fechar();
  });
  document.addEventListener('click', (e) => {
    if (painel.hidden) return;
    if (!e.composedPath().includes(painel) && !btn.contains(e.target)) fechar();
  });
}

function fecharAjustes() { $('#painel-ajustes').hidden = true; $('#btn-ajustes').setAttribute('aria-expanded', 'false'); }
function fecharSuporte()  { $('#painel-suporte').hidden = true;  $('#btn-suporte').setAttribute('aria-expanded', 'false'); }

function abrirAba(painelSel, abaSel) {
  $(painelSel).hidden = false;
  $(abaSel).setAttribute('aria-expanded', 'true');
}
function fecharAba(painelSel, abaSel) {
  const painel = $(painelSel);
  if (painel.hidden) return;
  painel.hidden = true;
  $(abaSel).setAttribute('aria-expanded', 'false');
}

function montarPaineis() {
  alternar($('#btn-ajustes'), $('#painel-ajustes'),
    () => { $('#painel-ajustes').hidden = false; $('#btn-ajustes').setAttribute('aria-expanded', 'true'); },
    fecharAjustes);

  alternar($('#btn-suporte'), $('#painel-suporte'),
    () => { $('#painel-suporte').hidden = false; $('#btn-suporte').setAttribute('aria-expanded', 'true'); },
    fecharSuporte);

  $('#aba-cupom').addEventListener('click', () => {
    const aberto = $('#painel-cupom').hidden;
    fecharAba('#painel-brinde', '#aba-brinde');
    aberto ? abrirAba('#painel-cupom', '#aba-cupom') : fecharAba('#painel-cupom', '#aba-cupom');
  });
  $('#aba-brinde').addEventListener('click', () => {
    const aberto = $('#painel-brinde').hidden;
    fecharAba('#painel-cupom', '#aba-cupom');
    aberto ? abrirAba('#painel-brinde', '#aba-brinde') : fecharAba('#painel-brinde', '#aba-brinde');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#cupom-widget')) fecharAba('#painel-cupom', '#aba-cupom');
    if (!e.target.closest('#brinde-widget')) fecharAba('#painel-brinde', '#aba-brinde');
  });

  // copiar cupom
  $('#btn-copiar-cupom').addEventListener('click', async () => {
    const codigo = CONFIG.cupom.codigo;
    try { await navigator.clipboard.writeText(codigo); } catch (e) {}
    const btn = $('#btn-copiar-cupom');
    btn.classList.add('copiado');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    setTimeout(() => { btn.classList.remove('copiado'); btn.innerHTML = '<i data-lucide="copy"></i>'; icons(); }, 1600);
  });

  // busca mobile
  $('#btn-busca-mobile').addEventListener('click', () => {
    const caixa = $('#busca-mobile');
    const aberto = !caixa.hidden;
    caixa.hidden = aberto;
    $('#btn-busca-mobile').setAttribute('aria-expanded', String(!aberto));
    if (!aberto) $('#campo-busca-mobile').focus();
  });
}

/* =========================================================
   Suporte + redes do rodapé
   ========================================================= */
function montarLinks() {
  $('#links-suporte').innerHTML = CONFIG.links.map((l) => `
    <a class="painel-opcao" href="${l.url}" target="_blank" rel="noopener">
      <i data-lucide="${l.icone}"></i>
      <span class="painel-nome">${l.nome}</span>
    </a>
  `).join('');

  $('#rodape-redes').innerHTML = CONFIG.links.map((l) => `
    <a class="rede-social" href="${l.url}" target="_blank" rel="noopener" aria-label="${l.nome}" title="${l.nome}">
      <i data-lucide="${l.icone}"></i>
    </a>
  `).join('');
}

/* =========================================================
   QR de demonstração
   ========================================================= */
function montarQrFake() {
  const celulas = [];
  const fixa = new Set(['0_0','0_1','0_2','0_3','0_4','0_5','0_6','1_0','1_6','2_0','2_2','2_3','2_6','3_0','3_2','3_6','4_0','4_6','5_0','5_6','6_0','6_1','6_2','6_3','6_4','6_5','6_6','7_6','8_6']);
  for (let l = 0; l < 9; l++) {
    for (let c = 0; c < 9; c++) {
      const cheia = fixa.has(`${l}_${c}`) || (l * 9 + c * 7) % 3 === 0 || (l + c) % 5 === 0 || (l * 3 + c) % 4 === 1;
      celulas.push(`<i class="${cheia ? '' : 'f'}"></i>`);
    }
  }
  $('#qr-fake').innerHTML = celulas.join('');
}

/* =========================================================
   Luz do fundo seguindo o mouse
   ========================================================= */
function montarFundimento() {
  const hero = $('#banner');
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--foco-x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    hero.style.setProperty('--foco-y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });
  window.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--luz-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--luz-y', e.clientY + 'px');
  }, { passive: true });

  // "jogadores online" flutua um pouco, como um número ao vivo
  const num = $('#servidor-num');
  const base = CONFIG.servidor.jogadores;
  setInterval(() => {
    num.textContent = Math.max(1, base + Math.floor(Math.sin(Date.now() / 9000) * 12));
  }, 4000);
}

/* =========================================================
   Boot
   ========================================================= */
aplicarNome();
montarTemas();
montarChaveAnimacao();
montarNumeros();
montarPodio();
montarPagamentos();
montarCatalogo();
montarContagens();
montarFaixaCategorias();
montarDepoimentos();
montarLinks();
montarQrFake();
iniciarDatilo.start();
montarReveal();
animarContadores();
desenharCarrinho();
montarCarrinho();
montarPaineis();
montarBusca();
montarFundimento();
icons();

/* =========================================================
   Config vinda do servidor (apps/api) — tem prioridade
   Roda depois do boot: o site pinta rápido com o padrão/local
   e atualiza em seguida se houver config guardada no servidor.
   ========================================================= */
const API_RAIZ = (location.protocol === 'http:' || location.protocol === 'https:')
  ? ''
  : 'http://localhost:8123'; // site aberto por file:// fala com o servidor local

async function puxarConfigServidor() {
  try {
    const r = await fetch(API_RAIZ + '/api/config');
    if (!r.ok) return null;
    const dados = await r.json();
    return (dados && typeof dados === 'object' && !Array.isArray(dados)) ? dados : null;
  } catch (e) {
    return null; // sem servidor: fica com localStorage + padrão de fábrica
  }
}

/* Re-renderiza o que depende de CONFIG. Não religa listeners
   (montarCarrinho/montarBusca/temas/datilo ficam de fora de propósito). */
function reaplicarConfig() {
  aplicarNome();
  montarNumeros();
  animarContadores();
  montarPodio();
  montarPagamentos();
  montarCatalogo();
  montarFaixaCategorias();
  montarDepoimentos();
  montarLinks();
  montarReveal();
  desenharCarrinho();
  icons();
}

puxarConfigServidor().then((cfgServidor) => {
  if (!cfgServidor) return;
  CONFIG = mesclar(CONFIG_BASE, cfgServidor);
  reaplicarConfig();
});
