/* =========================================================
   GH ROLEPLAY — Loja (React)
   Porta 1:1 o antigo scripts.js: mesmo visual (classes do
   styles.css), mesmos comportamentos, config com prioridade
   servidor > localStorage > padrão de fábrica.
   ========================================================= */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import {
  mesclar, lerConfigLocal, escreverConfigLocal, puxarConfigServidor,
  BRL, slugProduto, fimDoDia, irParaProduto
} from '../lib/util.js';
import Icone, { Coroa, FiguraPodio, Louro, Estrelas, CheckSvg } from '../lib/Icone.jsx';
import { Reveal, Contador, useDatilo, FundoGH } from './efeitos.jsx';
import {
  usarIdioma, salvarIdioma, IDIOMAS,
  usarMoeda, salvarMoeda, MOEDAS, formatarPreco,
  usarCursor, salvarCursor, CURSORES, cssCursor,
  usarPreferencia
} from '../lib/i18n.js';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, lerConfigLocal() || {});

/* nomes no estilo ProLeague: DEFAULT / GTA VI / HALLOWEEN / NATAL */
const TEMAS = [
  { id: 'laranja', nome: 'DEFAULT' },
  { id: 'rosa', nome: 'GTA VI' },
  { id: 'halloween', nome: 'HALLOWEEN', meses: [9], abreEm: '01/10' },
  { id: 'verde', nome: 'NATAL', meses: [11, 0], abreEm: '01/12' }
];

/* tema sazonal fica liberado só nos seus meses (getMonth: 9 = outubro, 11/0 = dez/jan) */
function temaDisponivel(th) {
  if (!th.meses) return true;
  return th.meses.includes(new Date().getMonth());
}

/* ofertas sazonais no topo (estilo ProLeague): aparecem só na estação certa */
function eventosDaEstacao() {
  const hoje = new Date();
  const mes = hoje.getMonth();
  if (mes === 9) return [{ id: 'halloween', nome: 'eventoHalloween', texto: 'eventoHalloweenTexto', ate: '31/10' }];
  if (mes === 11 && hoje.getDate() <= 25) return [{ id: 'natal', nome: 'eventoNatal', texto: 'eventoNatalTexto', ate: '25/12' }];
  return [];
}

function FaixaEventos() {
  const { t } = usarIdioma();
  const eventos = eventosDaEstacao();
  if (!eventos.length) return null;
  return (
    <div className="faixa-eventos" role="region" aria-label={t('eventoVerOfertas')}>
      {eventos.map((ev) => (
        <a className="evento-card" href="#store" key={ev.id}>
          <div className="evento-info">
            <h3 className="evento-nome">{t(ev.nome)}</h3>
            <p className="evento-texto">{t(ev.texto)}</p>
          </div>
          <div className="evento-lado">
            <span className="evento-prazo">{t('eventoAcabaEm')}<strong>{ev.ate}</strong></span>
            <span className="evento-ver">{t('eventoVerOfertas')} <Icone nome="arrow-right" /></span>
          </div>
        </a>
      ))}
    </div>
  );
}

/* fecha o painel quando o clique vem de fora do elemento */
function usarFecharFora(ref, aberto, fechar) {
  useEffect(() => {
    if (!aberto) return undefined;
    const aoClicar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) fechar();
    };
    document.addEventListener('click', aoClicar);
    return () => document.removeEventListener('click', aoClicar);
  }, [aberto]);
}

/* =========================================================
   Banner de consentimento (Fase 4 / LGPD)
   ========================================================= */
function BannerConsentimento() {
  const [aceito, setAceito] = useState(() => {
    try { return localStorage.getItem('gh_consentimento') === '1'; } catch (e) { return true; }
  });
  const { t } = usarIdioma();
  if (aceito) return null;
  return (
    <div className="consentimento" role="region" aria-label="Aviso de cookies e dados">
      <p>
        {t('consentA')} <Link to="/privacidade">{t('privacidade')}</Link>{t('consentB')}
      </p>
      <button
        type="button"
        className="btn btn-primario"
        onClick={() => {
          try { localStorage.setItem('gh_consentimento', '1'); } catch (e) {}
          setAceito(true);
        }}
      >
        {t('aceito')}
      </button>
    </div>
  );
}

/* ---------- carrinho (localStorage) ---------- */
function carregarCarrinho(cfg) {
  try {
    const salvo = JSON.parse(localStorage.getItem('gh_carrinho'));
    if (Array.isArray(salvo)) return salvo.filter((n) => cfg.produtos.some((p) => p.nome === n));
  } catch (e) {}
  return [];
}

/* =========================================================
   Busca do cabeçalho (desktop, com resultados)
   ========================================================= */
function BuscaDesktop({ cfg }) {
  const [termo, setTermo] = useState('');
  const [aberta, setAberta] = useState(false);
  const caixaRef = useRef(null);
  const { t } = usarIdioma();
  const moeda = usarMoeda();
  usarFecharFora(caixaRef, aberta, () => setAberta(false));

  const termoLimpo = termo.trim().toLowerCase();
  const achados = termoLimpo ? cfg.produtos.filter((p) => p.nome.toLowerCase().includes(termoLimpo)).slice(0, 7) : [];

  const ir = (nome) => { irParaProduto(nome); setTermo(''); setAberta(false); };

  return (
    <div className="busca cab-busca" ref={caixaRef}>
      <Icone nome="search" className="busca-icone" aria-hidden="true" />
      <label htmlFor="campo-busca" className="sr-only">{t('buscar')}</label>
      <input
        id="campo-busca"
        type="search"
        className="busca-campo"
        placeholder={t('buscar')}
        autoComplete="off"
        value={termo}
        onChange={(e) => { setTermo(e.target.value); setAberta(!!e.target.value.trim()); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && achados.length) ir(achados[0].nome); }}
      />
      <div className="busca-resultados" role="region" aria-live="polite" hidden={!aberta || !termoLimpo}>
        {achados.length
          ? achados.map((p) => (
            <button type="button" className="busca-item" key={p.nome} onClick={() => ir(p.nome)}>
              <span className="busca-item-figura" style={{ background: `linear-gradient(140deg, ${p.cores[0]}, ${p.cores[1]})` }}><Icone nome={p.icone} /></span>
              <span><span className="busca-item-nome">{p.nome}</span><br /><span className="busca-item-preco">{formatarPreco(p.preco, moeda)}</span></span>
            </button>
          ))
          : termoLimpo ? <p className="busca-vazia">{t('nadaEncontrado')}</p> : null}
      </div>
    </div>
  );
}

/* =========================================================
   Faixa de categorias com setas de rolagem
   ========================================================= */
function FaixaCategorias({ cfg }) {
  const trilhoRef = useRef(null);
  const [pos, setPos] = useState({ esq: false, dir: false });
  const { t } = usarIdioma();

  const atualizar = () => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const max = trilho.scrollWidth - trilho.clientWidth;
    setPos({ esq: trilho.scrollLeft > 4, dir: trilho.scrollLeft < max - 4 });
  };

  useEffect(() => {
    const t = setTimeout(atualizar, 300);
    window.addEventListener('resize', atualizar);
    return () => { clearTimeout(t); window.removeEventListener('resize', atualizar); };
  }, [cfg.categorias]);

  const rolar = (delta) => trilhoRef.current && trilhoRef.current.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <nav className="faixa-categorias" aria-label={t('rodapeLoja')}>
      <button type="button" className="cat-seta" aria-label={t('verCategoria')} hidden={!pos.esq} onClick={() => rolar(-260)}><Icone nome="chevron-left" /></button>
      <ul className="cat-trilho" ref={trilhoRef} onScroll={atualizar}>
        {cfg.categorias.map((cat) => (
          <li key={cat.id}><a href={`#secao-${cat.id}`} className="cat-link">{cat.nome}</a></li>
        ))}
      </ul>
      <button type="button" className="cat-seta" aria-label={t('verCategoria')} hidden={!pos.dir} onClick={() => rolar(260)}><Icone nome="chevron-right" /></button>
    </nav>
  );
}

/* =========================================================
   Card de produto (com contagem regressiva na categoria destaque)
   ========================================================= */
function ContagemRegressiva() {
  const fim = useRef(fimDoDia());
  const [texto, setTexto] = useState('23:59:59');

  useEffect(() => {
    const tique = () => {
      const faltam = Math.max(0, fim.current - Date.now());
      const h = String(Math.floor(faltam / 3600000)).padStart(2, '0');
      const m = String(Math.floor(faltam / 60000) % 60).padStart(2, '0');
      const s = String(Math.floor(faltam / 1000) % 60).padStart(2, '0');
      setTexto(`${h}:${m}:${s}`);
    };
    tique();
    const t = setInterval(tique, 1000);
    return () => clearInterval(t);
  }, []);

  return <span className="card-contagem">{texto}</span>;
}

function CardProduto({ p, comPromo, idx, onAdd }) {
  const [ok, setOk] = useState(false);
  const [c1, c2] = p.cores || ['#2a2030', '#141118'];
  const { t } = usarIdioma();
  const moeda = usarMoeda();
  const desconto = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) + '% OFF' : null;

  const aoAdicionar = () => {
    onAdd(p.nome);
    setOk(true);
    setTimeout(() => setOk(false), 800);
  };

  return (
    <Reveal tag="article" className="produto-card" id={slugProduto(p.nome)} delay={Math.min(idx * 0.05, 0.3)}>
      <div className="produto-marcas" aria-hidden={p.imagem ? undefined : 'true'}>
        <div className={`produto-marca-fig${p.imagem ? ' com-imagem' : ''}`} style={{ '--c1': c1, '--c2': c2 }}>
          {p.imagem
            ? <img className="produto-img" src={p.imagem} alt={p.nome} loading="lazy" />
            : <Icone nome={p.icone} />}
        </div>
        {desconto ? <span className="marca-desconto">{desconto}</span> : null}
        {p.tag ? <span className="marca-tag"><Icone nome="flame" />{p.tag}</span> : null}
        {comPromo && desconto ? (
          <span className="produto-contagem"><Icone nome="timer" /><ContagemRegressiva /></span>
        ) : null}
      </div>
      <div className="produto-corpo">
        <h3 className="produto-nome">
          <Link className="produto-nome-link" to={'/produto/' + slugProduto(p.nome).replace(/^produto-/, '')}>
            {p.nome}
          </Link>
        </h3>
        <p className="produto-meta"><Icone nome="zap" />{t('entregaInstantanea')}</p>
        <div className="produto-preco">
          {p.precoAntigo ? <span className="preco-antigo">{formatarPreco(p.precoAntigo, moeda)}</span> : null}
          <span className="preco-atual">{formatarPreco(p.preco, moeda)}</span>
        </div>
        <div className="produto-acoes">
          <button type="button" className={`btn-adicionar${ok ? ' ok' : ''}`} onClick={aoAdicionar}>
            <Icone nome="shopping-cart" /> {t('adicionar')}
          </button>
        </div>
      </div>
    </Reveal>
  );
}

/* =========================================================
   QR de demonstração (mesma fórmula do original)
   ========================================================= */
function QrFake() {
  const fixa = new Set(['0_0', '0_1', '0_2', '0_3', '0_4', '0_5', '0_6', '1_0', '1_6', '2_0', '2_2', '2_3', '2_6', '3_0', '3_2', '3_6', '4_0', '4_6', '5_0', '5_6', '6_0', '6_1', '6_2', '6_3', '6_4', '6_5', '6_6', '7_6', '8_6']);
  const celulas = [];
  for (let l = 0; l < 9; l++) {
    for (let c = 0; c < 9; c++) {
      const cheia = fixa.has(`${l}_${c}`) || (l * 9 + c * 7) % 3 === 0 || (l + c) % 5 === 0 || (l * 3 + c) % 4 === 1;
      celulas.push(<i key={`${l}-${c}`} className={cheia ? '' : 'f'} />);
    }
  }
  return <div className="qr-fake" aria-label="QR Code demonstrativo">{celulas}</div>;
}

/* =========================================================
   App da loja
   ========================================================= */
export default function App() {
  const [cfg, setCfg] = useState(CONFIG_INICIAL);
  const [carrinho, setCarrinho] = useState(() => carregarCarrinho(CONFIG_INICIAL));
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [buscaMobile, setBuscaMobile] = useState('');
  const [ajustesAberto, setAjustesAberto] = useState(false);
  const [suporteAberto, setSuporteAberto] = useState(false);
  const [abaCupom, setAbaCupom] = useState(false);
  const [abaBrinde, setAbaBrinde] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [animOff, setAnimOff] = useState(document.documentElement.dataset.anim === 'off');
  const [tema, setTema] = useState(document.documentElement.dataset.tema || CONFIG_INICIAL.temaPadrao || 'laranja');
  const [online, setOnline] = useState(CONFIG_INICIAL.servidor.jogadores);

  /* preferências do visitante (painel de ajustes, estilo ProLeague) */
  const { t } = usarIdioma();
  const idioma = usarPreferencia('gh_idioma', 'pt'); // re-render quando trocar
  const moeda = usarMoeda();
  const cursor = usarCursor();

  /* preço na moeda de referência escolhida (cobrança segue em reais) */
  const preco = (v) => formatarPreco(v, moeda);

  const ajustesRef = useRef(null);
  const suporteRef = useRef(null);
  const cupomRef = useRef(null);
  const brindeRef = useRef(null);
  const buscaMobileRef = useRef(null);
  const heroRef = useRef(null);

  /* frases do datilo ficam travadas no primeiro carregamento
     (igual ao original: config do servidor não reinicia a digitação) */
  const frasesRef = useRef(CONFIG_INICIAL.frasesHero);
  const datiloLigado = !animOff && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tela = useDatilo(frasesRef.current, datiloLigado);

  usarFecharFora(ajustesRef, ajustesAberto, () => setAjustesAberto(false));
  usarFecharFora(suporteRef, suporteAberto, () => setSuporteAberto(false));
  usarFecharFora(cupomRef, abaCupom, () => setAbaCupom(false));
  usarFecharFora(brindeRef, abaBrinde, () => setAbaBrinde(false));

  /* título da página acompanha o nome da loja */
  useEffect(() => { document.title = cfg.loja; }, [cfg.loja]);

  /* config do servidor tem prioridade (chega depois: o site pinta rápido) */
  useEffect(() => {
    let vivo = true;
    puxarConfigServidor().then((cfgServidor) => {
      if (vivo && cfgServidor) setCfg(mesclar(CONFIG_BASE, cfgServidor));
    });
    return () => { vivo = false; };
  }, []);

  /* "jogadores online" flutua como número ao vivo (base do boot, como no original) */
  useEffect(() => {
    const base = CONFIG_INICIAL.servidor.jogadores;
    const t = setInterval(() => {
      setOnline(Math.max(1, base + Math.floor(Math.sin(Date.now() / 9000) * 12)));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  /* Escape fecha tudo */
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return;
      setCarrinhoAberto(false);
      setAjustesAberto(false);
      setSuporteAberto(false);
      setAbaCupom(false);
      setAbaBrinde(false);
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, []);

  /* gaveta do carrinho trava o scroll */
  useEffect(() => {
    document.body.style.overflow = carrinhoAberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [carrinhoAberto]);

  /* luz do fundo segue o mouse */
  useEffect(() => {
    const aoMover = (e) => {
      document.documentElement.style.setProperty('--luz-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--luz-y', e.clientY + 'px');
    };
    window.addEventListener('pointermove', aoMover, { passive: true });
    return () => window.removeEventListener('pointermove', aoMover);
  }, []);

  /* ---------- carrinho ---------- */
  const salvarCarrinho = (lista) => { try { localStorage.setItem('gh_carrinho', JSON.stringify(lista)); } catch (e) {} };

  const adicionar = (nome) => {
    setCarrinho((atual) => { const nova = [...atual, nome]; salvarCarrinho(nova); return nova; });
  };

  const remover = (nome, todas = false) => {
    setCarrinho((atual) => {
      let nova;
      if (todas) nova = atual.filter((n) => n !== nome);
      else {
        const i = atual.indexOf(nome);
        nova = i >= 0 ? atual.filter((n, idx) => idx !== i) : atual;
      }
      salvarCarrinho(nova);
      return nova;
    });
  };

  const qtdDe = (nome) => carrinho.filter((n) => n === nome).length;
  const soma = carrinho.reduce((acc, nome) => {
    const prod = cfg.produtos.find((p) => p.nome === nome);
    return acc + (prod ? prod.preco : 0);
  }, 0);

  const unicos = [...new Set(carrinho)].sort((a, b) => qtdDe(b) - qtdDe(a));

  /* ---------- tema + animações ---------- */
  const escolherTema = (id) => {
    document.documentElement.dataset.tema = id;
    try { localStorage.setItem('gh_tema', id); } catch (e) {}
    setTema(id);
  };

  const alternarAnim = () => {
    const vaiReligar = animOff;
    if (vaiReligar) {
      delete document.documentElement.dataset.anim;
      try { localStorage.removeItem('gh_anim'); } catch (e) {}
    } else {
      document.documentElement.dataset.anim = 'off';
      try { localStorage.setItem('gh_anim', 'off'); } catch (e) {}
    }
    setAnimOff(!vaiReligar);
  };

  const copiarCupom = async () => {
    try { await navigator.clipboard.writeText(cfg.cupom.codigo); } catch (e) {}
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1600);
  };

  /* "Aplicar cupom" do carrinho (estilo ProLeague): o checkout já
     preenche o cupom sozinho — o botão leva direto pra lá */
  const navegar = useNavigate();
  const aplicarCupom = () => navegar('/checkout');

  /* vídeo tutorial do brinde: usa o primeiro link do Youtube cadastrado */
  const tutorialLink = (cfg.links || []).find((l) => /youtube/i.test(l.nome + ' ' + (l.url || '')) && l.url && l.url !== '#');

  const alternarBuscaMobile = () => {
    const vaiAbrir = !buscaMobileAberta;
    setBuscaMobileAberta(vaiAbrir);
    if (vaiAbrir) requestAnimationFrame(() => buscaMobileRef.current && buscaMobileRef.current.focus());
  };

  /* textos derivados */
  const textoAnuncio = (cfg.anuncio || '')
    .replaceAll('{cod}', `<span class="anuncio-codigo">${cfg.cupom.codigo}</span>`)
    .replaceAll('{pct}', String(cfg.cupom.desconto));

  const falta = Math.max(0, cfg.cupom.minimo - soma);
  const textoProgressoHtml = falta > 0
    ? t('faltaCupom', { v: preco(falta), p: String(cfg.cupom.desconto), c: cfg.cupom.codigo || '' })
    : t('cupomLiberado', { p: String(cfg.cupom.desconto) });
  const barraCupom = cfg.cupom.minimo > 0
    ? (Math.min(soma, cfg.cupom.minimo) / cfg.cupom.minimo * 100)
    : 100;

  const filtroMobile = buscaMobile.trim().toLowerCase();

  return (
    <>
      <a href="#conteudo" className="skip-link">{t('pular')}</a>

      {/* ===== Barra de anúncio ===== */}
      <div id="anuncio" className="anuncio">
        <p dangerouslySetInnerHTML={{ __html: textoAnuncio }} />
      </div>

      {/* ===== Cabeçalho ===== */}
      <FaixaEventos />
      <header id="cabecalho" className="cabecalho">
        <div className="container">
          <nav className="cab-nav" aria-label="Navegação principal">
            <div className="cab-esquerda">
              <Link to="/" className="marca">
                <span className="marca-logo" aria-hidden="true">{cfg.logoIniciais}</span>
                <span className="marca-nome">
                  <span className="marca-titulo">{cfg.loja}</span>
                  <Icone nome="shield-check" className="marca-verificado" aria-label="Loja verificada" />
                </span>
              </Link>

              <BuscaDesktop cfg={cfg} />
            </div>

            {cfg.podio.length > 0 && (
              <a href="#podio" className="pilula-ranking" aria-label="Ranking dos maiores apoiadores">
                {cfg.podio.slice(0, 3).map((p, i) => (
                  <span className="pilula-item" key={p.nome + i} title={`${i + 1}º ${p.nome} · ${p.valor}`}>
                    <Coroa style={{ width: 11, height: 11, color: 'hsl(var(--primary))' }} />
                    <span className="pilula-fig">{p.nome.charAt(0)}</span>
                    <span>{p.nome}</span>
                  </span>
                ))}
              </a>
            )}

            <ul className="cab-acoes">
              <li>
                <button
                  type="button"
                  className="btn-icone"
                  aria-label={t('buscar')}
                  aria-expanded={buscaMobileAberta}
                  aria-controls="busca-mobile"
                  onClick={alternarBuscaMobile}
                >
                  <Icone nome="search" />
                </button>
              </li>

              <li className="ajustes-wrap" ref={ajustesRef}>
                <button
                  type="button"
                  className="btn-icone"
                  aria-haspopup="dialog"
                  aria-expanded={ajustesAberto}
                  aria-label={t('ajustes')}
                  onClick={() => setAjustesAberto(!ajustesAberto)}
                >
                  <Icone nome="settings" />
                </button>
                <div className="painel ajustes-painel" role="dialog" aria-label="Ajustes do site" hidden={!ajustesAberto}>
                  <p className="painel-secao">{t('movimento')}</p>
                  <button type="button" className="chave" aria-pressed={animOff} onClick={alternarAnim}>
                    <span className="chave-nome">{t('reduzirAnim')}</span>
                    <span className="chave-trilho" aria-hidden="true"><span className="chave-bolinha"></span></span>
                  </button>
                  <p className="painel-dica">{t('reduzirAnimDica')}</p>

                  <p className="painel-secao">{t('corLoja')}</p>
                  <div className="painel-grupo" role="radiogroup" aria-label={t('corLoja')}>
                    {TEMAS.map((th) => {
                      const bloqueada = !temaDisponivel(th);
                      return (
                        <button
                          type="button"
                          role="radio"
                          className="painel-opcao"
                          key={th.id}
                          data-tema-opcao={th.id}
                          aria-checked={tema === th.id}
                          disabled={bloqueada}
                          title={bloqueada ? t('temaDisponivelEm', { d: th.abreEm }) : undefined}
                          onClick={() => escolherTema(th.id)}
                        >
                          <span className={`amostra amostra-${th.id}`} aria-hidden="true"></span>
                          <span className="painel-nome">{th.nome}</span>
                          {bloqueada ? <span className="tema-cadeado"><Icone nome="lock" />{th.abreEm}</span>
                            : <Icone nome="check" className="opcao-visto" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="painel-dica">{t('corDica')}</p>

                  <p className="painel-secao">{t('idioma')}</p>
                  <div className="painel-grupo" role="radiogroup" aria-label={t('idioma')}>
                    {IDIOMAS.map((i) => (
                      <button
                        type="button"
                        role="radio"
                        className="painel-opcao"
                        key={i.id}
                        aria-checked={idioma === i.id}
                        onClick={() => salvarIdioma(i.id)}
                      >
                        <span className="painel-bandeira" aria-hidden="true">{i.bandeira}</span>
                        <span className="painel-nome">{i.nome}</span>
                        <Icone nome="check" className="opcao-visto" />
                      </button>
                    ))}
                  </div>

                  <p className="painel-secao">{t('moeda')}</p>
                  <div className="painel-grupo" role="radiogroup" aria-label={t('moeda')}>
                    {MOEDAS.map((m) => (
                      <button
                        type="button"
                        role="radio"
                        className="painel-opcao"
                        key={m.id}
                        aria-checked={moeda === m.id}
                        onClick={() => salvarMoeda(m.id)}
                      >
                        <span className="painel-bandeira painel-bandeira-simbolo" aria-hidden="true">{m.simbolo}</span>
                        <span className="painel-nome">{m.nome}</span>
                        <Icone nome="check" className="opcao-visto" />
                      </button>
                    ))}
                  </div>
                  <p className="painel-dica">{t('moedaDica')}</p>

                  <p className="painel-secao">{t('cursor')}</p>
                  <div className="painel-grupo painel-cursores" role="radiogroup" aria-label={t('cursor')}>
                    {CURSORES.map((c) => (
                      <button
                        type="button"
                        role="radio"
                        className={`painel-opcao painel-cursor${c.id !== 'sistema' && c.css ? ' painel-cursor-teste' : ''}`}
                        key={c.id}
                        style={c.css ? { cursor: c.css } : undefined}
                        aria-checked={cursor === c.id}
                        onClick={() => salvarCursor(c.id)}
                      >
                        <span className={`painel-cursor-fig${c.id === 'sistema' ? ' vazia' : ''}`} aria-hidden="true">
                          {c.id !== 'sistema' ? <span className="painel-cursor-ponteiro" style={c.css ? { cursor: c.css } : undefined}></span> : null}
                        </span>
                        <span className="painel-nome">{t(c.chaveNome)}</span>
                        <Icone nome="check" className="opcao-visto" />
                      </button>
                    ))}
                  </div>
                  <p className="painel-dica">{t('cursorDica')}</p>
                </div>
              </li>

              <li className="suporte-wrap" ref={suporteRef}>
                <button
                  type="button"
                  className="btn-icone"
                  aria-haspopup="dialog"
                  aria-expanded={suporteAberto}
                  aria-label={t('suporte')}
                  onClick={() => setSuporteAberto(!suporteAberto)}
                >
                  <Icone nome="headset" />
                </button>
                <div className="painel ajustes-painel" role="dialog" aria-label={t('canais')} hidden={!suporteAberto}>
                  <p className="painel-secao">{t('canais')}</p>
                  <div className="painel-grupo">
                    {cfg.links.map((l, i) => (
                      <a className="painel-opcao" href={l.url} target="_blank" rel="noopener" key={i}>
                        <Icone nome={l.icone} />
                        <span className="painel-nome">{l.nome}</span>
                      </a>
                    ))}
                  </div>
                  {cfg.email ? (
                    <a className="painel-opcao suporte-email" href={'mailto:' + cfg.email}>
                      <Icone nome="mail" />
                      <span className="painel-nome">{t('suporteEmail')} <small>{cfg.email}</small></span>
                    </a>
                  ) : null}
                  <p className="painel-dica">{t('canaisDica')}</p>
                </div>
              </li>

              <li>
                <Link to="/conta" className="btn btn-secundario btn-entrar" aria-label={t('entrar')}>
                  <Icone nome="user" className="btn-icone-expandida" />
                  <span className="btn-rotulo">{t('entrar')}</span>
                </Link>
              </li>
              <li>
                <button type="button" className="btn btn-primario" aria-label={t('carrinho')} onClick={() => setCarrinhoAberto(true)}>
                  <Icone nome="shopping-cart" className="btn-icone-expandida" />
                  <span className="btn-rotulo">{t('carrinho')}</span>
                </button>
              </li>
            </ul>
          </nav>

          <FaixaCategorias cfg={cfg} />

          {/* Busca mobile */}
          <div className="busca busca-mobile" id="busca-mobile" hidden={!buscaMobileAberta}>
            <Icone nome="search" className="busca-icone" aria-hidden="true" />
            <label htmlFor="campo-busca-mobile" className="sr-only">{t('buscar')}</label>
            <input
              ref={buscaMobileRef}
              id="campo-busca-mobile"
              type="search"
              className="busca-campo"
              placeholder={t('buscar')}
              autoComplete="off"
              value={buscaMobile}
              onChange={(e) => setBuscaMobile(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { setBuscaMobile(''); e.currentTarget.blur(); }
              }}
            />
          </div>
        </div>
      </header>

      {/* ===== Fundo com grade + luz ===== */}
      <div className="fundo-pagina" aria-hidden="true">
        <div className="fundo-grade"><i className="grade-luz"></i></div>
      </div>

      {/* ===== Carrinho (gaveta lateral) ===== */}
      <div id="carrinho" className="carrinho" role="dialog" aria-modal="true" aria-labelledby="carrinho-titulo" hidden={!carrinhoAberto}>
        <div className="carrinho-sombra" onClick={() => setCarrinhoAberto(false)}></div>
        <aside className="carrinho-caixa">
          <div className="carrinho-topo">
            <h4 id="carrinho-titulo">{t('carrinho')}</h4>
            <button type="button" className="btn-icone" aria-label={t('fecharCarrinho')} onClick={() => setCarrinhoAberto(false)}>
              <Icone nome="x" />
            </button>
          </div>

          <div className="carrinho-lista">
            {unicos.length === 0 ? (
              <div className="carrinho-vazio">
                <Icone nome="shopping-cart" />
                {t('carrinhoVazio1')}<br />{t('carrinhoVazio2')}
              </div>
            ) : unicos.map((nome) => {
              const p = cfg.produtos.find((x) => x.nome === nome);
              if (!p) return null;
              const [c1, c2] = p.cores || ['#2a2030', '#141118'];
              return (
                <div className="carrinho-item" key={nome}>
                  <span className={`carrinho-item-fig${p.imagem ? ' com-imagem' : ''}`} style={{ '--c1': c1, '--c2': c2 }}>
                    {p.imagem
                      ? <img className="carrinho-item-img" src={p.imagem} alt={p.nome} loading="lazy" />
                      : <Icone nome={p.icone} />}
                  </span>
                  <div className="carrinho-item-info">
                    <p className="carrinho-item-nome">{p.nome}</p>
                    <div className="carrinho-item-controles">
                      <button type="button" className="carrinho-qty" aria-label={t('menosUm')} onClick={() => remover(nome)}><Icone nome="minus" /></button>
                      <span className="carrinho-qty-n">{qtdDe(nome)}</span>
                      <button type="button" className="carrinho-qty" aria-label={t('maisUm')} onClick={() => adicionar(nome)}><Icone nome="plus" /></button>
                      <button type="button" className="carrinho-item-remover" aria-label={t('removerItem')} onClick={() => remover(nome, true)}><Icone nome="x" /></button>
                    </div>
                  </div>
                  <div className="carrinho-item-lado">
                    <span className="carrinho-item-preco">{preco(p.preco * qtdDe(nome))}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="carrinho-pe">
            <div className="cupom-progresso">
              <div className="cupom-progresso-topo">
                <p dangerouslySetInnerHTML={{ __html: textoProgressoHtml }} />
                <Icone nome="ticket-percent" aria-hidden="true" />
              </div>
              <div className="cupom-progresso-trilha">
                <div className="cupom-progresso-barra" style={{ width: barraCupom + '%' }}></div>
              </div>
              <button type="button" className="cupom-aplicar" aria-label={t('aplicarCupom', { c: cfg.cupom.codigo })} onClick={aplicarCupom}>
                <Icone nome="ticket-percent" /> {t('aplicarCupom', { c: cfg.cupom.codigo })}
              </button>
            </div>
            <div className="carrinho-total">
              <span>{t('total')}</span>
              <strong>{preco(soma)}</strong>
            </div>
            <Link
              to="/checkout"
              className="btn btn-primario btn-grande"
              aria-label={t('irCheckout')}
              onClick={() => setCarrinhoAberto(false)}
              style={unicos.length === 0 ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
            >
              <Icone nome="lock" /> {t('finalizarCompra')}
            </Link>
            <button type="button" className="carrinho-continuar" onClick={() => setCarrinhoAberto(false)}>{t('continuarComprando')}</button>
          </div>
        </aside>
      </div>

      <main id="conteudo" tabIndex={-1}>
        {/* ===== Banner (hero) ===== */}
        <section className="hero" id="banner" ref={heroRef}
          onPointerMove={(e) => {
            const hero = heroRef.current;
            if (!hero) return;
            const r = hero.getBoundingClientRect();
            hero.style.setProperty('--foco-x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            hero.style.setProperty('--foco-y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
            /* normalizados 0..1: o pódio 3D e os estilhaços usam pra inclinar */
            hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width).toFixed(3));
            hero.style.setProperty('--my', ((e.clientY - r.top) / r.height).toFixed(3));
          }}
        >
          <div className="hero-fundo" aria-hidden="true"></div>
          <div className="hero-fundimento" aria-hidden="true"></div>
          <FundoGH />

          <div className="container hero-grade">
            <div className="hero-texto">
              {cfg.tiktokLive ? (
                <a className="hero-tiktok" href={cfg.tiktokLive} target="_blank" rel="noopener">
                  <span className="tiktok-ponto" aria-hidden="true"></span>
                  {t('tiktokLive')} <Icone nome="arrow-up-right" />
                </a>
              ) : null}
              <h1 className="hero-titulo">
                <span className="sr-only">{t('srHero')}</span>
                <span className="datilo" aria-hidden="true">
                  <span className="datilo-linha">{tela.inicio}</span>
                  <span className="datilo-cursor" hidden={!tela.mostrar1}></span>
                  <span className="datilo-linha datilo-destaque">{tela.destaque}</span>
                  <span className="datilo-cursor datilo-cursor-2" hidden={!tela.mostrar2}></span>
                </span>
              </h1>

              <p className="hero-pilares">{cfg.pilares}</p>

              <div className="hero-acoes">
                <a href={cfg.servidor.link} className="hero-servidor">
                  <span className="servidor-online">
                    <span className="servidor-ponto" aria-hidden="true"></span>
                    <strong>{online}</strong>
                    <span>{t('onlineAgora')}</span>
                  </span>
                  <span className="servidor-conectar">{t('conectar')} <Icone nome="arrow-up-right" /></span>
                </a>
                <a href="#store" className="btn btn-primario btn-grande">
                  <Icone nome="arrow-down" /> {t('explorar')}
                </a>
              </div>
            </div>

            {/* Pódio: os 3 maiores apoiadores */}
            <div className="podio-palco">
              <span className="podio-estilhaços" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
              <ol className="banner-podio" id="podio" aria-label={t('podioLabel')}>
                {cfg.podio.slice(0, 3).map((p, i) => (
                  <Reveal tag="li" className="podio-lugar" key={p.nome + i} data-posicao={String(i + 1)} delay={0.15 + i * 0.08}>
                    <span className="podio-figura">
                      <span className="podio-coroa" aria-hidden="true"><Coroa className="podio-coroa-desenho" /></span>
                      <span className="podio-avatar" aria-hidden="true"><span className="podio-avatar-miolo">{p.nome.charAt(0)}</span></span>
                      <span className="sr-only">{i + 1}º lugar:</span>
                      <span className="podio-nome"><FiguraPodio /><span>{p.nome}</span></span>
                      <span className="podio-valor">{p.valor}</span>
                    </span>
                    <span className="podio-degrau" aria-hidden="true">
                      <span className="podio-face podio-face-esq"></span>
                      <span className="podio-face podio-face-dir"></span>
                      <span className="podio-face podio-face-topo"></span>
                      <span className="podio-louro podio-louro-esq"><Louro /></span>
                      <span className="podio-numero">{i + 1}</span>
                      <span className="podio-louro podio-louro-dir"><Louro /></span>
                    </span>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>

          {/* Barra de pagamentos */}
          <div className="hero-pagamentos">
            <div className="container hero-pay-conteudo">
              <div className="pay-esquerda">
                <span className="pay-pagamento-seguro"><Icone nome="shield-check" /> {t('pagSeguro')}</span>
                <span className="pay-chips">
                  {cfg.pagamentos.map((nome) => (
                    <span className="pay-chip" key={nome}><Icone nome="circle-check" />{nome}</span>
                  ))}
                </span>
              </div>
              <a href="#store" className="pay-ver-catalogo">{t('verCatalogo')} <Icone nome="arrow-down" /></a>
            </div>
          </div>
        </section>

        {/* ===== Números da loja ===== */}
        <section className="container numeros" id="numeros" aria-label={t('podioLabel')}>
          {cfg.numeros.map((n, i) => (
            <Reveal className="numero-card" key={i}>
              <Icone nome={n.icone} className="numero-icone" aria-hidden="true" />
              <div>
                <p className="numero-valor">
                  {n.prefixo ? <span className="numero-prefixo">{n.prefixo}</span> : null}
                  <Contador valor={n.valor} decimais={n.decimais || 0} />
                </p>
                <p className="numero-rotulo">{n.rotulo}</p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ===== Catálogo ===== */}
        <section className="container loja" id="store">
          <div>
            {cfg.categorias.map((cat) => {
              const itens = cfg.produtos.filter((p) => p.categoria === cat.id);
              if (!itens.length) return null;
              const visiveis = filtroMobile
                ? itens.filter((p) => p.nome.toLowerCase().includes(filtroMobile))
                : itens;
              return (
                <div className={`categoria-secao${cat.destaque ? ' destaque' : ''}`} id={`secao-${cat.id}`} key={cat.id}>
                  <Reveal className="cat-cabeca">
                    <span className="cat-cabeca-traco" aria-hidden="true"></span>
                    <h3 className="cat-cabeca-titulo">{cat.nome}</h3>
                    <span className="cat-cabeca-qtd">{itens.length}<span className="sr-only"> {t('produtosPalavra')}</span></span>
                    <span className="cat-cabeca-linha" aria-hidden="true"></span>
                    <a href={`#secao-${cat.id}`} className="cat-cabeca-ver" aria-label={`${t('verCategoria')} ${cat.nome}`}>
                      <span>{t('verCategoria')}</span>
                      <Icone nome="arrow-right" />
                    </a>
                    {cat.descricao ? <p className="cat-cabeca-desc">{cat.descricao}</p> : null}
                  </Reveal>
                  <div className="grid-produtos" data-lista-cards>
                    {visiveis.map((p, idx) => (
                      <CardProduto p={p} comPromo={cat.destaque} idx={idx} key={p.nome} onAdd={adicionar} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Depoimentos ===== */}
        <section className="container depoimentos" id="depoimentos" aria-labelledby="depoimentos-titulo">
          <h2 className="secao-titulo" id="depoimentos-titulo">{t('depoimentosTitulo')}</h2>
          <div className="depoimentos-faixa">
            <div className="depoimentos-trilho">
              {cfg.depoimentos.map((d, i) => (
                <article className="depoimento" key={i}>
                  <span className="canto-mira" aria-hidden="true"></span>
                  <div className="depoimento-topo">
                    <span className="depoimento-avatar" aria-hidden="true">{d.nome.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <p className="depoimento-nome">{d.nome}</p>
                      <div className="depoimento-estrelas" role="img" aria-label={t('estrelasAria', { n: String(d.nota) })}><Estrelas nota={d.nota} /></div>
                    </div>
                  </div>
                  <p className="depoimento-texto">{d.texto}</p>
                  <div className="depoimento-pe">
                    <span className="depoimento-item">
                      <span className="depoimento-item-fig"><Icone nome="package" /></span>
                      <span>{d.produto}</span>
                    </span>
                    <span>{d.data}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ===== Rodapé ===== */}
      <footer className="rodape">
        <div className="container rodape-grade">
          <div className="rodape-marca">
            <Link to="/" className="marca">
              <span className="marca-logo" aria-hidden="true">{cfg.logoIniciais}</span>
              <span className="rodape-marca-nome">{cfg.loja}</span>
            </Link>
            <p className="rodape-descricao">{t('rodapeDescricao')}</p>
          </div>
          <nav className="rodape-coluna" aria-label={t('rodapeLoja')}>
            <p className="rodape-titulo">{t('rodapeLoja')}</p>
            <a href="#store">{t('catalogo')}</a>
            <a href="#podio">{t('ranking')}</a>
            <button type="button" onClick={() => setCarrinhoAberto(true)}>{t('carrinho')}</button>
          </nav>
          <nav className="rodape-coluna" aria-label={t('rodapeAjuda')}>
            <p className="rodape-titulo">{t('rodapeAjuda')}</p>
            <Link to="/conta">{t('meusPedidos')}</Link>
            <Link to="/terms">{t('termos')}</Link>
            <Link to="/privacidade">{t('privacidade')}</Link>
            <a href="#contato">{t('contato')}</a>
            <Link to="/admin">{t('painelDono')}</Link>
          </nav>
          <div className="rodape-coluna">
            <p className="rodape-titulo">{t('rodapeComunidade')}</p>
            <div className="rodape-redes">
              {cfg.links.map((l, i) => (
                <a className="rede-social" href={l.url} target="_blank" rel="noopener" aria-label={l.nome} title={l.nome} key={i}>
                  <Icone nome={l.icone} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="rodape-barra">
          <div className="container rodape-barra-conteudo">
            <p>{t('rodapeNotaA')} <Link to="/admin" className="rodape-barra-link">{t('painelDono')}</Link>{t('rodapeNotaB')}</p>
            <p>Copyright © 2026 {cfg.loja}</p>
          </div>
        </div>
      </footer>

      {/* ===== Banner de consentimento (LGPD) ===== */}
      <BannerConsentimento />

      {/* ===== Aba de cupom (esquerda) ===== */}
      <div className="cupom-widget" id="cupom-widget" ref={cupomRef}>
        <button
          type="button"
          className="aba aba-esquerda"
          aria-expanded={abaCupom}
          aria-controls="painel-cupom"
          onClick={() => { setAbaBrinde(false); setAbaCupom(!abaCupom); }}
        >
          <Icone nome="ticket-percent" aria-hidden="true" />
          <span>{t('cupomWidget')}</span>
        </button>
        <div className="aba-painel painel-cupom" id="painel-cupom" hidden={!abaCupom}>
          <p className="painel-rotulo"><Icone nome="ticket-percent" className="size-icon" /> {t('cupomDisponivel')}</p>
          <p className="painel-titulo">{t('cupomTitulo', { p: String(cfg.cupom.desconto) })}</p>
          <p className="painel-texto">{t('cupomUse')}</p>
          <div className="cupom-caixa">
            <span>{cfg.cupom.codigo}</span>
            <button type="button" className={copiado ? 'copiado' : ''} aria-label={t('copiarCupom')} onClick={copiarCupom}>
              {copiado ? <CheckSvg width={16} height={16} /> : <Icone nome="copy" />}
            </button>
          </div>
          <p className="painel-nota">{cfg.cupom.minimo > 0 ? t('cupomValidoMin', { v: preco(cfg.cupom.minimo) }) : t('cupomValido')}</p>
        </div>
      </div>

      {/* ===== Aba de brinde (direita) ===== */}
      <div className="brinde-widget" id="brinde-widget" ref={brindeRef}>
        <button
          type="button"
          className="aba aba-direita"
          aria-expanded={abaBrinde}
          aria-controls="painel-brinde"
          onClick={() => { setAbaCupom(false); setAbaBrinde(!abaBrinde); }}
        >
          <Icone nome="gift" aria-hidden="true" />
          <span>{t('brinde')}</span>
        </button>
        <div className="aba-painel painel-brinde" id="painel-brinde" hidden={!abaBrinde}>
          <p className="painel-rotulo"><Icone nome="gift" className="size-icon" /> {t('brinde')}</p>
          <p className="painel-titulo">{t('brindeTitulo')}</p>
          <p className="painel-texto">{t('brindeUse')}</p>
          <QrFake />
          {tutorialLink ? (
            <a className="painel-video" href={tutorialLink.url} target="_blank" rel="noopener">
              <Icone nome="play" /> {t('brindeVideo')}
            </a>
          ) : null}
          <p className="painel-nota">{t('brindeNota')}</p>
        </div>
      </div>
    </>
  );
}
