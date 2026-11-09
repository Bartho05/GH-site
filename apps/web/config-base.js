/* =========================================================
   config-base.js — CONFIGURAÇÃO PADRÃO DA LOJA
   Carregado pelo site (index.html) e pelo painel (admin.html).

   Este arquivo é o "estado de fábrica". O dono normalmente
   altera as configurações pelo painel (admin.html), que salva
   uma camada por cima no navegador. Edite aqui só para mudar
   os valores iniciais.
   ========================================================= */
/* ---------- CONFIG PADRÃO (o admin pode sobrescrever) ---------- */
const CONFIG_BASE = {
  loja: 'GH Roleplay',
  logoIniciais: 'GH',

  cupom: {
    codigo: 'GHBEMVINDO',
    desconto: 10,      // %
    minimo: 150        // R$ mínimo do pedido para valer
  },

  anuncio: 'UTILIZE O CUPOM {cod} E GARANTA {pct}% OFF NO PRIMEIRO PEDIDO',

  servidor: {
    link: '#',              // link "Conectar" (ex.: https://cfx.re/join/codigo)
    jogadores: 312          // número estático de demonstração
  },

  temaPadrao: 'laranja',    // laranja | rosa | verde

  pagamentos: ['Pix', 'Cartão de Crédito', 'Mercado Pago'],

  frasesHero: [
    { inicio: 'Domine',   destaque: 'o PvP da cidade' },
    { inicio: 'Monte',    destaque: 'sua lenda no servidor' },
    { inicio: 'R$ 20 mil', destaque: 'em prêmios todo mês' },
    { inicio: 'Leve',     destaque: 'sua gangue ao topo' }
  ],

  pilares: 'Competição • Loja • Recompensas • Comunidade',

  numeros: [
    { icone: 'users',         prefixo: '+ de', valor: 60000,  decimais: 0, rotulo: 'Clientes atendidos' },
    { icone: 'package-check', prefixo: '+ de', valor: 200000, decimais: 0, rotulo: 'Pedidos entregues' },
    { icone: 'star',          prefixo: null,   valor: 4.9,    decimais: 1, rotulo: 'Nota média dos clientes' },
    { icone: 'trophy',        prefixo: 'R$',   valor: 20000,  decimais: 0, rotulo: 'Em prêmios todo mês' }
  ],

  podio: [
    { nome: 'Dash', valor: 'R$ 1.233,45' },
    { nome: 'Nyx',  valor: 'R$ 640,00' },
    { nome: 'Zed',  valor: 'R$ 389,90' }
  ],

  categorias: [
    { id: 'oferta',   nome: 'OFERTA DA SEMANA', destaque: true },
    { id: 'vips',     nome: 'VIPS' },
    { id: 'veiculos', nome: 'VEÍCULOS' },
    { id: 'armas',    nome: 'ARMAS' },
    { id: 'combos',   nome: 'COMBOS' },
    { id: 'dancas',   nome: 'DANÇAS' }
  ],

  produtos: [
    { nome: 'VIP BOOSTER – 1 DIA',      categoria: 'oferta',   preco: 19.99, precoAntigo: 34.99, icone: 'rocket',       cores: ['#4a1030', '#171018'], tag: 'Promoção' },
    { nome: 'COMBO BEM-VINDO',          categoria: 'oferta',   preco: 24.99, precoAntigo: 39.99, icone: 'party-popper', cores: ['#3a1030', '#161018'], tag: '' },
    { nome: 'VIP BRONZE – 7 DIAS',      categoria: 'vips',     preco: 14.99, precoAntigo: 24.99, icone: 'crown',        cores: ['#3f1435', '#151018'], tag: '' },
    { nome: 'VIP OURO – 30 DIAS',       categoria: 'vips',     preco: 49.99, precoAntigo: 89.99, icone: 'gem',          cores: ['#4a2410', '#181114'], tag: 'Mais vendido' },
    { nome: 'VIP DIAMANTE – 30 DIAS',   categoria: 'vips',     preco: 89.99, precoAntigo: null,  icone: 'gem',          cores: ['#103a4a', '#101a18'], tag: '' },
    { nome: 'SW4 BLINDADA',             categoria: 'veiculos', preco: 34.99, precoAntigo: 54.99, icone: 'car',          cores: ['#12314a', '#11141a'], tag: '' },
    { nome: 'MANSÃO NO MORRO',          categoria: 'veiculos', preco: 27.99, precoAntigo: null,  icone: 'building-2',   cores: ['#2a2040', '#141118'], tag: '' },
    { nome: 'GLOCK RUBI',               categoria: 'armas',    preco: 19.99, precoAntigo: 39.99, icone: 'crosshair',    cores: ['#4a1030', '#171018'], tag: '' },
    { nome: 'KIT ARMAS COMPLETO',       categoria: 'armas',    preco: 59.99, precoAntigo: null,  icone: 'swords',       cores: ['#40102a', '#161018'], tag: '' },
    { nome: 'CAIXA LENDÁRIA',           categoria: 'combos',   preco: 24.99, precoAntigo: 44.99, icone: 'package',      cores: ['#3a2210', '#161118'], tag: 'Novo' },
    { nome: 'COMBO INICIANTE',          categoria: 'combos',   preco: 29.99, precoAntigo: null,  icone: 'zap',          cores: ['#0f3a2e', '#14181a'], tag: '' },
    { nome: 'DANÇA EXCLUSIVA',          categoria: 'dancas',   preco: 9.99,  precoAntigo: null,  icone: 'music',        cores: ['#2e103f', '#131018'], tag: '' },
    { nome: 'SKIN PERSONALIZADA',       categoria: 'dancas',   preco: 17.99, precoAntigo: 27.99, icone: 'shirt',        cores: ['#103f34', '#141a18'], tag: '' },
    { nome: 'RESETAR PERSONAGEM',       categoria: 'dancas',   preco: 12.99, precoAntigo: null,  icone: 'refresh-cw',   cores: ['#1f1030', '#121018'], tag: '' }
  ],

  depoimentos: [
    { nome: 'Ana M.',   nota: 5, texto: 'Entrega instantânea, cheguei no servidor e já estava liberado.', produto: 'VIP OURO – 30 DIAS',    data: 'hoje' },
    { nome: 'Bruno S.', nota: 5, texto: 'Suporte respondeu em 2 minutos no chat. Recomendo.',              produto: 'SW4 BLINDADA',           data: 'hoje' },
    { nome: 'Carla R.', nota: 4, texto: 'Produto bom, só demorou 1 minuto pra confirmar o pagamento.',     produto: 'GLOCK RUBI',             data: 'ontem' },
    { nome: 'Diego F.', nota: 5, texto: 'Melhor loja do servidor, já é minha terceira compra.',            produto: 'CAIXA LENDÁRIA',         data: 'ontem' },
    { nome: 'Ellen P.', nota: 5, texto: 'Tô junto desde o começo. Confiança total.',                       produto: 'VIP BRONZE – 7 DIAS',    data: '2 dias' }
  ],

  links: [
    { nome: 'Instagram', icone: 'instagram',      url: '#' },
    { nome: 'Discord',   icone: 'gamepad-2',      url: '#' },
    { nome: 'Whatsapp',  icone: 'message-circle', url: '#' },
    { nome: 'Youtube',   icone: 'youtube',        url: '#' }
  ]
};

/* Fonte única de verdade: este arquivo carrega no navegador (script clássico,
   define window.CONFIG_BASE) e também no Node (module.exports), pelo backend. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG_BASE };
}
if (typeof window !== 'undefined' && !window.CONFIG_BASE) {
  window.CONFIG_BASE = CONFIG_BASE;
}
