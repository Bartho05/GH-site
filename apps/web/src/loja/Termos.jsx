/* =========================================================
   GH ROLEPLAY — Termos e condições
   Regras do comércio digital da loja (produtos FiveM).
   Texto legal traduzido nas 4 línguas (i18n); a nota informa
   que a versão em português prevalece. Mesma casca da página
   de privacidade.
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { puxarConfigServidor } from '../lib/util.js';
import Icone from '../lib/Icone.jsx';
import { usarIdioma } from '../lib/i18n.js';

import '../styles.css';

export default function Termos() {
  const { t } = usarIdioma();
  const [loja, setLoja] = useState(CONFIG_BASE.loja);

  useEffect(() => {
    puxarConfigServidor().then((cfg) => {
      if (cfg && cfg.loja) setLoja(cfg.loja);
    });
  }, []);

  return (
    <div className="checkout-pagina">
      <header className="checkout-topo">
        <div className="container checkout-topo-linha">
          <Link to="/" className="marca">
            <span className="marca-logo" aria-hidden="true">{CONFIG_BASE.logoIniciais}</span>
            <span className="marca-nome"><span className="marca-titulo">{loja}</span></span>
          </Link>
          <Link to="/" className="checkout-voltar"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
        </div>
      </header>

      <main className="container checkout-miolo">
        <section className="checkout-cartao privacidade">
          <h1 className="checkout-titulo"><Icone nome="scroll-text" /> {t('termosTitulo')}</h1>
          <p className="privacidade-atualizacao">{t('termosAtualizada')}</p>
          <p className="privacidade-nota-idioma">{t('termosNota')}</p>

          <h2>{t('termos1T')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('termos1Txt', { loja }) }} />

          <h2>{t('termos2T')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termos2L1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos2L2') }} />
          </ul>

          <h2>{t('termos3T')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termos3L1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos3L2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos3L3') }} />
          </ul>

          <h2>{t('termos4T')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termos4L1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos4L2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos4L3') }} />
          </ul>

          <h2>{t('termos5T')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termos5L1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos5L2') }} />
          </ul>

          <h2>{t('termos6T')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termos6L1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos6L2') }} />
          </ul>

          <h2>{t('termos7T')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termos7L1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termos7L2') }} />
          </ul>

          <h2>{t('termos8T')}</h2>
          <p>
            {t('termos8A')} <Link to="/">{t('discordDaLoja')}</Link>{' '}
            <span dangerouslySetInnerHTML={{ __html: t('termos8B') }} />
          </p>
          <p>
            {t('termosVerPriv')} <Link to="/privacidade">{t('privacidade')}</Link>.
          </p>

          <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
        </section>
      </main>
    </div>
  );
}
