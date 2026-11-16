/* =========================================================
   GH ROLEPLAY — Página do produto (Fase C)
   /produto/:slug — foto real (quando o dono cadastrou),
   descrição, preço e botões de carrinho. Mesma config
   do resto da loja (servidor > localStorage > padrão).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor, slugProduto } from '../lib/util.js';
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
          {categoria ? <><Icone nome="chevron-right" /><Link to={'/#' + categoria.id}>{categoria.nome}</Link></> : null}
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
            {p.descricao ? <p className="produto-detalhe-desc">{p.descricao}</p> : null}

            <p className="produto-meta"><Icone nome="zap" />{t('entregaInstantaneaLonga')}</p>

            <div className="produto-preco produto-detalhe-preco">
              {p.precoAntigo ? <span className="preco-antigo">{preco(p.precoAntigo)}</span> : null}
              <span className="preco-atual">{preco(p.preco)}</span>
              {desconto ? <span className="marca-desconto">{desconto}</span> : null}
            </div>

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

        <p className="produto-detalhe-voltar"><Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link></p>
      </main>
    </div>
  );
}
