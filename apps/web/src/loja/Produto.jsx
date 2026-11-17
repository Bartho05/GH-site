/* =========================================================
   GH ROLEPLAY — Página do produto (Fase C + rodada ProLeague)
   /produto/:slug — igual à referência do ProLeague: stats do
   produto (vendas reais do servidor + entrega automática),
   preço "à vista no Pix" com a dica do cupom, selos de
   confiança, descrição multilinha do dono, cartões de
   garantia (entrega/segurança/pagamento) e produtos
   relacionados da mesma categoria. A avaliação com estrelas
   do ProLeague fica pra depois: precisa de um sistema novo
   no backend (tabela + moderação).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor, slugProduto, API_RAIZ, BRL } from '../lib/util.js';
import Icone from '../lib/Icone.jsx';
import { TopoLoja } from './Checkout.jsx';
import { usarIdioma, usarMoeda, formatarPreco } from '../lib/i18n.js';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, {});

function lerCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem('gh_carrinho'));
    if (Array.isArray(salvo)) return salvo;
  } catch (e) {}
  return [];
}

export default function Produto() {
  const { slug } = useParams();
  const navegar = useNavigate();
  const { t } = usarIdioma();
  const moeda = usarMoeda();
  const preco = (v) => formatarPreco(v, moeda);
  const [cfg, setCfg] = useState(CONFIG_INICIAL);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  useEffect(() => {
    puxarConfigServidor().then((doServidor) => { if (doServidor) setCfg(mesclar(CONFIG_BASE, doServidor)); });
  }, []);

  /* um novo slug (clique em outro produto) volta para qtd 1 */
  useEffect(() => { setQuantidade(1); setAdicionado(false); }, [slug]);

  const p = (cfg.produtos || []).find((x) => slugProduto(x.nome) === 'produto-' + slug);

  /* unidades vendidas deste produto (pedidos pagos/entregues no
     servidor — contador honesto, some quando não há nenhuma) */
  const nomeProduto = p ? p.nome : null;
  const [vendas, setVendas] = useState(null);
  useEffect(() => {
    if (!nomeProduto) return undefined;
    setVendas(null);
    let vivo = true;
    fetch(API_RAIZ + '/api/vendas?nome=' + encodeURIComponent(nomeProduto))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo && d) setVendas(Number(d.vendas) || 0); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [nomeProduto]);

  if (!p) {
    return (
      <div className="checkout-pagina">
        <TopoLoja cfg={cfg} />
        <main className="container checkout-miolo">
          <section className="checkout-cartao">
            <h1 className="checkout-titulo"><Icone nome="circle-alert" /> {t('produtoNaoEncontrado')}</h1>
            <p className="checkout-dica"><Icone nome="info" /> {t('produtoSumiu')}</p>
            <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
          </section>
        </main>
      </div>
    );
  }

  const [c1, c2] = p.cores || ['#2a2030', '#141118'];
  const desconto = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) + '% OFF' : null;
  const categoria = (cfg.categorias || []).find((c) => c.id === p.categoria);
  const noCarrinho = lerCarrinho().filter((n) => n === p.nome).length;
  const cupomAtivo = cfg.cupom && cfg.cupom.codigo && cfg.cupom.desconto > 0;
  const relacionados = (cfg.produtos || []).filter((x) => x.categoria === p.categoria && x.nome !== p.nome).slice(0, 4);

  function adicionar() {
    try {
      const lista = lerCarrinho();
      for (let i = 0; i < quantidade; i += 1) lista.push(p.nome);
      localStorage.setItem('gh_carrinho', JSON.stringify(lista));
    } catch (e) {}
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1400);
  }

  return (
    <div className="checkout-pagina">
      <TopoLoja cfg={cfg} />
      <main className="container checkout-miolo">
        <nav className="produto-caminho" aria-label="Breadcrumb">
          <Link to="/">{t('rodapeLoja')}</Link>
          {categoria ? <><Icone nome="chevron-right" /><Link to={'/#secao-' + categoria.id}>{categoria.nome}</Link></> : null}
          <Icone nome="chevron-right" /><span aria-current="page">{p.nome}</span>
        </nav>

        <section className="produto-detalhe">
          <div className="produto-detalhe-fig">
            <div className={`produto-marca-fig grande${p.imagem ? ' com-imagem' : ''}`} style={{ '--c1': c1, '--c2': c2 }}>
              {p.imagem
                ? <img className="produto-img" src={p.imagem} alt={p.nome} />
                : <Icone nome={p.icone} />}
            </div>
          </div>

          <div className="produto-detalhe-info">
            {p.tag ? <span className="marca-tag"><Icone nome="flame" />{p.tag}</span> : null}
            <h1 className="produto-detalhe-nome">{p.nome}</h1>
            {categoria ? <p className="produto-detalhe-cat">{categoria.nome}</p> : null}

            {/* stats (estilo ProLeague): vendas reais · entrega automática */}
            <p className="produto-stats">
              {vendas ? (
                <span><Icone nome="trending-up" /> {vendas === 1 ? t('vendaUma') : t('vendasN', { n: vendas })}</span>
              ) : null}
              <span><Icone nome="zap" /> {t('entregaAutomatica')}</span>
            </p>

            {p.descricao ? <p className="produto-detalhe-desc">{p.descricao}</p> : null}

            <div className="produto-preco produto-detalhe-preco">
              {p.precoAntigo ? <span className="preco-antigo">{preco(p.precoAntigo)}</span> : null}
              <span className="preco-atual">{preco(p.preco)}</span>
              {desconto ? <span className="marca-desconto">{desconto}</span> : null}
            </div>
            <p className="produto-avista"><Icone nome="badge-check" /> {t('avistaNoPix')}</p>
            {cupomAtivo ? (
              <p className="produto-cupom-dica">
                <Icone nome="ticket-percent" /> <code>{cfg.cupom.codigo}</code>{' '}
                <span>{t('cupomDicaProduto', { p: cfg.cupom.desconto, m: BRL(cfg.cupom.minimo) })}</span>
              </p>
            ) : null}

            <div className="produto-detalhe-acoes">
              <div className="produto-qtd" role="group" aria-label={t('quantidade')}>
                <button type="button" onClick={() => setQuantidade((q) => Math.max(1, q - 1))} aria-label={t('menosUma')}>−</button>
                <span aria-live="polite">{quantidade}</span>
                <button type="button" onClick={() => setQuantidade((q) => Math.min(99, q + 1))} aria-label={t('maisUma')}>+</button>
              </div>
              <button type="button" className="btn btn-secundario" onClick={adicionar}>
                {adicionado ? <><Icone nome="check" /> {t('adicionado')}</> : <><Icone nome="shopping-cart" /> {t('adicionar')}</>}
              </button>
              <button type="button" className="btn btn-primario" onClick={() => { adicionar(); navegar('/checkout'); }}>
                <Icone nome="zap" /> {t('comprarAgora')}
              </button>
            </div>

            {/* selos de confiança (estilo ProLeague) */}
            <div className="produto-confianca">
              <span><Icone nome="shield-check" /> {t('pagamentoSeguro')}</span>
              <span><Icone nome="zap" /> {t('pixNaHora')}</span>
            </div>

            <p className="produto-detalhe-carrinho">
              {noCarrinho ? (
                <>
                  <Icone nome="shopping-cart" /> {noCarrinho} {t('noCarrinho')} —
                  <Link to="/checkout">{t('finalizarCompra')}</Link>
                </>
              ) : (
                <><Icone nome="shield-check" /> {t('pixEntrega')}</>
              )}
            </p>
          </div>
        </section>

        {/* cartões de garantia (estilo ProLeague: entrega · segurança · pagamento) */}
        <section className="produto-info-cartoes" aria-label={t('infoEntregaT')}>
          <div className="produto-info-cartao">
            <Icone nome="zap" />
            <h3>{t('infoEntregaT')}</h3>
            <p>{t('infoEntregaTxt')}</p>
          </div>
          <div className="produto-info-cartao">
            <Icone nome="shield-check" />
            <h3>{t('infoSegT')}</h3>
            <p>{t('infoSegTxt')}</p>
          </div>
          <div className="produto-info-cartao">
            <Icone nome="credit-card" />
            <h3>{t('infoPagoT')}</h3>
            <p>{t('infoPagoTxt')}</p>
          </div>
        </section>

        {/* relacionados da mesma categoria */}
        {relacionados.length ? (
          <section className="produto-relacionados">
            <h2>{t('relacionados')}</h2>
            <div className="produto-relacionados-grade">
              {relacionados.map((r) => {
                const [rc1, rc2] = r.cores || ['#2a2030', '#141118'];
                return (
                  <Link key={r.nome} to={'/produto/' + slugProduto(r.nome).replace('produto-', '')} className="produto-rel-card">
                    <span className="produto-rel-fig" style={{ '--c1': rc1, '--c2': rc2 }} aria-hidden="true"><Icone nome={r.icone} /></span>
                    <span className="produto-rel-nome">{r.nome}</span>
                    <span className="produto-rel-preco">{preco(r.preco)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <p className="produto-detalhe-voltar"><Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link></p>
      </main>
    </div>
  );
}
