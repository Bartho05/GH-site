/* =========================================================
   GH ROLEPLAY — Termos e condições
   Regras do comércio digital da loja (produtos FiveM).
   Padrão do LGPD: mesma casca da página de privacidade.
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor } from '../lib/util.js';
import Icone from '../lib/Icone.jsx';
import { usarIdioma } from '../lib/i18n.js';

import '../styles.css';

const CONFIG_INICIAL = mesclar(CONFIG_BASE, {});

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
          <p className="privacidade-atualizacao">Última atualização: novembro de 2026.</p>
          <p className="privacidade-nota-idioma">{t('termosNota')}</p>

          <h2>1. O que é a loja</h2>
          <p>A {loja} é uma loja de <strong>produtos digitais para um servidor de FiveM</strong> (vantagens e itens in-game, como VIPs e kits). Ao comprar, você concorda com estes termos sem restrições.</p>

          <h2>2. Quem pode comprar</h2>
          <ul>
            <li>Qualquer jogador com um <strong>ID válido no servidor</strong> (letras, números, _ ou -).</li>
            <li>Menores de 18 anos devem comprar com autorização dos responsáveis — a conta do Pix é de quem paga.</li>
          </ul>

          <h2>3. Preço, pagamento e cobrança</h2>
          <ul>
            <li>Os preços são em <strong>reais (R$)</strong> e o pagamento é via Pix. Outras moedas exibidas no site são <strong>só referência</strong> (valor aproximado).</li>
            <li>O pedido só é processado depois da confirmação do pagamento (Pix automático pelo Mercado Pago ou conferência da staff).</li>
            <li>Nunca compartilhe comprovantes com terceiros fora dos canais oficiais da loja.</li>
          </ul>

          <h2>4. Entrega</h2>
          <ul>
            <li>A entrega é <strong>automática</strong>: confirmado o pagamento, o item vai para o ID informado no checkout (fila do servidor, geralmente em segundos com o servidor online).</li>
            <li><strong>Confira o ID antes de confirmar</strong> — itens entregues para um ID errado informado por você não são de responsabilidade da loja.</li>
            <li>Servidor offline? A fila espera e entrega quando ele voltar; nada se perde.</li>
          </ul>

          <h2>5. Política de reembolso</h2>
          <ul>
            <li>Produtos digitais entregues <strong>não têm reembolso</strong> após a entrega, salvo obrigação legal.</li>
            <li>Se houve cobrança duplicada, falha de entrega ou item diferente do anunciado, fale com a staff no Discord <strong>em até 7 dias</strong> com o código do pedido — resolvemos reentregando ou estornando pelo Pix.</li>
          </ul>

          <h2>6. Regras do servidor</h2>
          <ul>
            <li>Vantagens compradas seguem as <strong>regras do servidor</strong> (roleplay). Uso indevido, exploração de bugs ou compras para burlar regras podem ser revogados <strong>sem reembolso</strong>.</li>
            <li>Contas banidas por quebra de regras não recebem reembolso de itens já entregues.</li>
          </ul>

          <h2>7. Mudanças e disponibilidade</h2>
          <ul>
            <li>Preços, catálogo e promoções podem mudar a qualquer momento; o vale é o preço na hora do pedido.</li>
            <li>Estes termos podem ser atualizados — a versão publicada nesta página vale sempre.</li>
          </ul>

          <h2>8. Suporte e contato</h2>
          <p>Dúvidas, problemas de pedido ou denúncias: <Link to="/">Discord da loja</Link> (também nos botões de suporte do site). Informe sempre o <strong>código do pedido</strong> (PED-...).</p>
          <p>Veja também nossa <Link to="/privacidade">Política de Privacidade</Link>.</p>

          <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> {t('voltarLoja')}</Link>
        </section>
      </main>
    </div>
  );
}
