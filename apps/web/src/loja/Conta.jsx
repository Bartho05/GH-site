/* =========================================================
   GH ROLEPLAY — Minha conta (estilo ProLeague)
   Tela de LOGIN (sem conta): título "Fazer login", subtítulo
   "Entre com sua conta para continuar", botão principal com a
   marca do Discord e, depois do divisor "ou", consulta de
   pedido pelo código (endpoint público /api/checkout/:codigo).
   DASHBOARD (logado): identidade com avatar/tag, três estatísticas
   (total investido, pedidos, entregues) e o histórico com selos
   de status — GET /api/minha/conta com a sessão X-Discord-Token
   (30 min, no sessionStorage), atualizando por polling (10s).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor, API_RAIZ, BRL } from '../lib/util.js';
import Icone, { CheckSvg } from '../lib/Icone.jsx';
import { TopoLoja } from './Checkout.jsx';
import { usarIdioma } from '../lib/i18n.js';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, {});

const ROTULOS_STATUS = {
  pendente: 'aguardando',
  pago: 'pagoStatus',
  entregue: 'entregueStatus',
  cancelado: 'canceladoStatus'
};
const ICONES_STATUS = { pendente: 'timer', pago: 'badge-check', entregue: 'package-check', cancelado: 'x' };

export default function Conta() {
  const { t } = usarIdioma();
  const [cfg, setCfg] = useState(CONFIG_INICIAL);
  const [conta, setConta] = useState(null);      // { tag, pedidos } quando logado
  const [nota, setNota] = useState('');           // mensagem de estado vazio/erro
  const [carregando, setCarregando] = useState(true);

  /* consulta de pedido pelo código (sem login) */
  const [codigo, setCodigo] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [consulta, setConsulta] = useState(null); // { id, status, total } | { vazio: true }

  function limparSessao() {
    try { sessionStorage.removeItem('gh_dc'); } catch (e) {}
    setConta(null);
  }

  /* GET /api/minha/conta com a sessão guardada */
  async function carregarConta() {
    let dc = null;
    try { dc = sessionStorage.getItem('gh_dc'); } catch (e) {}
    if (!dc) { setCarregando(false); return; }
    try {
      const r = await fetch(API_RAIZ + '/api/minha/conta', { headers: { 'X-Discord-Token': dc } });
      if (r.status === 404) { limparSessao(); setNota(t('sessaoExpirou')); return; }
      if (!r.ok) throw new Error('http ' + r.status);
      setConta(await r.json());
      setNota('');
    } catch (e) {
      setNota(t('erroConexao'));
    }
    setCarregando(false);
  }

  /* primeira carga: ?dc= da URL → sessão; ?erro=discord → aviso */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dc = params.get('dc');
    if (dc) {
      try { sessionStorage.setItem('gh_dc', dc); } catch (e) {}
      params.delete('dc');
    }
    if (params.get('erro') === 'discord') {
      setNota(t('erroDiscord'));
      params.delete('erro');
    }
    window.history.replaceState(null, '', '/conta' + (params.toString() ? '?' + params.toString() : ''));
    puxarConfigServidor().then((doServidor) => { if (doServidor) setCfg(mesclar(CONFIG_BASE, doServidor)); });
    carregarConta();
  }, []);

  /* polling: a cada 10s a lista acompanha pagamento/entrega */
  useEffect(() => {
    if (!conta) return undefined;
    const t = setInterval(carregarConta, 10000);
    return () => clearInterval(t);
  }, [conta && conta.tag]);

  async function consultarPedido(e) {
    e.preventDefault();
    const c = codigo.trim().toUpperCase();
    if (!c || consultando) return;
    setConsultando(true);
    setConsulta(null);
    setNota('');
    try {
      const r = await fetch(API_RAIZ + '/api/checkout/' + encodeURIComponent(c));
      if (r.status === 404) setConsulta({ vazio: true });
      else if (!r.ok) throw new Error('http ' + r.status);
      else setConsulta(await r.json());
    } catch (err) {
      setNota(t('erroConexao'));
    }
    setConsultando(false);
  }

  /* estatísticas do dashboard */
  const pedidos = (conta && conta.pedidos) || [];
  const totalInvestido = pedidos.filter((p) => p.status !== 'cancelado').reduce((s, p) => s + (Number(p.total) || 0), 0);
  const entregues = pedidos.filter((p) => p.status === 'entregue').length;

  return (
    <div className="checkout-pagina">
      <TopoLoja cfg={cfg} />
      <main className="container checkout-miolo">
        <section className="checkout-cartao">
          <h1 className="checkout-titulo"><Icone nome="user-round" /> {t('minhaConta')}</h1>
          {nota ? <p className="checkout-erro" role="alert"><Icone nome="circle-alert" /> {nota}</p> : null}

          {!conta ? (
            /* ===== Tela de login (estilo ProLeague) ===== */
            <div className="conta-login">
              <h2 className="conta-login-titulo">{t('contaLoginTitulo')}</h2>
              <p className="conta-login-sub">{t('contaLoginSub')}</p>

              <a className="btn conta-btn-discord" href={API_RAIZ + '/api/auth/discord?volta=conta'}>
                <Icone nome="discord" /> {t('entrarDiscord')}
              </a>

              <div className="conta-divisor" aria-hidden="true"><span>{t('contaOu')}</span></div>

              {/* Consulta por código: quem não tem conta acompanha o pedido mesmo assim */}
              <form className="conta-consulta" onSubmit={consultarPedido}>
                <p className="conta-consulta-titulo">{t('consultaTitulo')}</p>
                <p className="conta-consulta-dica">{t('consultaDica')}</p>
                <div className="conta-consulta-linha">
                  <input
                    type="text"
                    className="campo campo-mono conta-consulta-campo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="PED-XXXXXX"
                    maxLength={24}
                    autoComplete="off"
                    spellCheck="false"
                    aria-label={t('consultaTitulo')}
                  />
                  <button type="submit" className="btn btn-secundario" disabled={consultando}>
                    <Icone nome="search" /> {consultando ? t('consultando') : t('consultar')}
                  </button>
                </div>

                {consulta && consulta.vazio ? (
                  <p className="conta-consulta-vazio" role="status"><Icone nome="circle-alert" /> {t('consultaNaoAchou')}</p>
                ) : null}
                {consulta && !consulta.vazio ? (
                  <div className="conta-pedido conta-consulta-ok" role="status">
                    <div className="conta-pedido-topo">
                      <code className="conta-pedido-codigo">{consulta.id}</code>
                      <span className="checkout-status-selo" data-status={consulta.status}>
                        <Icone nome={ICONES_STATUS[consulta.status] || 'receipt'} />
                        {t(ROTULOS_STATUS[consulta.status] || 'pedido')}
                      </span>
                      <strong className="conta-pedido-total">{BRL(consulta.total)}</strong>
                    </div>
                  </div>
                ) : null}
              </form>

              <Link to="/" className="btn btn-secundario conta-voltar"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
            </div>
          ) : (
            /* ===== Dashboard (logado) ===== */
            <>
              <div className="conta-identidade">
                <div className="conta-identidade-info">
                  <span className="conta-avatar" aria-hidden="true">{(conta.tag || '?').charAt(0)}</span>
                  <div>
                    <p className="conta-tag">{conta.tag}</p>
                    <p className="conta-tag-sub"><Icone nome="badge-check" /> {t('contaConectada')}</p>
                  </div>
                </div>
                <button type="button" className="btn btn-secundario" onClick={limparSessao}>
                  <Icone nome="log-out" /> {t('sair')}
                </button>
              </div>

              <div className="conta-stats">
                <div className="conta-stat">
                  <span className="conta-stat-valor">{BRL(totalInvestido)}</span>
                  <span className="conta-stat-rotulo">{t('totalGasto')}</span>
                </div>
                <div className="conta-stat">
                  <span className="conta-stat-valor">{pedidos.length}</span>
                  <span className="conta-stat-rotulo">{t('numPedidos')}</span>
                </div>
                <div className="conta-stat">
                  <span className="conta-stat-valor">{entregues}</span>
                  <span className="conta-stat-rotulo">{t('entreguesConta')}</span>
                </div>
              </div>

              <p className="conta-polling-dica">{t('contaAtualiza')}</p>

              {carregando ? <p className="checkout-vazio">{t('carregandoPedidos')}</p> : null}
              {!carregando && !pedidos.length ? (
                <p className="checkout-vazio">
                  <Icone nome="shopping-cart" />
                  {t('semPedidosA')} <Link to="/">{t('escolherProdutos')}</Link>
                </p>
              ) : null}
              <div className="conta-pedidos">
                {pedidos.map((p) => (
                  <div className="conta-pedido" key={p.id}>
                    <div className="conta-pedido-topo">
                      <code className="conta-pedido-codigo">{p.id}</code>
                      <span className="checkout-status-selo" data-status={p.status}>
                        <Icone nome={ICONES_STATUS[p.status] || 'receipt'} />
                        {t(ROTULOS_STATUS[p.status] || 'pedido')}
                      </span>
                      <span className="conta-pedido-quando">{String(p.criadoEm || '').slice(0, 16).replace('T', ' ')}</span>
                      <strong className="conta-pedido-total">{BRL(p.total)}</strong>
                    </div>
                    <div className="conta-pedido-itens">
                      {(p.itens || []).map((i, idx) => (
                        <span className="checkout-item-resumo" key={idx}>{i.nome} <em>× {i.quantidade}</em></span>
                      ))}
                    </div>
                    {p.status === 'pago' ? (
                      <p className="conta-pedido-dica"><CheckSvg width={13} height={13} /> {t('naFila')}</p>
                    ) : null}
                    {p.status === 'entregue' ? (
                      <p className="conta-pedido-dica"><CheckSvg width={13} height={13} /> {t('entregueOk')}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
