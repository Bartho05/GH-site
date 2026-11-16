/* =========================================================
   GH ROLEPLAY — Minha conta (Fase B)
   Login com Discord (?volta=conta) e histórico dos pedidos
   do próprio cliente: GET /api/minha/conta com a sessão
   X-Discord-Token (30 min, guardada no sessionStorage).
   A lista atualiza sozinha por polling (10s).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor, API_RAIZ, BRL } from '../lib/util.js';
import Icone, { CheckSvg } from '../lib/Icone.jsx';
import { TopoLoja } from './Checkout.jsx';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, {});

const ROTULOS_STATUS = {
  pendente: 'Aguardando pagamento',
  pago: 'Pagamento confirmado',
  entregue: 'Entregue no servidor',
  cancelado: 'Pedido cancelado'
};
const ICONES_STATUS = { pendente: 'timer', pago: 'badge-check', entregue: 'package-check', cancelado: 'x' };

export default function Conta() {
  const [cfg, setCfg] = useState(CONFIG_INICIAL);
  const [conta, setConta] = useState(null);      // { tag, pedidos } quando logado
  const [nota, setNota] = useState('');           // mensagem de estado vazio/erro
  const [carregando, setCarregando] = useState(true);

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
      if (r.status === 404) { limparSessao(); setNota('Sua sessão expirou — entre de novo com o Discord.'); return; }
      if (!r.ok) throw new Error('http ' + r.status);
      setConta(await r.json());
      setNota('');
    } catch (e) {
      setNota('Sem conexão com o servidor da loja agora.');
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
      setNota('Não foi possível conectar sua conta do Discord. Tente de novo.');
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

  return (
    <div className="checkout-pagina">
      <TopoLoja cfg={cfg} />
      <main className="container checkout-miolo">
        <section className="checkout-cartao">
          <h1 className="checkout-titulo"><Icone nome="user-round" /> Minha conta</h1>
          {nota ? <p className="checkout-erro" role="alert"><Icone nome="circle-alert" /> {nota}</p> : null}

          {!conta ? (
            <div className="conta-entrar">
              <p className="checkout-dica">
                <Icone nome="info" /> Entre com o Discord para ver o histórico dos seus pedidos e
                acompanhar a entrega — sem precisar chamar o suporte.
              </p>
              <a className="btn btn-primario btn-discord" href={API_RAIZ + '/api/auth/discord?volta=conta'}>
                <Icone nome="message-circle" /> Entrar com o Discord
              </a>
              <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> Voltar à loja</Link>
            </div>
          ) : (
            <>
              <div className="conta-cabecalho">
                <div className="checkout-discord-ok">
                  <Icone nome="message-circle" />
                  <span>{conta.tag}</span>
                </div>
                <button type="button" className="btn btn-fantasma" onClick={limparSessao}>
                  <Icone nome="log-out" /> Sair
                </button>
              </div>

              <p className="conta-polling-dica">Atualiza sozinho — deixe a aba aberta para acompanhar a entrega.</p>

              {carregando ? <p className="checkout-vazio">Carregando pedidos…</p> : null}
              {!carregando && (!conta.pedidos || !conta.pedidos.length) ? (
                <p className="checkout-vazio">
                  <Icone nome="shopping-cart" />
                  Você ainda não fez pedidos. <Link to="/">Escolher produtos</Link>
                </p>
              ) : null}
              <div className="conta-pedidos">
                {(conta.pedidos || []).map((p) => (
                  <div className="conta-pedido" key={p.id}>
                    <div className="conta-pedido-topo">
                      <code className="conta-pedido-codigo">{p.id}</code>
                      <span className="checkout-status-selo" data-status={p.status}>
                        <Icone nome={ICONES_STATUS[p.status] || 'receipt'} />
                        {ROTULOS_STATUS[p.status] || p.status}
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
                      <p className="conta-pedido-dica"><CheckSvg width={13} height={13} /> Pago — na fila de entrega do servidor.</p>
                    ) : null}
                    {p.status === 'entregue' ? (
                      <p className="conta-pedido-dica"><CheckSvg width={13} height={13} /> Entregue — confira no seu personagem in-game.</p>
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
