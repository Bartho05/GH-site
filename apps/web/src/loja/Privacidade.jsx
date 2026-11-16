/* =========================================================
   GH ROLEPLAY — Política de Privacidade (Fase 4 / LGPD)
   Página simples e direta: o que a loja coleta, para que e
   como o dono pode pedir a exclusão dos dados.
   ========================================================= */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CONFIG_BASE } from '../config-base.mjs';
import { mesclar, puxarConfigServidor } from '../lib/util.js';
import Icone from '../lib/Icone.jsx';

import '../styles.css';

export default function Privacidade() {
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
          <Link to="/" className="checkout-voltar"><Icone nome="arrow-left" /> Voltar à loja</Link>
        </div>
      </header>

      <main className="container checkout-miolo">
        <section className="checkout-cartao privacidade">
          <h1 className="checkout-titulo"><Icone nome="shield-check" /> Política de Privacidade</h1>
          <p className="privacidade-atualizacao">Última atualização: novembro de 2026 — feita conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).</p>

          <h2>O que a loja coleta</h2>
          <ul>
            <li><strong>Seu ID no servidor</strong> (in-game): é necessário para entregar o produto comprado.</li>
            <li><strong>Sua conta Discord</strong> (ID e nome), <em>apenas se você clicar em "Entrar com o Discord"</em>: serve para o suporte te encontrar e avisar sobre o pedido.</li>
            <li><strong>Histórico de pedidos</strong>: itens, valores e status — usado pela staff para conferir pagamentos.</li>
          </ul>

          <h2>O que a loja <strong>não</strong> coleta</h2>
          <ul>
            <li>Não pedimos CPF, endereço, telefone ou qualquer dado sensível.</li>
            <li>Não vemos e guardamos dados do seu cartão: o pagamento via Pix fica no banco/Mercado Pago.</li>
          </ul>

          <h2>O que fica no seu navegador</h2>
          <p>Para o site funcionar, guardamos no seu próprio navegador (localStorage): tema escolhido, carrinho e a resposta do aviso de cookies. Isso sai do seu computador nunca — limpar os dados do navegador apaga.</p>

          <h2>Para que usamos os dados</h2>
          <ul>
            <li>Entregar o que você comprou no servidor;</li>
            <li>Conferir o pagamento e resolver problemas de pedido;</li>
            <li>Manter a loja segura (registro interno das ações administrativas).</li>
          </ul>

          <h2>Por quanto tempo</h2>
          <p>Guardamos o histórico de pedidos enquanto a loja estiver ativa, para fins de conferência financeira. A senha do painel e o registro de ações ficam no servidor da loja.</p>

          <h2>Seus direitos</h2>
          <p>Você pode pedir a qualquer momento: cópia dos seus dados, correção ou <strong>exclusão</strong> (anonimização do histórico). Basta falar com a staff no Discord da loja informando seu ID no servidor — pedimos uma confirmação simples pelo Discord para provar que a conta é sua.</p>

          <h2>Segurança</h2>
          <p>O painel do dono é protegido por senha e as rotas administrativas são bloqueadas sem sessão. A comunicação do servidor do jogo com a loja usa chave compartilhada e as ações são registradas.</p>

          <h2>Contato</h2>
          <p>Dúvidas sobre esta política ou pedidos de exclusão: entre no <Link to="/">Discord da loja</Link> e fale com a staff.</p>

          <Link to="/" className="btn btn-secundario"><Icone nome="arrow-left" /> Voltar à loja</Link>
        </section>
      </main>
    </div>
  );
}
