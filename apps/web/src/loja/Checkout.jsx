/* =========================================================
   GH ROLEPLAY — Checkout (Fase 2)
   Página de finalização: ID do jogador + login Discord +
   pagamento Pix (automático via Mercado Pago quando o
   servidor tem MP_ACCESS_TOKEN; senão Pix manual confirmado
   pela staff). Depois de criado, o pedido é acompanhado
   aqui mesmo por polling (4s).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import {
  mesclar, puxarConfigServidor, API_RAIZ, BRL
} from '../lib/util.js';
import Icone, { CheckSvg } from '../lib/Icone.jsx';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, {});

const ROTULO_TIPO_PIX = {
  cpf: 'CPF', cnpj: 'CNPJ', telefone: 'Telefone', email: 'E-mail', aleatoria: 'Chave aleatória'
};

function lerCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem('gh_carrinho'));
    if (Array.isArray(salvo)) return salvo;
  } catch (e) {}
  return [];
}

/* =============================================
   Página
   ============================================= */
export default function Checkout() {
  const navegar = useNavigate();
  const [cfg, setCfg] = useState(CONFIG_INICIAL);
  const [itens, setItens] = useState(lerCarrinho);
  const [playerId, setPlayerId] = useState('');
  const [cupom, setCupom] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null); // resposta do POST /api/checkout
  const [discord, setDiscord] = useState(null);     // { id, tag } quando logou
  const [copiado, setCopiado] = useState('');

  /* primeira carga: config do servidor + sessão Discord (se veio ?dc=) */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dc = params.get('dc');
    if (dc) {
      try { sessionStorage.setItem('gh_dc', dc); } catch (e) {}
      params.delete('dc');
    }
    if (params.get('erro') === 'discord') {
      setErro('Não foi possível conectar sua conta do Discord. Tente de novo.');
      params.delete('erro');
    }
    window.history.replaceState(null, '', '/checkout' + (params.toString() ? '?' + params.toString() : ''));

    const salvo = (() => { try { return sessionStorage.getItem('gh_dc'); } catch (e) { return null; } })();
    if (salvo) {
      fetch(API_RAIZ + '/api/auth/discord/sessao', { headers: { 'X-Discord-Token': salvo } })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => {
          if (s) setDiscord(s);
          else { try { sessionStorage.removeItem('gh_dc'); } catch (e) {} }
        })
        .catch(() => {});
    }

    puxarConfigServidor().then((doServidor) => { if (doServidor) setCfg(mesclar(CONFIG_BASE, doServidor)); });
  }, []);

  /* cupom de boas-vindas já vem preenchido (como no carrinho antigo) */
  useEffect(() => {
    if (!cupom && cfg.cupom && cfg.cupom.codigo) setCupom(cfg.cupom.codigo);
  }, [cfg.cupom && cfg.cupom.codigo]);

  /* polling do status enquanto o pedido está pendente */
  const statusPedido = resultado && resultado.pedido ? resultado.pedido.status : null;
  useEffect(() => {
    if (!resultado || statusPedido !== 'pendente') return undefined;
    const t = setInterval(async () => {
      try {
        const r = await fetch(API_RAIZ + '/api/checkout/' + encodeURIComponent(resultado.pedido.id));
        if (!r.ok) return;
        const dados = await r.json();
        setResultado((atual) => (atual ? { ...atual, pedido: { ...atual.pedido, status: dados.status } } : atual));
      } catch (e) { /* rede falhou: tenta no próximo tique */ }
    }, 4000);
    return () => clearInterval(t);
  }, [resultado, statusPedido]);

  /* ---------- derivados do carrinho ---------- */
  const linhas = [];
  for (const nome of [...new Set(itens)]) {
    const p = cfg.produtos.find((x) => x.nome === nome);
    const quantidade = itens.filter((n) => n === nome).length;
    if (p) linhas.push({ p, quantidade });
  }
  const subtotal = linhas.reduce((acc, l) => acc + l.p.preco * l.quantidade, 0);
  const cupomOk = !!linhas.length
    && cupom.trim().toUpperCase() === (cfg.cupom.codigo || '').toUpperCase()
    && subtotal >= (cfg.cupom.minimo || 0);
  const descontoPct = cupomOk ? cfg.cupom.desconto : 0;
  const total = Math.round((subtotal - subtotal * descontoPct / 100) * 100) / 100;

  /* ---------- ações ---------- */
  const copiar = async (texto, chave) => {
    try { await navigator.clipboard.writeText(texto); } catch (e) {}
    setCopiado(chave);
    setTimeout(() => setCopiado(''), 1600);
  };

  function sairDiscord() {
    try { sessionStorage.removeItem('gh_dc'); } catch (e) {}
    setDiscord(null);
  }

  function validarId(id) {
    return /^[A-Za-z0-9_-]{1,24}$/.test(id);
  }

  async function enviarPedido() {
    if (!linhas.length || enviando) return;
    const idLimpo = playerId.trim();
    if (!validarId(idLimpo)) {
      setErro('Informe seu ID no servidor (só letras, números, _ ou -).');
      return;
    }
    setEnviando(true);
    setErro('');

    const contagens = {};
    itens.forEach((nome) => { contagens[nome] = (contagens[nome] || 0) + 1; });
    const corpo = {
      itens: Object.entries(contagens).map(([nome, quantidade]) => ({ nome, quantidade })),
      playerId: idLimpo,
      cupom: cupom.trim() || undefined
    };
    let dc = null;
    try { dc = sessionStorage.getItem('gh_dc'); } catch (e) {}

    try {
      const r = await fetch(API_RAIZ + '/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(dc ? { 'X-Discord-Token': dc } : {}) },
        body: JSON.stringify(corpo)
      });
      const dados = await r.json().catch(() => null);
      if (r.ok && dados && dados.pedido) {
        try { localStorage.removeItem('gh_carrinho'); } catch (e) {}
        setItens([]);
        setResultado(dados);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErro((dados && dados.erro) || 'Não foi possível criar o pedido. Tente de novo.');
      }
    } catch (e) {
      setErro('Sem conexão com o servidor da loja.');
    }
    setEnviando(false);
  }

  /* ---------- tela de confirmação (após criar o pedido) ---------- */
  if (resultado && resultado.pedido) {
    const { pedido, pix, manual } = resultado;
    return (
      <div className="checkout-pagina">
        <TopoLoja cfg={cfg} />
        <main className="container checkout-miolo">
          <section className="checkout-cartao checkout-confirmacao">
            <span className="checkout-status-selo" data-status={pedido.status}>
              <Icone nome={pedido.status === 'cancelado' ? 'x' : 'receipt'} />
              {pedido.status === 'pendente' && 'Aguardando pagamento'}
              {pedido.status === 'pago' && 'Pagamento confirmado'}
              {pedido.status === 'entregue' && 'Entregue no servidor'}
              {pedido.status === 'cancelado' && 'Pedido cancelado'}
            </span>
            <h1 className="checkout-titulo">Pedido <code>{pedido.id}</code></h1>
            <p className="checkout-total-linha">
              Total <strong>{BRL(pedido.total)}</strong>
              {descontoPct ? <span> · {descontoPct}% OFF aplicado</span> : null}
            </p>

            {pedido.status === 'pendente' && (
              <p className="checkout-status-dica">
                Esta página atualiza sozinha — deixe-a aberta. Assim que o pagamento for
                confirmado, a entrega cai direto no servidor.
              </p>
            )}
            {pedido.status === 'pago' && (
              <p className="checkout-status-dica ok">
                <CheckSvg width={15} height={15} /> Pagamento confirmado! Sua entrega já está na fila do servidor.
              </p>
            )}
            {pedido.status === 'entregue' && (
              <p className="checkout-status-dica ok">
                <CheckSvg width={15} height={15} /> Entrega concluída — confira os itens no seu personagem in-game.
              </p>
            )}
            {pedido.status === 'cancelado' && (
              <p className="checkout-status-dica ruim">
                Pedido cancelado pela staff. Se pagou por engano, fale com o suporte.
              </p>
            )}

            {pedido.status === 'pendente' && (
              <div className="checkout-pix">
                {pix ? (
                  <>
                    <p className="checkout-pix-rotulo"><Icone nome="qr-code" /> Pix automático — Mercado Pago</p>
                    {pix.qrBase64 ? (
                      <img
                        className="checkout-pix-qr"
                        src={'data:image/png;base64,' + pix.qrBase64}
                        alt="QR Code do Pix"
                        width="180" height="180"
                      />
                    ) : null}
                    <div className="checkout-pix-codigo">
                      <span className="checkout-pix-chave">{pix.copiaECola}</span>
                      <button
                        type="button"
                        className={copiado === 'copia' ? 'copiado' : ''}
                        aria-label="Copiar código Pix"
                        onClick={() => copiar(pix.copiaECola, 'copia')}
                      >
                        {copiado === 'copia' ? <CheckSvg width={16} height={16} /> : <Icone nome="copy" />}
                      </button>
                    </div>
                    <p className="checkout-pix-nota">
                      Copie o código, pague no app do seu banco e a confirmação é automática.
                    </p>
                  </>
                ) : manual && manual.chavePix ? (
                  <>
                    <p className="checkout-pix-rotulo"><Icone nome="qr-code" /> Pix — pagamento manual</p>
                    <div className="checkout-pix-codigo">
                      <span className="checkout-pix-tipo">{ROTULO_TIPO_PIX[manual.tipoChavePix] || 'Chave Pix'}</span>
                      <span className="checkout-pix-chave">{manual.chavePix}</span>
                      <button
                        type="button"
                        className={copiado === 'chave' ? 'copiado' : ''}
                        aria-label="Copiar chave Pix"
                        onClick={() => copiar(manual.chavePix, 'chave')}
                      >
                        {copiado === 'chave' ? <CheckSvg width={16} height={16} /> : <Icone nome="copy" />}
                      </button>
                    </div>
                    <div className="checkout-pix-codigo">
                      <span className="checkout-pix-chave">{BRL(pedido.total)}</span>
                      <button
                        type="button"
                        className={copiado === 'valor' ? 'copiado' : ''}
                        aria-label="Copiar valor"
                        onClick={() => copiar(pedido.total.toFixed(2).replace('.', ','), 'valor')}
                      >
                        {copiado === 'valor' ? <CheckSvg width={16} height={16} /> : <Icone nome="copy" />}
                      </button>
                    </div>
                    {manual.instrucoesPix ? <p className="checkout-pix-nota">{manual.instrucoesPix}</p> : null}
                  </>
                ) : (
                  <p className="checkout-pix-nota">
                    Pague o valor exato com o Pix informado pela staff no Discord da loja.
                    Depois de confirmado, o status aqui muda para <strong>pago</strong>.
                  </p>
                )}
              </div>
            )}

            <div className="checkout-itens-resumo">
              {linhas.map((l) => (
                <span className="checkout-item-resumo" key={l.p.nome}>{l.p.nome} <em>× {l.quantidade}</em></span>
              ))}
            </div>

            <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> Voltar à loja</Link>
          </section>
        </main>
      </div>
    );
  }

  /* ---------- tela do formulário ---------- */
  return (
    <div className="checkout-pagina">
      <TopoLoja cfg={cfg} />
      <main className="container checkout-miolo">
        <section className="checkout-cartao">
          <h1 className="checkout-titulo"><Icone nome="lock" /> Finalizar compra</h1>

          {erro ? <p className="checkout-erro" role="alert"><Icone nome="circle-alert" /> {erro}</p> : null}

          <div className="checkout-grid">
            <div className="checkout-form">
              <div className="campo-com-rotulo">
                <label htmlFor="checkout-player">Seu ID no servidor <small>aparece na lista de jogadores (TAB)</small></label>
                <input
                  id="checkout-player"
                  className="campo"
                  placeholder="ex.: 64"
                  maxLength={24}
                  value={playerId}
                  autoComplete="off"
                  onChange={(e) => setPlayerId(e.target.value)}
                />
              </div>

              {cfg.recursos && cfg.recursos.discordLogin ? (
                <div className="campo-com-rotulo">
                  <label>Conta Discord <small>usada para avisos e conferência da staff</small></label>
                  {discord ? (
                    <div className="checkout-discord-ok">
                      <Icone nome="message-circle" />
                      <span>{discord.tag}</span>
                      <button type="button" onClick={sairDiscord}>trocar</button>
                    </div>
                  ) : (
                    <a className="btn btn-secundario btn-discord" href={API_RAIZ + '/api/auth/discord'}>
                      <Icone nome="message-circle" /> Entrar com o Discord
                    </a>
                  )}
                </div>
              ) : (
                <p className="checkout-dica"><Icone nome="info" /> Login com Discord ainda não está ativo nesta loja — a staff confere seu ID no servidor.</p>
              )}

              <div className="campo-com-rotulo">
                <label htmlFor="checkout-cupom">Cupom <small>{cfg.cupom.desconto}% OFF a partir de {BRL(cfg.cupom.minimo)}</small></label>
                <input
                  id="checkout-cupom"
                  className="campo campo-curto"
                  placeholder="CUPOM"
                  maxLength={24}
                  value={cupom}
                  onChange={(e) => setCupom(e.target.value.toUpperCase())}
                />
              </div>

              <p className="checkout-dica">
                <Icone nome="shield-check" /> Seus dados ficam só no servidor da loja — nada é
                compartilhado. Veja a <Link to="/privacidade">Política de Privacidade</Link>.
              </p>
            </div>

            <aside className="checkout-resumo">
              <h2>Resumo do pedido</h2>
              {linhas.length ? linhas.map((l) => (
                <div className="checkout-linha" key={l.p.nome}>
                  <span>{l.p.nome} <em>× {l.quantidade}</em></span>
                  <span>{BRL(l.p.preco * l.quantidade)}</span>
                </div>
              )) : (
                <p className="checkout-vazio">
                  <Icone nome="shopping-cart" />
                  Carrinho vazio. <Link to="/">Escolher produtos</Link>
                </p>
              )}
              <div className="checkout-linha checkout-subtotal">
                <span>Subtotal</span><span>{BRL(subtotal)}</span>
              </div>
              {descontoPct ? (
                <div className="checkout-linha checkout-desconto">
                  <span>Cupom {cfg.cupom.codigo}</span>
                  <span>−{BRL(subtotal * descontoPct / 100)}</span>
                </div>
              ) : null}
              <div className="checkout-linha checkout-total">
                <span>Total</span><strong>{BRL(total)}</strong>
              </div>
              <button
                type="button"
                className="btn btn-primario btn-grande"
                disabled={enviando || !linhas.length}
                onClick={enviarPedido}
              >
                {enviando ? 'Criando pedido…' : (<><Icone nome="shopping-cart" /> Confirmar pedido</>)}
              </button>
              <p className="checkout-nota-pagamento">
                <Icone nome="qr-code" />
                {cfg.recursos && cfg.recursos.pixAutomatico
                  ? 'Pix gerado na hora pelo Mercado Pago — confirmação automática.'
                  : 'Pagamento via Pix — a staff confirma em minutos.'}
              </p>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =============================================
   Cabeçalho enxuto do checkout
   ============================================= */
function TopoLoja({ cfg }) {
  return (
    <header className="checkout-topo">
      <div className="container checkout-topo-linha">
        <Link to="/" className="marca">
          <span className="marca-logo" aria-hidden="true">{cfg.logoIniciais}</span>
          <span className="marca-nome"><span className="marca-titulo">{cfg.loja}</span></span>
        </Link>
        <Link to="/" className="checkout-voltar"><Icone nome="arrow-left" /> Continuar comprando</Link>
      </div>
    </header>
  );
}
