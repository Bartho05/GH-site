/* =========================================================
   ADMIN — painel do dono (React)
   Porta 1:1 o antigo admin.js: edita a config da loja e envia
   ao servidor (PUT /api/config) com espelho no localStorage
   para o modo local (sem servidor) continuar funcionando.
   ========================================================= */
import { useState, useEffect, useRef } from 'react';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, lerConfigLocal, escreverConfigLocal, puxarConfigServidor, API_RAIZ } from '../lib/util.js';
import Icone, { CheckSvg } from '../lib/Icone.jsx';

const CHAVE_SENHA = 'gh_admin_senha';
const SENHA_PADRAO = 'admin123';

/* Ícones do Lucide oferecidos nos selects */
const ICONES = [
  'award', 'book', 'briefcase', 'building-2', 'car', 'coffee', 'crown', 'crosshair',
  'flag', 'flame', 'gem', 'gift', 'gamepad-2', 'ghost', 'hammer', 'heart', 'home', 'key',
  'map', 'medal', 'mic', 'music', 'package', 'party-popper', 'radio', 'refresh-cw', 'rocket',
  'shield', 'shirt', 'skull', 'sparkles', 'star', 'swords', 'target', 'ticket', 'timer',
  'trophy', 'users', 'zap'
];

const ABAS = [
  { id: 'geral', icone: 'sliders-horizontal', nome: 'Geral' },
  { id: 'banner', icone: 'megaphone', nome: 'Banner' },
  { id: 'tema', icone: 'palette', nome: 'Cor' },
  { id: 'numeros', icone: 'bar-chart-3', nome: 'Números' },
  { id: 'podio', icone: 'trophy', nome: 'Pódio' },
  { id: 'categorias', icone: 'folder', nome: 'Categorias' },
  { id: 'produtos', icone: 'package', nome: 'Produtos' },
  { id: 'depoimentos', icone: 'message-square', nome: 'Depoimentos' },
  { id: 'links', icone: 'link', nome: 'Links & redes' },
  { id: 'pedidos', icone: 'receipt', nome: 'Pedidos' },
  { id: 'seguranca', icone: 'lock', nome: 'Segurança' }
];

const ROTULOS_STATUS = { pendente: 'Pendente', pago: 'Pago', entregue: 'Entregue', cancelado: 'Cancelado' };

/* ---------- utilidades ---------- */
function senhaAtual() {
  try { return localStorage.getItem(CHAVE_SENHA) || SENHA_PADRAO; } catch (e) { return SENHA_PADRAO; }
}

function num(v, padrao = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? padrao : n;
}

function slug(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'categoria';
}

function dinheiro(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

/* config → rascunho editável (textareas como texto cru) */
function paraRascunho(cfg) {
  return {
    ...cfg,
    cupom: { ...CONFIG_BASE.cupom, ...(cfg.cupom || {}) },
    servidor: { ...CONFIG_BASE.servidor, ...(cfg.servidor || {}) },
    _pagTexto: (cfg.pagamentos || []).join('\n'),
    _frasesTexto: (cfg.frasesHero || []).map((f) => `${f.inicio}|${f.destaque}`).join('\n'),
    temaPadrao: cfg.temaPadrao || 'laranja',
    numeros: (cfg.numeros || []).map((n) => ({ ...n })),
    podio: [cfg.podio && cfg.podio[0], cfg.podio && cfg.podio[1], cfg.podio && cfg.podio[2]]
      .map((p) => p ? { ...p } : { nome: '', valor: '' }),
    categorias: (cfg.categorias || []).map((c) => ({ ...c })),
    produtos: (cfg.produtos || []).map((p) => ({ ...p, precoAntigo: p.precoAntigo ?? '' })),
    depoimentos: (cfg.depoimentos || []).map((d) => ({ ...d })),
    links: (cfg.links || []).map((l) => ({ ...l }))
  };
}

/* ---------- coleta/normalização (regras do antigo admin.js) ---------- */
function coletarNumeros(linhas) {
  return linhas.map((l) => ({
    icone: l.icone || 'star',
    prefixo: (l.prefixo || '').trim() || null,
    valor: num(l.valor, null) === null ? 0 : num(l.valor),
    decimais: (l.decimais === '' || l.decimais === null || l.decimais === undefined)
      ? 0
      : Math.max(0, Math.min(2, Math.round(num(l.decimais)))),
    rotulo: l.rotulo || ''
  }));
}

function coletarPodio(linhas) {
  return linhas.map((l) => ({ nome: (l.nome || '').trim(), valor: (l.valor || '').trim() }))
    .filter((p) => p.nome);
}

function coletarCategorias(linhas) {
  const usados = new Set();
  return linhas.map((l) => {
    const nome = (l.nome || '').trim();
    let id = (l.id || slug(nome)).replace(/[^a-z0-9-]/g, '').toLowerCase();
    const base = id;
    let n = 1;
    while (usados.has(id)) {
      n += 1;
      id = (base + '-' + n).replace(/[^a-z0-9-]/g, '').toLowerCase(); // ids não podem repetir
    }
    usados.add(id);
    return { nome, id, destaque: !!l.destaque };
  }).filter((c) => c.nome);
}

function coletarProdutos(linhas, categorias) {
  const idsValidos = categorias.map((c) => c.id);
  return linhas.map((l) => {
    const categoria = idsValidos.includes(l.categoria) ? l.categoria : (idsValidos[0] || 'vips');
    const precoNum = num(l.preco, null);
    const preco = precoNum === null ? 0 : Math.max(0, precoNum);
    const antigoNum = (l.precoAntigo === '' || l.precoAntigo === null || l.precoAntigo === undefined)
      ? null
      : num(l.precoAntigo, null);
    let precoAntigo = antigoNum;
    if (precoAntigo !== null && precoAntigo <= preco) precoAntigo = null; // sem promoção inválida
    return {
      categoria,
      nome: (l.nome || '').trim() || 'Produto',
      preco,
      precoAntigo,
      icone: l.icone || 'package',
      cores: [l.cor1 || '#2a2030', l.cor2 || '#141118'],
      tag: l.tag || ''
    };
  });
}

function coletarDepoimentos(linhas) {
  return linhas.map((l) => ({
    nome: l.nome || 'Anônimo',
    nota: Math.max(1, Math.min(5, Math.round(num(l.nota, 5)))),
    texto: l.texto || '',
    produto: l.produto || '',
    data: l.data || ''
  }));
}

function coletarLinks(linhas) {
  return linhas.map((l) => ({ nome: l.nome || '', url: l.url || '#', icone: l.icone || 'link' }))
    .filter((x) => x.nome);
}

/* rascunho → config normalizada (igual ao coletarTudo do original) */
function deRascunho(rascunho) {
  const r = rascunho;
  const cfg = { ...rascunho };
  delete cfg._pagTexto;
  delete cfg._frasesTexto;

  cfg.loja = (r.loja || '').trim() || CONFIG_BASE.loja;
  cfg.logoIniciais = ((r.logoIniciais || '').trim() || 'GH').toUpperCase().slice(0, 3);
  cfg.anuncio = (r.anuncio || '').trim() || CONFIG_BASE.anuncio;
  cfg.cupom = {
    codigo: ((r.cupom.codigo || '').trim() || 'CUPOM').toUpperCase(),
    desconto: Math.min(99, Math.max(1, num(r.cupom.desconto, CONFIG_BASE.cupom.desconto))),
    minimo: Math.max(0, num(r.cupom.minimo, CONFIG_BASE.cupom.minimo))
  };
  cfg.servidor = {
    link: (r.servidor.link || '').trim() || '#',
    jogadores: Math.max(0, Math.round(num(r.servidor.jogadores, CONFIG_BASE.servidor.jogadores)))
  };
  cfg.pagamentos = String(r._pagTexto || '').split('\n').map((s) => s.trim()).filter(Boolean);
  cfg.frasesHero = String(r._frasesTexto || '').split('\n').map((s) => s.trim()).filter(Boolean)
    .map((linha) => {
      const [inicio, destaque] = linha.split('|');
      return { inicio: (inicio || '').trim(), destaque: (destaque || '').trim() };
    })
    .filter((f) => f.inicio || f.destaque);
  cfg.pilares = (r.pilares || '').trim() || CONFIG_BASE.pilares;
  if (r.temaPadrao) cfg.temaPadrao = r.temaPadrao;

  cfg.numeros = coletarNumeros(r.numeros || []);
  cfg.podio = coletarPodio(r.podio || []);
  cfg.categorias = coletarCategorias(r.categorias || []);
  cfg.produtos = coletarProdutos(r.produtos || [], cfg.categorias);
  cfg.depoimentos = coletarDepoimentos(r.depoimentos || []);
  cfg.links = coletarLinks(r.links || []);

  return cfg;
}

/* ---------- molduras de linha dos repeaters ---------- */
function Linha({ children, onExcluir }) {
  return (
    <div className="linha">
      {children}
      <button type="button" className="btn-excluir" aria-label="Excluir linha" onClick={onExcluir}>
        <Icone nome="trash-2" />
      </button>
    </div>
  );
}

const OPCOES_ICONES = ICONES.map((i) => <option value={i} key={i}>{i}</option>);

/* =========================================================
   App do painel
   ========================================================= */
export default function App() {
  const [logado, setLogado] = useState(() => {
    try { return sessionStorage.getItem('gh_admin_ok') === '1'; } catch (e) { return false; }
  });
  const [modo, setModo] = useState(() => {
    try { return sessionStorage.getItem('gh_admin_modo') || 'local'; } catch (e) { return 'local'; }
  });
  const [token, setToken] = useState(() => {
    try { return sessionStorage.getItem('gh_admin_token') || null; } catch (e) { return null; }
  });

  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [entrando, setEntrando] = useState(false);

  const [rascunho, setRascunho] = useState(null);
  const [aba, setAba] = useState('geral');
  const [toast, setToast] = useState(null); // { msg, ok }
  const toastTimer = useRef(null);
  const inputArquivo = useRef(null);
  const mioloRef = useRef(null);

  /* campos da seção segurança */
  const [segAtual, setSegAtual] = useState('');
  const [segNova1, setSegNova1] = useState('');
  const [segNova2, setSegNova2] = useState('');

  /* seção pedidos */
  const [filtroPedidos, setFiltroPedidos] = useState('');
  const [pedidos, setPedidos] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [pedidosNota, setPedidosNota] = useState('');
  const [trocaEm, setTrocaEm] = useState(null);

  function toastMsg(msg, ok = true) {
    setToast({ msg, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function cabecalhoAuth() {
    return token ? { Authorization: 'Bearer ' + token } : {};
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

  /* ---------- carga da config (servidor tem prioridade) ---------- */
  async function carregar() {
    const doServidor = await puxarConfigServidor();
    if (doServidor) escreverConfigLocal(doServidor);
    setRascunho(paraRascunho(mesclar(CONFIG_BASE, doServidor || lerConfigLocal() || {})));
  }

  useEffect(() => {
    if (logado) carregar();
  }, [logado]);

  /* troca de aba volta o miolo ao topo (como no original) */
  useEffect(() => {
    if (mioloRef.current) mioloRef.current.scrollTop = 0;
  }, [aba]);

  /* ---------- pedidos ---------- */
  async function carregarPedidos() {
    if (modo !== 'servidor') {
      setPedidos(null);
      setResumo(null);
      setPedidosNota('Os pedidos ficam no servidor — entre pelo modo servidor para vê-los aqui.');
      return;
    }
    try {
      const r = await fetch(API_RAIZ + '/api/orders' + (filtroPedidos ? '?status=' + encodeURIComponent(filtroPedidos) : ''), { headers: cabecalhoAuth() });
      if (r.status === 401) {
        setPedidos(null);
        setPedidosNota('Sessão expirou — entre de novo para ver os pedidos.');
        return;
      }
      if (!r.ok) throw new Error('http ' + r.status);
      const dados = await r.json();
      setPedidos(dados.pedidos || []);
      setResumo(dados.resumo || null);
      setPedidosNota('');
    } catch (e) {
      setPedidos(null);
      setPedidosNota('Sem servidor para listar pedidos agora.');
    }
  }

  useEffect(() => {
    if (logado) carregarPedidos();
  }, [logado, filtroPedidos]);

  async function mudarStatusPedido(codigo, status) {
    setTrocaEm(codigo);
    try {
      const r = await fetch(API_RAIZ + '/api/orders/' + encodeURIComponent(codigo), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...cabecalhoAuth() },
        body: JSON.stringify({ status })
      });
      if (r.ok) {
        toastMsg('Pedido ' + codigo + ' → ' + (ROTULOS_STATUS[status] || status));
        await carregarPedidos();
      } else if (r.status === 401) {
        toastMsg('Sessão expirou — entre de novo.', false);
      } else {
        toastMsg('Não deu para atualizar o status.', false);
      }
    } catch (err) {
      toastMsg('Sem servidor para atualizar o status.', false);
    }
    setTrocaEm(null);
  }

  /* ---------- login ---------- */
  async function entrar(e) {
    e.preventDefault();
    setEntrando(true);
    const senha = senhaLogin;
    let novoModo = 'local';
    let novoToken = null;
    let entrouNoServidor = false;

    try {
      const r = await fetch(API_RAIZ + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      });
      if (r.ok) {
        const dados = await r.json();
        novoModo = 'servidor';
        novoToken = dados.token;
        entrouNoServidor = true;
      } else if (r.status === 401) {
        setEntrando(false);
        setErroLogin('Senha incorreta.');
        return;
      } else if (r.status === 429) {
        setEntrando(false);
        setErroLogin('Muitas tentativas — espere um minutinho.');
        return;
      }
      /* outros erros do servidor → cai no modo local abaixo */
    } catch (err) { /* sem servidor: tenta o modo local */ }

    if (!entrouNoServidor && senha !== senhaAtual()) {
      setEntrando(false);
      setErroLogin('Senha incorreta.');
      return;
    }

    try {
      sessionStorage.setItem('gh_admin_ok', '1');
      sessionStorage.setItem('gh_admin_modo', novoModo);
      if (novoToken) sessionStorage.setItem('gh_admin_token', novoToken);
      else sessionStorage.removeItem('gh_admin_token');
    } catch (err) {}

    setModo(novoModo);
    setToken(novoToken);
    setLogado(true);
    setEntrando(false);
    setErroLogin('');
  }

  /* ---------- ações do topo ---------- */
  async function salvar() {
    if (!rascunho) return;
    const cfg = deRascunho(rascunho);
    const resultado = await salvarNoServidor(cfg);
    if (resultado === 'ok') {
      escreverConfigLocal(cfg); // espelha para o modo offline continuar coerente
      toastMsg('Configuração salva no servidor!');
      return;
    }
    escreverConfigLocal(cfg); // guarda local para não perder a edição
    if (resultado === 'auth') toastMsg('Sessão expirou — salvo no navegador. Entre de novo para enviar ao servidor.', false);
    else toastMsg('Sem servidor — salvo localmente (só neste navegador).');
  }

  function exportar() {
    if (!rascunho) return;
    const cfg = deRascunho(rascunho);
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gh-roleplay-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toastMsg('Backup exportado.');
  }

  function importar(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dados = JSON.parse(reader.result);
        if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new Error('formato');
        escreverConfigLocal(dados);
        const resultado = await salvarNoServidor(dados);
        setRascunho(paraRascunho(mesclar(CONFIG_BASE, dados)));
        toastMsg(resultado === 'ok' ? 'Configuração importada e enviada ao servidor!' : 'Importado — salvo apenas neste navegador.');
      } catch (err) {
        toastMsg('Arquivo inválido — use um JSON exportado pelo painel.', false);
      }
    };
    reader.readAsText(arquivo);
    e.target.value = '';
  }

  async function resetar() {
    if (!window.confirm('Voltar tudo para o padrão de fábrica?')) return;
    let servidorOk = false;
    try {
      const r = await fetch(API_RAIZ + '/api/config', { method: 'DELETE', headers: cabecalhoAuth() });
      servidorOk = r.ok;
    } catch (e) { /* sem servidor */ }
    try { localStorage.removeItem('gh_config'); } catch (e) {}
    await carregar();
    toastMsg(servidorOk ? 'Padrão de fábrica restaurado (no servidor e aqui).' : 'Restaurado apenas neste navegador.');
  }

  /* ---------- troca de senha (servidor primeiro, local como fallback) ---------- */
  async function trocarSenha() {
    if (!segNova1) { toastMsg('Digite a nova senha.', false); return; }
    if (segNova1 !== segNova2) { toastMsg('As duas senhas novas não são iguais.', false); return; }
    if (modo === 'servidor') {
      try {
        const r = await fetch(API_RAIZ + '/api/auth/trocar-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...cabecalhoAuth() },
          body: JSON.stringify({ atual: segAtual, nova: segNova1 })
        });
        const dados = await r.json().catch(() => ({}));
        if (r.ok) {
          setSegAtual(''); setSegNova1(''); setSegNova2('');
          toastMsg('Senha trocada no servidor!');
          return;
        }
        toastMsg(dados.erro || 'Não foi possível trocar a senha no servidor.', false);
        return;
      } catch (e) { /* servidor sumiu → modo local */ }
    }
    if (segAtual !== senhaAtual()) { toastMsg('Senha atual incorreta.', false); return; }
    try { localStorage.setItem(CHAVE_SENHA, segNova1); } catch (e) {}
    setSegAtual(''); setSegNova1(''); setSegNova2('');
    toastMsg('Senha trocada (modo local).');
  }

  /* ---------- helpers dos repeaters ---------- */
  const editarLinha = (lista, i, prop, valor) => {
    setRascunho((r) => ({
      ...r,
      [lista]: r[lista].map((item, idx) => (idx === i ? { ...item, [prop]: valor } : item))
    }));
  };

  const excluirLinha = (lista, i) => {
    setRascunho((r) => ({ ...r, [lista]: r[lista].filter((_, idx) => idx !== i) }));
  };

  const addLinha = {
    categorias: () => setRascunho((r) => ({
      ...r,
      categorias: [...r.categorias, { nome: 'NOVA CATEGORIA', id: 'nova-' + Date.now().toString(36), destaque: false }]
    })),
    produtos: () => setRascunho((r) => ({
      ...r,
      produtos: [...r.produtos, {
        categoria: r.categorias.length ? r.categorias[0].id : 'vips',
        nome: 'NOVO PRODUTO', preco: 9.99, precoAntigo: '',
        icone: 'package', cor1: '#2a2030', cor2: '#141118', tag: ''
      }]
    })),
    depoimentos: () => setRascunho((r) => ({
      ...r,
      depoimentos: [...r.depoimentos, { nome: 'Cliente', nota: 5, texto: '', produto: '', data: 'hoje' }]
    })),
    links: () => setRascunho((r) => ({
      ...r,
      links: [...r.links, { nome: 'Rede', url: '#', icone: 'link' }]
    }))
  };

  /* =========================================================
     Tela de login
     ========================================================= */
  if (!logado) {
    return (
      <div className="tela-login">
        <form className="card-login" onSubmit={entrar}>
          <span className="admin-iniciais" aria-hidden="true">GH</span>
          <h1>Painel do dono</h1>
          <p className="login-dica">Configure a loja do <strong>{CONFIG_BASE.loja}</strong> sem tocar em código.</p>
          <div className="campo-com-rotulo">
            <label htmlFor="login-senha">Senha</label>
            <input
              type="password"
              id="login-senha"
              required
              placeholder="admin123"
              value={senhaLogin}
              onChange={(e) => setSenhaLogin(e.target.value)}
            />
          </div>
          {erroLogin ? <p className="login-erro">{erroLogin}</p> : null}
          <button type="submit" className="btn btn-laranja btn-total" disabled={entrando}>Entrar</button>
          <p className="login-nota">Senha inicial: <code>admin123</code> — altere em <strong>Segurança</strong> depois de entrar.</p>
        </form>
        {toast ? <div className={`toast${toast.ok ? ' ok' : ''}`}><Icone nome={toast.ok ? 'check' : 'x'} /><span>{toast.msg}</span></div> : null}
      </div>
    );
  }

  /* =========================================================
     Painel
     ========================================================= */
  const cfg = rascunho || paraRascunho(CONFIG_BASE);

  return (
    <div id="app">
      <header className="barra-topo">
        <div className="marcador">
          <span className="admin-iniciais admin-iniciais-mini" aria-hidden="true">{cfg.logoIniciais}</span>
          <div>
            <strong>{cfg.loja}</strong>
            <small>{modo === 'servidor' ? 'conectado ao servidor' : 'modo local (sem servidor)'}</small>
          </div>
        </div>
        <div className="barra-acoes">
          <a className="btn btn-fantasma" href="index.html" target="_blank" rel="noopener"><Icone nome="external-link" /> Ver loja</a>
          <button type="button" className="btn btn-fantasma" onClick={exportar}><Icone nome="download" /> Exportar</button>
          <button type="button" className="btn btn-fantasma" onClick={() => inputArquivo.current && inputArquivo.current.click()}><Icone nome="upload" /> Importar</button>
          <input type="file" ref={inputArquivo} accept="application/json" hidden onChange={importar} />
          <button type="button" className="btn btn-fantasma btn-perigo" onClick={resetar}><Icone nome="rotate-ccw" /> Resetar</button>
          <button type="button" className="btn btn-laranja" onClick={salvar}><Icone nome="save" /> Salvar tudo</button>
        </div>
      </header>

      <div className="corpo-admin">
        <nav className="lateral" aria-label="Seções do painel">
          {ABAS.map((a) => (
            <button
              type="button"
              className={`aba-lateral${aba === a.id ? ' ativa' : ''}`}
              key={a.id}
              onClick={() => setAba(a.id)}
            >
              <Icone nome={a.icone} /> {a.nome}
            </button>
          ))}
        </nav>

        <main className="miolo" ref={mioloRef}>

          {/* GERAL */}
          <section className={`secao${aba === 'geral' ? ' ativa' : ''}`}>
            <h2>Geral</h2>
            <div className="grade-form">
              <div className="campo-com-rotulo">
                <label>Nome da loja</label>
                <input className="campo" placeholder="GH Roleplay" value={cfg.loja} onChange={(e) => setRascunho((r) => ({ ...r, loja: e.target.value }))} />
              </div>
              <div className="campo-com-rotulo">
                <label>Iniciais do logo (até 3 letras)</label>
                <input className="campo campo-curto" maxLength={3} placeholder="GH" value={cfg.logoIniciais} onChange={(e) => setRascunho((r) => ({ ...r, logoIniciais: e.target.value }))} />
              </div>
              <div className="campo-com-rotulo">
                <label>Frase da barra de anúncio <small>use <code>{'{cod}'}</code> e <code>{'{pct}'}</code></small></label>
                <input className="campo" placeholder="UTILIZE O CUPOM {cod} E GARANTA {pct}% OFF ..." value={cfg.anuncio} onChange={(e) => setRascunho((r) => ({ ...r, anuncio: e.target.value }))} />
              </div>
              <div className="campo-com-rotulo">
                <label>Código do cupom</label>
                <input className="campo" value={cfg.cupom.codigo} onChange={(e) => setRascunho((r) => ({ ...r, cupom: { ...r.cupom, codigo: e.target.value } }))} />
              </div>
              <div className="campos-em-linha">
                <div className="campo-com-rotulo">
                  <label>Desconto (%)</label>
                  <input type="number" min={1} max={99} className="campo campo-curto" value={cfg.cupom.desconto} onChange={(e) => setRascunho((r) => ({ ...r, cupom: { ...r.cupom, desconto: e.target.value } }))} />
                </div>
                <div className="campo-com-rotulo">
                  <label>Mínimo do pedido (R$)</label>
                  <input type="number" min={0} step={0.01} className="campo campo-curto" value={cfg.cupom.minimo} onChange={(e) => setRascunho((r) => ({ ...r, cupom: { ...r.cupom, minimo: e.target.value } }))} />
                </div>
              </div>
              <div className="campo-com-rotulo">
                <label>Link "Conectar" do servidor</label>
                <input className="campo" placeholder="https://cfx.re/join/..." value={cfg.servidor.link} onChange={(e) => setRascunho((r) => ({ ...r, servidor: { ...r.servidor, link: e.target.value } }))} />
              </div>
              <div className="campo-com-rotulo">
                <label>Jogadores online (número de vitrine)</label>
                <input type="number" min={0} className="campo campo-curto" value={cfg.servidor.jogadores} onChange={(e) => setRascunho((r) => ({ ...r, servidor: { ...r.servidor, jogadores: e.target.value } }))} />
              </div>
              <div className="campo-com-rotulo">
                <label>Formas de pagamento <small>uma por linha</small></label>
                <textarea rows={3} className="campo" value={cfg._pagTexto} onChange={(e) => setRascunho((r) => ({ ...r, _pagTexto: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* BANNER */}
          <section className={`secao${aba === 'banner' ? ' ativa' : ''}`}>
            <h2>Banner</h2>
            <div className="grade-form">
              <div className="campo-com-rotulo">
                <label>Frases do título <small>uma por linha, formato: <code>inicio|destaque</code></small></label>
                <textarea rows={6} className="campo campo-mono" value={cfg._frasesTexto} onChange={(e) => setRascunho((r) => ({ ...r, _frasesTexto: e.target.value }))} />
              </div>
              <div className="campo-com-rotulo">
                <label>Pilares (linha sob o título)</label>
                <input className="campo" placeholder="Competição • Loja • Recompensas" value={cfg.pilares} onChange={(e) => setRascunho((r) => ({ ...r, pilares: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* COR */}
          <section className={`secao${aba === 'tema' ? ' ativa' : ''}`}>
            <h2>Cor da loja</h2>
            <p className="secao-dica">Cor padrão para quem nunca escolheu. Cada visitante pode mudar a cor em "Ajustes" na própria loja, e a escolha dele é respeitada.</p>
            <div className="grade-cores">
              {['laranja', 'rosa', 'verde'].map((t) => (
                <label className="cor-opcao" key={t}>
                  <input type="radio" name="conf-tema" value={t} checked={cfg.temaPadrao === t} onChange={(e) => setRascunho((r) => ({ ...r, temaPadrao: e.target.value }))} />
                  <span className={`bola cor-${t}`}></span>
                  {t === 'rosa' ? 'Rosa neon' : t === 'laranja' ? 'Laranja' : 'Verde'}
                </label>
              ))}
            </div>
          </section>

          {/* NÚMEROS */}
          <section className={`secao${aba === 'numeros' ? ' ativa' : ''}`}>
            <h2>Números da loja</h2>
            <p className="secao-dica">Os 4 cartões abaixo do banner, com contagem animada. Campos de cada linha: ícone · prefixo · valor · decimais · rótulo.</p>
            <div className="empilhador">
              {cfg.numeros.map((n, i) => (
                <Linha key={i} onExcluir={() => excluirLinha('numeros', i)}>
                  <select className="campo b-medio" value={n.icone || 'star'} onChange={(e) => editarLinha('numeros', i, 'icone', e.target.value)}>{OPCOES_ICONES}</select>
                  <input className="campo c-curto" placeholder="+ de" value={n.prefixo || ''} onChange={(e) => editarLinha('numeros', i, 'prefixo', e.target.value)} />
                  <input className="campo b-medio" type="number" step={0.1} min={0} value={n.valor} onChange={(e) => editarLinha('numeros', i, 'valor', e.target.value)} />
                  <input className="campo c-curto" type="number" min={0} max={2} value={n.decimais ?? 0} onChange={(e) => editarLinha('numeros', i, 'decimais', e.target.value)} />
                  <input className="campo b-largo" placeholder="Rótulo" value={n.rotulo} onChange={(e) => editarLinha('numeros', i, 'rotulo', e.target.value)} />
                </Linha>
              ))}
            </div>
          </section>

          {/* PÓDIO */}
          <section className={`secao${aba === 'podio' ? ' ativa' : ''}`}>
            <h2>Pódio dos apoiadores</h2>
            <p className="secao-dica">Os 3 maiores apoiadores — aparecem no banner e no cabeçalho. Campos: nome · valor em texto livre (ex.: R$ 1.233,45). A ordem das linhas define o lugar no pódio.</p>
            <div className="empilhador">
              {cfg.podio.map((p, i) => (
                <Linha key={i} onExcluir={() => excluirLinha('podio', i)}>
                  <span className="c-curto" style={{ textAlign: 'center', color: 'hsl(var(--primary))', fontWeight: 800 }}>{i + 1}º</span>
                  <input className="campo b-medio" placeholder="Nome" value={p.nome} onChange={(e) => editarLinha('podio', i, 'nome', e.target.value)} />
                  <input className="campo b-largo" placeholder="R$ 0,00" value={p.valor} onChange={(e) => editarLinha('podio', i, 'valor', e.target.value)} />
                </Linha>
              ))}
            </div>
          </section>

          {/* CATEGORIAS */}
          <section className={`secao${aba === 'categorias' ? ' ativa' : ''}`}>
            <h2>Categorias</h2>
            <p className="secao-dica">A primeira com "destaque" ganha cor e contagem regressiva (zera à meia-noite). O <strong>id</strong> liga produto à categoria — não altere de produtos já cadastrados. Campos: nome · id · destaque.</p>
            <div className="empilhador">
              {cfg.categorias.map((c, i) => (
                <Linha key={i} onExcluir={() => excluirLinha('categorias', i)}>
                  <input className="campo b-largo" placeholder="Nome exibido" value={c.nome} onChange={(e) => editarLinha('categorias', i, 'nome', e.target.value)} />
                  <input className="campo b-medio campo-mono" placeholder="id" value={c.id} onChange={(e) => editarLinha('categorias', i, 'id', e.target.value)} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.74rem', color: '#cfcfcf', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!c.destaque} onChange={(e) => editarLinha('categorias', i, 'destaque', e.target.checked)} />
                    <span>destaque</span>
                  </label>
                </Linha>
              ))}
            </div>
            <button type="button" className="btn btn-fantasma btn-add" onClick={addLinha.categorias}><Icone nome="plus" /> Adicionar categoria</button>
          </section>

          {/* PRODUTOS */}
          <section className={`secao${aba === 'produtos' ? ' ativa' : ''}`}>
            <h2>Produtos</h2>
            <p className="secao-dica">Preço antigo vazio = sem promoção. Cores = gradiente da capa do card. Campos: categoria · nome · preço · preço antigo · ícone · cor 1 · cor 2 · selo.</p>
            <div className="empilhador">
              {cfg.produtos.map((p, i) => (
                <Linha key={i} onExcluir={() => excluirLinha('produtos', i)}>
                  <select className="campo b-medio" value={p.categoria || ''} onChange={(e) => editarLinha('produtos', i, 'categoria', e.target.value)}>
                    {cfg.categorias.map((c) => <option value={c.id} key={c.id}>{c.nome}</option>)}
                  </select>
                  <input className="campo b-largo" placeholder="Nome do produto" value={p.nome} onChange={(e) => editarLinha('produtos', i, 'nome', e.target.value)} />
                  <input className="campo c-curto" type="number" step={0.01} min={0} placeholder="R$" value={p.preco} onChange={(e) => editarLinha('produtos', i, 'preco', e.target.value)} />
                  <input className="campo c-curto" type="number" step={0.01} min={0} placeholder="era R$" value={p.precoAntigo ?? ''} onChange={(e) => editarLinha('produtos', i, 'precoAntigo', e.target.value)} />
                  <select className="campo b-medio" value={p.icone || 'package'} onChange={(e) => editarLinha('produtos', i, 'icone', e.target.value)}>{OPCOES_ICONES}</select>
                  <input type="color" className="b-cor" title="Cor 1 do gradiente" value={p.cor1 || (p.cores ? p.cores[0] : '#2a2030')} onChange={(e) => editarLinha('produtos', i, 'cor1', e.target.value)} />
                  <input type="color" className="b-cor" title="Cor 2 do gradiente" value={p.cor2 || (p.cores ? p.cores[1] : '#141118')} onChange={(e) => editarLinha('produtos', i, 'cor2', e.target.value)} />
                  <input className="campo b-medio" placeholder="selo (opcional)" value={p.tag || ''} onChange={(e) => editarLinha('produtos', i, 'tag', e.target.value)} />
                </Linha>
              ))}
            </div>
            <button type="button" className="btn btn-fantasma btn-add" onClick={addLinha.produtos}><Icone nome="plus" /> Adicionar produto</button>
          </section>

          {/* DEPOIMENTOS */}
          <section className={`secao${aba === 'depoimentos' ? ' ativa' : ''}`}>
            <h2>Depoimentos</h2>
            <p className="secao-dica">Campos de cada linha: nome · nota (estrelas) · texto · produto · quando.</p>
            <div className="empilhador">
              {cfg.depoimentos.map((d, i) => (
                <Linha key={i} onExcluir={() => excluirLinha('depoimentos', i)}>
                  <input className="campo b-medio" placeholder="Nome" value={d.nome} onChange={(e) => editarLinha('depoimentos', i, 'nome', e.target.value)} />
                  <select className="campo c-curto" value={d.nota} onChange={(e) => editarLinha('depoimentos', i, 'nota', e.target.value)}>
                    {[5, 4, 3, 2, 1].map((n) => <option value={n} key={n}>{n} ★</option>)}
                  </select>
                  <input className="campo b-largo" placeholder="Depoimento" value={d.texto} onChange={(e) => editarLinha('depoimentos', i, 'texto', e.target.value)} />
                  <input className="campo b-medio" placeholder="Produto" value={d.produto} onChange={(e) => editarLinha('depoimentos', i, 'produto', e.target.value)} />
                  <input className="campo c-curto" placeholder="quando" value={d.data} onChange={(e) => editarLinha('depoimentos', i, 'data', e.target.value)} />
                </Linha>
              ))}
            </div>
            <button type="button" className="btn btn-fantasma btn-add" onClick={addLinha.depoimentos}><Icone nome="plus" /> Adicionar depoimento</button>
          </section>

          {/* LINKS */}
          <section className={`secao${aba === 'links' ? ' ativa' : ''}`}>
            <h2>Links &amp; redes sociais</h2>
            <p className="secao-dica">Aparecem no painel de suporte e no rodapé. Campos de cada linha: nome · url · ícone.</p>
            <div className="empilhador">
              {cfg.links.map((l, i) => (
                <Linha key={i} onExcluir={() => excluirLinha('links', i)}>
                  <input className="campo b-medio" placeholder="Nome" value={l.nome} onChange={(e) => editarLinha('links', i, 'nome', e.target.value)} />
                  <input className="campo b-largo campo-mono" placeholder="https://..." value={l.url} onChange={(e) => editarLinha('links', i, 'url', e.target.value)} />
                  <select className="campo b-medio" value={l.icone || 'link'} onChange={(e) => editarLinha('links', i, 'icone', e.target.value)}>{OPCOES_ICONES}</select>
                </Linha>
              ))}
            </div>
            <button type="button" className="btn btn-fantasma btn-add" onClick={addLinha.links}><Icone nome="plus" /> Adicionar link</button>
          </section>

          {/* PEDIDOS */}
          <section className={`secao${aba === 'pedidos' ? ' ativa' : ''}`}>
            <h2>Pedidos</h2>
            <p className="secao-dica">Compras recebidas pelo site. Fluxo normal: <strong>pendente</strong> (aguardando pagamento) → <strong>pago</strong> → <strong>entregue</strong>. Cancelado não entra nos números arrecadados.</p>
            <div className="pedidos-resumo" hidden={!resumo}>
              {resumo ? ([
                ...Object.keys(ROTULOS_STATUS).map((s) => {
                  const info = (resumo.porStatus && resumo.porStatus[s]) || { n: 0, total: 0 };
                  return <span className={`chip-status chip-${s}`} key={s}>{ROTULOS_STATUS[s]}: <strong>{info.n}</strong></span>;
                }),
                <span className="chip-status chip-total" key="total">Arrecadado: <strong>{dinheiro(resumo.arrecadado)}</strong></span>
              ]) : null}
            </div>
            <div className="pedidos-barra">
              <select className="campo campo-curto" aria-label="Filtrar por status" value={filtroPedidos} onChange={(e) => setFiltroPedidos(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button type="button" className="btn btn-fantasma" onClick={carregarPedidos}><Icone nome="refresh-cw" /> Atualizar</button>
            </div>
            <div>
              {pedidosNota ? <p className="pedidos-vazio">{pedidosNota}</p> : null}
              {!pedidosNota && pedidos && pedidos.length === 0 ? <p className="pedidos-vazio">Nenhum pedido com esse filtro ainda.</p> : null}
              {(pedidos || []).map((p) => (
                <div className="pedido-linha" key={p.id}>
                  <div className="pedido-topo">
                    <span className="pedido-codigo">{p.id}</span>
                    <span className="pedido-quando">{String(p.criadoEm || '').slice(0, 16).replace('T', ' ')}</span>
                    <select
                      className="campo pedido-status"
                      aria-label={`Status do pedido ${p.id}`}
                      value={p.status}
                      disabled={trocaEm === p.id}
                      onChange={(e) => mudarStatusPedido(p.id, e.target.value)}
                    >
                      {Object.keys(ROTULOS_STATUS).map((s) => <option value={s} key={s}>{ROTULOS_STATUS[s]}</option>)}
                    </select>
                  </div>
                  <div className="pedido-itens">
                    {(p.itens || []).map((i, idx) => (
                      <span className="pedido-item" key={idx}>{i.nome} <em>× {i.quantidade}</em></span>
                    ))}
                  </div>
                  <div className="pedido-pe">
                    <span>{p.cupom ? `cupom ${p.cupom} · −${p.descontoPct}%` : 'sem cupom'}</span>
                    {p.playerId ? <span>ID {p.playerId}</span> : null}
                    {p.discordId ? <span>Discord {p.discordId}</span> : null}
                    <strong className="pedido-total">{dinheiro(p.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEGURANÇA */}
          <section className={`secao${aba === 'seguranca' ? ' ativa' : ''}`}>
            <h2>Segurança</h2>
            <p className="secao-dica">A senha do painel fica guardada neste navegador. Para um painel público de verdade é preciso um servidor — este painel é para uso do próprio dono no computador.</p>
            <div className="grade-form">
              <div className="campo-com-rotulo"><label>Senha atual</label><input type="password" className="campo" value={segAtual} onChange={(e) => setSegAtual(e.target.value)} /></div>
              <div className="campos-em-linha">
                <div className="campo-com-rotulo"><label>Nova senha</label><input type="password" className="campo" value={segNova1} onChange={(e) => setSegNova1(e.target.value)} /></div>
                <div className="campo-com-rotulo"><label>Repetir nova senha</label><input type="password" className="campo" value={segNova2} onChange={(e) => setSegNova2(e.target.value)} /></div>
              </div>
              <button type="button" className="btn btn-laranja btn-curta" onClick={trocarSenha}><Icone nome="key-round" /> Trocar senha</button>
            </div>
          </section>

        </main>
      </div>

      {toast ? (
        <div className={`toast${toast.ok ? ' ok' : ''}`}>
          {toast.ok ? <CheckSvg width={15} height={15} /> : <Icone nome="x" />}
          <span>{toast.msg}</span>
        </div>
      ) : null}
    </div>
  );
}
