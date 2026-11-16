/* =========================================================
   GH ROLEPLAY — Política de Privacidade (Fase 4 / LGPD)
   Página simples e direta: o que a loja coleta, para que e
   como o dono pode pedir a exclusão dos dados.
   Texto legal traduzido nas 4 línguas (i18n).
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { puxarConfigServidor } from '../lib/util.js';
import Icone from '../lib/Icone.jsx';
import { usarIdioma } from '../lib/i18n.js';

import '../styles.css';

export default function Privacidade() {
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
          <h1 className="checkout-titulo"><Icone nome="shield-check" /> {t('privacidade')}</h1>
          <p className="privacidade-atualizacao">{t('privAtualizada')}</p>

          <h2>{t('privColetaT')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('privColetaL1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('privColetaL2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('privColetaL3') }} />
          </ul>

          <h2 dangerouslySetInnerHTML={{ __html: t('privNaoT') }}></h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('privNaoL1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('privNaoL2') }} />
          </ul>

          <h2>{t('privNavegadorT')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('privNavegadorTxt') }} />

          <h2>{t('privUsoT')}</h2>
          <ul>
            <li>{t('privUsoL1')}</li>
            <li>{t('privUsoL2')}</li>
            <li>{t('privUsoL3')}</li>
          </ul>

          <h2>{t('privPrazoT')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('privPrazoTxt') }} />

          <h2>{t('privDireitosT')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('privDireitosTxt') }} />

          <h2>{t('privSegT')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('privSegTxt') }} />

          <h2>{t('contato')}</h2>
          <p>
            {t('privContatoA')} <Link to="/">{t('discordDaLoja')}</Link> {t('privContatoB')}
          </p>

          <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
        </section>
      </main>
    </div>
  );
}
