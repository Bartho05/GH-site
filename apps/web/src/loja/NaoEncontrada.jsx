/* =========================================================
   GH ROLEPLAY — 404
   Página dedicada para endereço inexistente (rota * e /404).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor } from '../lib/util.js';
import Icone from '../lib/Icone.jsx';
import { usarIdioma } from '../lib/i18n.js';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, {});

export default function NaoEncontrada() {
  const { t } = usarIdioma();
  const [cfg, setCfg] = useState(CONFIG_INICIAL);

  useEffect(() => {
    puxarConfigServidor().then((doServidor) => { if (doServidor) setCfg(mesclar(CONFIG_BASE, doServidor)); });
  }, []);

  return (
    <div className="checkout-pagina">
      <header className="checkout-topo">
        <div className="container checkout-topo-linha">
          <Link to="/" className="marca">
            <span className="marca-logo" aria-hidden="true">{cfg.logoIniciais}</span>
            <span className="marca-nome"><span className="marca-titulo">{cfg.loja}</span></span>
          </Link>
          <Link to="/" className="checkout-voltar"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
        </div>
      </header>

      <main className="container checkout-miolo">
        <section className="checkout-cartao pagina-404">
          <p className="p404-numero" aria-hidden="true">4<i>0</i>4</p>
          <h1 className="checkout-titulo"><Icone nome="compass" /> {t('p404Titulo')}</h1>
          <p className="checkout-dica"><Icone nome="info" /> {t('p404Texto')}</p>
          <div className="p404-acoes">
            <Link to="/" className="btn btn-primario"><Icone nome="arrow-left" /> {t('p404Voltar')}</Link>
            <a href="/" className="btn btn-secundario"><Icone nome="store" /> {t('p404Catalogo')}</a>
          </div>
        </section>
      </main>
    </div>
  );
}
