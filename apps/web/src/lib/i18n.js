/* =========================================================
   Preferências do visitante: idioma, moeda e cursor
   (inspiração ProLeague: painel de ajustes da loja)

   - Idioma troca os textos da interface (produtos/banner
     continuam como o dono cadastrou no painel).
   - Moeda é SÓ referência: o valor aproximado em outra
     moeda; a cobrança é sempre em reais (R$).
   - Cursor troca o ponteiro do site (mira = vibe FiveM).
   Todos guardados no localStorage e aplicados no <html>
   (dataset) — ver index.html para aplicar antes da pintura.
   ========================================================= */
import { useEffect, useState } from 'react';

/* ---------- infraestrutura de eventos ---------- */
const EVENTO = 'gh-preferencia';

export function lerPreferencia(chave, padrao) {
  try { return localStorage.getItem(chave) || padrao; } catch (e) { return padrao; }
}

export function salvarPreferencia(chave, valor, dataset) {
  try {
    if (valor === undefined || valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch (e) {}
  if (dataset) {
    if (valor === undefined || valor === null) delete document.documentElement.dataset[dataset];
    else document.documentElement.dataset[dataset] = valor;
  }
  window.dispatchEvent(new Event(EVENTO));
}

/* hook compartilhado: re-renderiza quando qualquer preferência muda */
export function usarPreferencia(chave, padrao) {
  const [valor, setValor] = useState(() => lerPreferencia(chave, padrao));
  useEffect(() => {
    const aoMudar = () => setValor(lerPreferencia(chave, padrao));
    window.addEventListener(EVENTO, aoMudar);
    return () => window.removeEventListener(EVENTO, aoMudar);
  }, [chave, padrao]);
  return valor;
}

/* ---------- idiomas ---------- */
export const IDIOMAS = [
  { id: 'pt', nome: 'Português', bandeira: '🇧🇷' },
  { id: 'en', nome: 'English', bandeira: '🇺🇸' },
  { id: 'es', nome: 'Español', bandeira: '🇪🇸' },
  { id: 'it', nome: 'Italiano', bandeira: '🇮🇹' }
];

const DICT = {
  /* ---- global / cabeçalho ---- */
  pular: { pt: 'Pular para o conteúdo', en: 'Skip to content', es: 'Saltar al contenido', it: 'Salta al contenuto' },
  entrar: { pt: 'Entrar', en: 'Sign in', es: 'Entrar', it: 'Accedi' },
  carrinho: { pt: 'Carrinho', en: 'Cart', es: 'Carrito', it: 'Carrello' },
  buscar: { pt: 'Buscar produto', en: 'Search products', es: 'Buscar producto', it: 'Cerca prodotto' },
  nadaEncontrado: { pt: 'Nenhum produto encontrado.', en: 'No products found.', es: 'Ningún producto encontrado.', it: 'Nessun prodotto trovato.' },
  ajustes: { pt: 'Ajustes do site', en: 'Site settings', es: 'Ajustes del sitio', it: 'Impostazioni del sito' },
  suporte: { pt: 'Suporte', en: 'Support', es: 'Soporte', it: 'Assistenza' },
  voltarLoja: { pt: 'Voltar à loja', en: 'Back to store', es: 'Volver a la tienda', it: 'Torna allo store' },
  continuarComprando: { pt: 'Continuar comprando', en: 'Continue shopping', es: 'Seguir comprando', it: 'Continua lo shopping' },
  finalizarCompra: { pt: 'Finalizar compra', en: 'Checkout', es: 'Finalizar compra', it: 'Vai alla cassa' },

  /* ---- painel de ajustes ---- */
  movimento: { pt: 'Movimento', en: 'Motion', es: 'Movimiento', it: 'Movimento' },
  reduzirAnim: { pt: 'Reduzir animações', en: 'Reduce animations', es: 'Reducir animaciones', it: 'Riduci animazioni' },
  reduzirAnimDica: { pt: 'Desliga a digitação do título e as entradas suaves.', en: 'Turns off the typed headline and soft entrances.', es: 'Apaga la escritura del título y las entradas suaves.', it: 'Disattiva la digitazione del titolo e le entrate morbide.' },
  corLoja: { pt: 'Cor da loja', en: 'Store color', es: 'Color de la tienda', it: 'Colore dello store' },
  corDica: { pt: 'A cor vale para todo o site e fica lembrada.', en: 'The color applies to the whole site and is remembered.', es: 'El color vale para todo el sitio y queda guardado.', it: 'Il colore vale per tutto il sito e viene salvato.' },
  temaDisponivelEm: { pt: 'Disponível em {d}', en: 'Available from {d}', es: 'Disponible desde {d}', it: 'Disponibile dal {d}' },
  idioma: { pt: 'Idioma', en: 'Language', es: 'Idioma', it: 'Lingua' },
  moeda: { pt: 'Moeda', en: 'Currency', es: 'Moneda', it: 'Valuta' },
  moedaDica: { pt: 'Valor aproximado, só para referência. A cobrança é sempre em reais (R$).', en: 'Approximate value, for reference only. You are always charged in reais (R$).', es: 'Valor aproximado, solo de referencia. El cobro siempre es en reales (R$).', it: 'Valore approssimativo, solo di riferimento. Il pagamento è sempre in real (R$).' },
  cursor: { pt: 'Cursor', en: 'Cursor', es: 'Cursor', it: 'Cursore' },
  cursorDica: { pt: 'Passe o mouse para testar', en: 'Hover to try them', es: 'Pasa el mouse para probar', it: 'Passa il mouse per provarli' },
  cursorSistema: { pt: 'Sistema', en: 'System', es: 'Sistema', it: 'Sistema' },
  cursorMira: { pt: 'Mira', en: 'Crosshair', es: 'Mira', it: 'Mirino' },
  cursorPonto: { pt: 'Ponto', en: 'Dot', es: 'Punto', it: 'Punto' },
  cursorPontoG: { pt: 'Ponto grande', en: 'Big dot', es: 'Punto grande', it: 'Punto grande' },
  canais: { pt: 'Canais de atendimento', en: 'Support channels', es: 'Canales de atención', it: 'Canali di assistenza' },
  canaisDica: { pt: 'Resposta em minutos, todos os dias.', en: 'Reply in minutes, every day.', es: 'Respuesta en minutos, todos los días.', it: 'Risposta in pochi minuti, tutti i giorni.' },
  suporteEmail: { pt: 'E-mail', en: 'E-mail', es: 'E-mail', it: 'E-mail' },

  /* ---- carrinho ---- */
  fecharCarrinho: { pt: 'Fechar carrinho', en: 'Close cart', es: 'Cerrar carrito', it: 'Chiudi carrello' },
  carrinhoVazio1: { pt: 'Seu carrinho está vazio.', en: 'Your cart is empty.', es: 'Tu carrito está vacío.', it: 'Il tuo carrello è vuoto.' },
  carrinhoVazio2: { pt: 'Explore o catálogo para começar.', en: 'Browse the catalog to get started.', es: 'Explora el catálogo para empezar.', it: 'Esplora il catalogo per iniziare.' },
  menosUm: { pt: 'Menos um', en: 'Remove one', es: 'Quitar uno', it: 'Togli uno' },
  maisUm: { pt: 'Mais um', en: 'Add one', es: 'Agregar uno', it: 'Aggiungi uno' },
  removerItem: { pt: 'Remover do carrinho', en: 'Remove from cart', es: 'Quitar del carrito', it: 'Rimuovi dal carrello' },
  total: { pt: 'Total', en: 'Total', es: 'Total', it: 'Totale' },
  irCheckout: { pt: 'Ir para o checkout', en: 'Go to checkout', es: 'Ir al pago', it: 'Vai alla cassa' },
  faltaCupom: { pt: 'Faltam <strong>{v}</strong> para {p}% OFF com o cupom <strong>{c}</strong>', en: '<strong>{v}</strong> left for {p}% OFF with coupon <strong>{c}</strong>', es: 'Faltan <strong>{v}</strong> para {p}% OFF con el cupón <strong>{c}</strong>', it: 'Mancano <strong>{v}</strong> per il {p}% OFF con il coupon <strong>{c}</strong>' },
  cupomLiberado: { pt: 'Cupom liberado! {p}% OFF pronto para usar', en: 'Coupon unlocked! {p}% OFF ready to use', es: '¡Cupón liberado! {p}% OFF listo para usar', it: 'Coupon sbloccato! {p}% OFF pronto da usare' },
  aplicarCupom: { pt: 'Aplicar {c}', en: 'Apply {c}', es: 'Aplicar {c}', it: 'Applica {c}' },

  /* ---- hero / seções ---- */
  srHero: { pt: 'A loja oficial do servidor de roleplay', en: 'The official roleplay server store', es: 'La tienda oficial del servidor de roleplay', it: 'Lo store ufficiale del server di roleplay' },
  tiktokLive: { pt: 'Ao vivo agora no TikTok', en: 'Live now on TikTok', es: 'En vivo ahora en TikTok', it: 'In diretta ora su TikTok' },
  inicio: { pt: 'Início', en: 'Home', es: 'Inicio', it: 'Home' },

  /* ---- ofertas sazonais (cards de evento, estilo ProLeague) ---- */
  eventoAcabaEm: { pt: 'Acaba em', en: 'Ends on', es: 'Termina el', it: 'Termina il' },
  eventoVerOfertas: { pt: 'Ver ofertas', en: 'See offers', es: 'Ver ofertas', it: 'Vedi offerte' },
  eventoHalloween: { pt: 'Halloween', en: 'Halloween', es: 'Halloween', it: 'Halloween' },
  eventoHalloweenTexto: { pt: 'Ofertas novas até 31 de outubro', en: 'New offers until October 31st', es: 'Ofertas nuevas hasta el 31 de octubre', it: 'Nuove offerte fino al 31 ottobre' },
  eventoNatal: { pt: 'Natal', en: 'Christmas', es: 'Navidad', it: 'Natale' },
  eventoNatalTexto: { pt: 'Ofertas de Natal até 25 de dezembro', en: 'Christmas offers until December 25th', es: 'Ofertas de Navidad hasta el 25 de diciembre', it: 'Offerte di Natale fino al 25 dicembre' },
  onlineAgora: { pt: 'jogadores online agora', en: 'players online now', es: 'jugadores online ahora', it: 'giocatori online ora' },
  conectar: { pt: 'Conectar', en: 'Connect', es: 'Conectar', it: 'Connetti' },
  explorar: { pt: 'Explorar produtos', en: 'Browse products', es: 'Explorar productos', it: 'Esplora i prodotti' },
  pagSeguro: { pt: 'Pagamento seguro', en: 'Secure payment', es: 'Pago seguro', it: 'Pagamento sicuro' },
  verCatalogo: { pt: 'Ver o catálogo', en: 'View the catalog', es: 'Ver el catálogo', it: 'Vedi il catalogo' },
  podioLabel: { pt: 'Maiores apoiadores da loja', en: 'Top store supporters', es: 'Mayores apoyadores de la tienda', it: 'Migliori sostenitori dello store' },
  produtosPalavra: { pt: 'produtos', en: 'products', es: 'productos', it: 'prodotti' },
  verCategoria: { pt: 'Ver categoria', en: 'View category', es: 'Ver categoría', it: 'Vedi categoria' },
  depoimentosTitulo: { pt: 'Depoimentos de clientes', en: 'Customer reviews', es: 'Opiniones de clientes', it: 'Recensioni dei clienti' },
  estrelasAria: { pt: '{n} de 5 estrelas', en: '{n} out of 5 stars', es: '{n} de 5 estrellas', it: '{n} su 5 stelle' },
  entregaInstantanea: { pt: 'Entrega instantânea', en: 'Instant delivery', es: 'Entrega instantánea', it: 'Consegna istantanea' },

  /* ---- rodapé ---- */
  rodapeDescricao: { pt: 'Aqui você apoia o servidor: os recursos vão para a infraestrutura, melhorias e para as novidades do jogo.', en: 'Here you support the server: the funds go to infrastructure, improvements and game news.', es: 'Aquí apoyas al servidor: los recursos van para la infraestructura, mejoras y novedades del juego.', it: 'Qui sostieni il server: i fondi vanno per infrastruttura, miglioramenti e novità del gioco.' },
  rodapeLoja: { pt: 'Loja', en: 'Store', es: 'Tienda', it: 'Store' },
  rodapeAjuda: { pt: 'Ajuda', en: 'Help', es: 'Ayuda', it: 'Aiuto' },
  rodapeComunidade: { pt: 'Comunidade', en: 'Community', es: 'Comunidad', it: 'Comunità' },
  catalogo: { pt: 'Catálogo', en: 'Catalog', es: 'Catálogo', it: 'Catalogo' },
  ranking: { pt: 'Ranking', en: 'Ranking', es: 'Ranking', it: 'Classifica' },
  meusPedidos: { pt: 'Meus pedidos', en: 'My orders', es: 'Mis pedidos', it: 'I miei ordini' },
  termos: { pt: 'Termos e condições', en: 'Terms & conditions', es: 'Términos y condiciones', it: 'Termini e condizioni' },
  privacidade: { pt: 'Política de Privacidade', en: 'Privacy Policy', es: 'Política de Privacidad', it: 'Informativa sulla Privacy' },
  contato: { pt: 'Contato', en: 'Contact', es: 'Contacto', it: 'Contatti' },
  painelDono: { pt: 'Painel do dono', en: 'Owner panel', es: 'Panel del dueño', it: 'Pannello del proprietario' },
  rodapeNotaA: { pt: 'Loja do servidor — as configurações ficam no', en: 'Server store — settings live in the', es: 'Tienda del servidor — la configuración queda en el', it: 'Store del server — le impostazioni sono nel' },
  rodapeNotaB: { pt: '.', en: '.', es: '.', it: '.' },

  /* ---- cupom + brinde (abas laterais) ---- */
  cupomWidget: { pt: 'CUPOM', en: 'COUPON', es: 'CUPÓN', it: 'COUPON' },
  cupomDisponivel: { pt: 'Cupom disponível', en: 'Coupon available', es: 'Cupón disponible', it: 'Coupon disponibile' },
  cupomTitulo: { pt: '{p}% OFF nas suas compras', en: '{p}% OFF on your purchases', es: '{p}% OFF en tus compras', it: '{p}% OFF sui tuoi acquisti' },
  cupomUse: { pt: 'Copie o código e use no carrinho:', en: 'Copy the code and use it in the cart:', es: 'Copia el código y úsalo en el carrito:', it: 'Copia il codice e usalo nel carrello:' },
  copiarCupom: { pt: 'Copiar cupom', en: 'Copy coupon', es: 'Copiar cupón', it: 'Copia coupon' },
  cupomValido: { pt: 'Válido em qualquer pedido do carrinho.', en: 'Valid on any cart order.', es: 'Válido para cualquier pedido del carrito.', it: 'Valido per qualsiasi ordine nel carrello.' },

  cupomValidoMin: { pt: 'Válido em pedidos acima de {v}.', en: 'Valid on orders above {v}.', es: 'Válido en pedidos arriba de {v}.', it: 'Valido per ordini sopra {v}.' },
  brinde: { pt: 'BRINDE', en: 'FREEBIE', es: 'REGALO', it: 'OMAGGIO' },
  brindeTitulo: { pt: 'Skin exclusiva grátis', en: 'Free exclusive skin', es: 'Skin exclusiva gratis', it: 'Skin esclusiva gratis' },
  brindeUse: { pt: 'Aponte a câmera do celular para o código:', en: 'Point your phone camera at the code:', es: 'Apunta la cámara del celular al código:', it: 'Inquadra il codice con la fotocamera:' },
  brindeNota: { pt: 'Este é um QR de demonstração — troque pelo link do seu brinde.', en: 'This is a demo QR — swap in your freebie link.', es: 'Este es un QR de demostración — cámbialo por tu enlace.', it: 'Questo QR è dimostrativo — sostituiscilo col tuo link.' },
  brindeVideo: { pt: 'Ver vídeo tutorial', en: 'Watch the video tutorial', es: 'Ver el video tutorial', it: 'Guarda il video tutorial' },

  /* ---- consentimento LGPD ---- */
  consentA: { pt: 'Usamos cookies e armazenamento local para lembrar seu tema, seu carrinho e processar pedidos. Detalhes na', en: 'We use cookies and local storage to remember your theme, your cart and to process orders. Details in the', es: 'Usamos cookies y almacenamiento local para recordar tu tema, tu carrito y procesar pedidos. Detalles en la', it: 'Usiamo cookie e archiviazione locale per ricordare tema, carrello ed elaborare ordini. Dettagli nella' },
  consentB: { pt: '.', en: '.', es: '.', it: '.' },
  aceito: { pt: 'Aceito', en: 'Accept', es: 'Acepto', it: 'Accetto' },

  /* ---- checkout ---- */
  checkoutTitulo: { pt: 'Finalizar compra', en: 'Checkout', es: 'Finalizar compra', it: 'Vai alla cassa' },
  etapas: { pt: 'Etapas do pedido', en: 'Order steps', es: 'Etapas del pedido', it: 'Fasi dell\u2019ordine' },
  passoPagamento: { pt: 'Pagamento', en: 'Payment', es: 'Pago', it: 'Pagamento' },
  passoConfirmacao: { pt: 'Confirmação', en: 'Confirmation', es: 'Confirmación', it: 'Conferma' },
  passoEntrega: { pt: 'Entrega', en: 'Delivery', es: 'Entrega', it: 'Consegna' },
  idServidor: { pt: 'Seu ID no servidor', en: 'Your in-game ID', es: 'Tu ID en el servidor', it: 'Il tuo ID sul server' },
  idServidorDica: { pt: 'aparece na lista de jogadores (TAB)', en: 'shown in the player list (TAB)', es: 'aparece en la lista de jugadores (TAB)', it: 'visibile nella lista dei giocatori (TAB)' },
  contaDiscord: { pt: 'Conta Discord', en: 'Discord account', es: 'Cuenta de Discord', it: 'Account Discord' },
  contaDiscordDica: { pt: 'usada para avisos e conferência da staff', en: 'used for notifications and staff checks', es: 'usada para avisos y verificación del staff', it: 'usata per avvisi e verifiche dello staff' },
  entrarDiscord: { pt: 'Entrar com Discord', en: 'Sign in with Discord', es: 'Entrar con Discord', it: 'Accedi con Discord' },
  trocar: { pt: 'trocar', en: 'change', es: 'cambiar', it: 'cambia' },
  semDiscord: { pt: 'Login com Discord ainda não está ativo nesta loja — a staff confere seu ID no servidor.', en: 'Discord login is not active in this store yet — staff will check your in-game ID.', es: 'El login con Discord aún no está activo en esta tienda — el staff confirma tu ID en el servidor.', it: 'Il login con Discord non è ancora attivo in questo store — lo staff verifica il tuo ID sul server.' },
  cupom: { pt: 'Cupom', en: 'Coupon', es: 'Cupón', it: 'Coupon' },
  cupomDica: { pt: '{p}% OFF a partir de {v}', en: '{p}% OFF from {v}', es: '{p}% OFF a partir de {v}', it: '{p}% OFF da {v}' },
  resumoPedido: { pt: 'Resumo do pedido', en: 'Order summary', es: 'Resumen del pedido', it: 'Riepilogo ordine' },
  carrinhoVazioCurto: { pt: 'Carrinho vazio.', en: 'Cart is empty.', es: 'Carrito vacío.', it: 'Carrello vuoto.' },
  escolherProdutos: { pt: 'Escolher produtos', en: 'Choose products', es: 'Elegir productos', it: 'Scegli prodotti' },
  subtotal: { pt: 'Subtotal', en: 'Subtotal', es: 'Subtotal', it: 'Subtotale' },
  descontoCupom: { pt: 'Cupom {c}', en: 'Coupon {c}', es: 'Cupón {c}', it: 'Coupon {c}' },
  offAplicado: { pt: '{p}% OFF aplicado', en: '{p}% OFF applied', es: '{p}% OFF aplicado', it: '{p}% OFF applicato' },
  confirmarPedido: { pt: 'Confirmar pedido', en: 'Place order', es: 'Confirmar pedido', it: 'Conferma ordine' },
  criandoPedido: { pt: 'Criando pedido…', en: 'Placing order…', es: 'Creando pedido…', it: 'Creazione ordine…' },
  pixNotaAuto: { pt: 'Pix gerado na hora pelo Mercado Pago — confirmação automática.', en: 'Pix generated instantly by Mercado Pago — automatic confirmation.', es: 'Pix generado al instante por Mercado Pago — confirmación automática.', it: 'Pix generato subito da Mercado Pago — conferma automatica.' },
  pixNotaManual: { pt: 'Pagamento via Pix — a staff confirma em minutos.', en: 'Payment via Pix — staff confirms in minutes.', es: 'Pago vía Pix — el staff confirma en minutos.', it: 'Pagamento via Pix — lo staff conferma in pochi minuti.' },
  privDicaA: { pt: 'Seus dados ficam só no servidor da loja — nada é compartilhado. Veja a', en: 'Your data stays on the store server only — nothing is shared. See the', es: 'Tus datos quedan solo en el servidor de la tienda — nada se comparte. Mira la', it: 'I tuoi dati restano solo sul server dello store — nulla viene condiviso. Vedi la' },
  privDicaB: { pt: '.', en: '.', es: '.', it: '.' },
  erroId: { pt: 'Informe seu ID no servidor (só letras, números, _ ou -).', en: 'Enter your in-game ID (letters, numbers, _ or - only).', es: 'Ingresa tu ID del servidor (solo letras, números, _ o -).', it: 'Inserisci il tuo ID sul server (solo lettere, numeri, _ o -).' },
  erroPedido: { pt: 'Não foi possível criar o pedido. Tente de novo.', en: 'Could not place the order. Try again.', es: 'No se pudo crear el pedido. Intenta de nuevo.', it: 'Impossibile creare l\u2019ordine. Riprova.' },
  erroConexao: { pt: 'Sem conexão com o servidor da loja.', en: 'No connection to the store server.', es: 'Sin conexión con el servidor de la tienda.', it: 'Senza connessione al server dello store.' },
  erroDiscord: { pt: 'Não foi possível conectar sua conta do Discord. Tente de novo.', en: 'Could not connect your Discord account. Try again.', es: 'No se pudo conectar tu cuenta de Discord. Intenta de nuevo.', it: 'Impossibile collegare il tuo account Discord. Riprova.' },
  aguardando: { pt: 'Aguardando pagamento', en: 'Awaiting payment', es: 'Esperando pago', it: 'In attesa di pagamento' },
  pagoStatus: { pt: 'Pagamento confirmado', en: 'Payment confirmed', es: 'Pago confirmado', it: 'Pagamento confermato' },
  entregueStatus: { pt: 'Entregue no servidor', en: 'Delivered in-game', es: 'Entregado en el servidor', it: 'Consegnato sul server' },
  canceladoStatus: { pt: 'Pedido cancelado', en: 'Order canceled', es: 'Pedido cancelado', it: 'Ordine annullato' },
  pedido: { pt: 'Pedido', en: 'Order', es: 'Pedido', it: 'Ordine' },
  dicaPendente: { pt: 'Esta página atualiza sozinha — deixe-a aberta. Assim que o pagamento for confirmado, a entrega cai direto no servidor.', en: 'This page updates itself — keep it open. As soon as payment is confirmed, delivery lands straight on the server.', es: 'Esta página se actualiza sola — déjala abierta. En cuanto se confirme el pago, la entrega cae directo en el servidor.', it: 'Questa pagina si aggiorna da sola — lasciala aperta. Appena il pagamento è confermato, la consegna arriva sul server.' },
  dicaPago: { pt: 'Pagamento confirmado! Sua entrega já está na fila do servidor.', en: 'Payment confirmed! Your delivery is already in the server queue.', es: '¡Pago confirmado! Tu entrega ya está en la fila del servidor.', it: 'Pagamento confermato! La tua consegna è già in coda sul server.' },
  dicaEntregue: { pt: 'Entrega concluída — confira os itens no seu personagem in-game.', en: 'Delivery complete — check the items on your character in-game.', es: 'Entrega completa — revisa los ítems en tu personaje in-game.', it: 'Consegna completata — controlla gli oggetti sul tuo personaggio in-game.' },
  dicaCancelado: { pt: 'Pedido cancelado pela staff. Se pagou por engano, fale com o suporte.', en: 'Order canceled by staff. If you paid by mistake, contact support.', es: 'Pedido cancelado por el staff. Si pagaste por error, habla con el soporte.', it: 'Ordine annullato dallo staff. Se hai pagato per errore, contatta l\u2019assistenza.' },
  pixAuto: { pt: 'Pix automático — Mercado Pago', en: 'Automatic Pix — Mercado Pago', es: 'Pix automático — Mercado Pago', it: 'Pix automatico — Mercado Pago' },
  pixManual: { pt: 'Pix — pagamento manual', en: 'Pix — manual payment', es: 'Pix — pago manual', it: 'Pix — pagamento manuale' },
  pixCopiaDica: { pt: 'Copie o código, pague no app do seu banco e a confirmação é automática.', en: 'Copy the code, pay in your bank app and confirmation is automatic.', es: 'Copia el código, paga en la app de tu banco y la confirmación es automática.', it: 'Copia il codice, paga nell\u2019app della tua banca e la conferma è automatica.' },
  pixFaltaStaff: { pt: 'Pague o valor exato com o Pix informado pela staff no Discord da loja. Depois de confirmado, o status aqui muda para <strong>pago</strong>.', en: 'Pay the exact amount with the Pix provided by staff on the store Discord. Once confirmed, the status here changes to <strong>paid</strong>.', es: 'Paga el monto exacto con el Pix que dé el staff en el Discord de la tienda. Tras confirmar, el estado cambia a <strong>pago</strong>.', it: 'Paga l\u2019importo esatto con il Pix indicato dallo staff sul Discord dello store. Confermato il pagamento, lo stato passa a <strong>pagato</strong>.' },
  copiarCodigoPix: { pt: 'Copiar código Pix', en: 'Copy Pix code', es: 'Copiar código Pix', it: 'Copia codice Pix' },
  copiarChavePix: { pt: 'Copiar chave Pix', en: 'Copy Pix key', es: 'Copiar clave Pix', it: 'Copia chiave Pix' },
  copiarValor: { pt: 'Copiar valor', en: 'Copy amount', es: 'Copiar valor', it: 'Copia importo' },
  pixTipoTelefone: { pt: 'Telefone', en: 'Phone', es: 'Teléfono', it: 'Telefono' },
  pixTipoAleatoria: { pt: 'Chave aleatória', en: 'Random key', es: 'Clave aleatoria', it: 'Chiave casuale' },
  pixTipoChave: { pt: 'Chave Pix', en: 'Pix key', es: 'Clave Pix', it: 'Chiave Pix' },
  cobrancaBrl: { pt: 'A cobrança é sempre em reais (R$) — os valores aqui são os cobrados.', en: 'You are always charged in reais (R$) — these are the charged amounts.', es: 'El cobro siempre es en reales (R$) — estos son los valores cobrados.', it: 'Il pagamento è sempre in real (R$) — questi sono gli importi addebitati.' },

  /* ---- página do produto ---- */
  produtoNaoEncontrado: { pt: 'Produto não encontrado', en: 'Product not found', es: 'Producto no encontrado', it: 'Prodotto non trovato' },
  produtoSumiu: { pt: 'Esse produto não existe mais na loja — a vitrine mudou.', en: 'This product no longer exists in the store — the showcase changed.', es: 'Este producto ya no existe en la tienda — la vitrina cambió.', it: 'Questo prodotto non esiste più nello store — la vetrina è cambiata.' },
  entregaInstantaneaLonga: { pt: 'Entrega instantânea no servidor', en: 'Instant delivery on the server', es: 'Entrega instantánea en el servidor', it: 'Consegna istantanea sul server' },
  quantidade: { pt: 'Quantidade', en: 'Quantity', es: 'Cantidad', it: 'Quantità' },
  menosUma: { pt: 'Menos uma unidade', en: 'One fewer unit', es: 'Una unidad menos', it: 'Una unità in meno' },
  maisUma: { pt: 'Mais uma unidade', en: 'One more unit', es: 'Una unidad más', it: 'Una unità in più' },
  adicionar: { pt: 'Adicionar', en: 'Add to cart', es: 'Agregar', it: 'Aggiungi' },
  adicionado: { pt: 'Adicionado!', en: 'Added!', es: '¡Agregado!', it: 'Aggiunto!' },
  comprarAgora: { pt: 'Comprar agora', en: 'Buy now', es: 'Comprar ahora', it: 'Compra ora' },
  noCarrinho: { pt: 'no carrinho', en: 'in cart', es: 'en el carrito', it: 'nel carrello' },
  pixEntrega: { pt: 'Pagamento via Pix · entrega automática', en: 'Payment via Pix · automatic delivery', es: 'Pago vía Pix · entrega automática', it: 'Pagamento via Pix · consegna automatica' },

  /* ---- página do produto (estilo ProLeague) ---- */
  entregaAutomatica: { pt: 'Entrega automática', en: 'Automatic delivery', es: 'Entrega automática', it: 'Consegna automatica' },
  vendaUma: { pt: '1 venda', en: '1 sale', es: '1 venta', it: '1 vendita' },
  vendasN: { pt: '{n} vendas', en: '{n} sales', es: '{n} ventas', it: '{n} vendite' },
  avistaNoPix: { pt: 'À vista no Pix', en: 'Pay in full via Pix', es: 'Pago único vía Pix', it: 'Pagamento unico via Pix' },
  cupomDicaProduto: { pt: '{p}% OFF acima de {m}', en: '{p}% OFF over {m}', es: '{p}% OFF sobre {m}', it: '{p}% OFF oltre {m}' },
  pagamentoSeguro: { pt: 'Pagamento seguro', en: 'Secure payment', es: 'Pago seguro', it: 'Pagamento sicuro' },
  pixNaHora: { pt: 'Pix aprovado na hora', en: 'Pix approved instantly', es: 'Pix aprobado al instante', it: 'Pix approvato all\u2019istante' },
  infoEntregaT: { pt: 'Entrega imediata', en: 'Instant delivery', es: 'Entrega inmediata', it: 'Consegna immediata' },
  infoEntregaTxt: { pt: 'Receba o seu pacote imediatamente após o pagamento.', en: 'Receive your package immediately after payment.', es: 'Recibe tu paquete inmediatamente después del pago.', it: 'Ricevi il tuo pacchetto subito dopo il pagamento.' },
  infoSegT: { pt: 'Segurança total', en: 'Total security', es: 'Seguridad total', it: 'Sicurezza totale' },
  infoSegTxt: { pt: 'Seus dados ficam protegidos durante todo o processo.', en: 'Your data stays protected throughout the whole process.', es: 'Tus datos quedan protegidos durante todo el proceso.', it: 'I tuoi dati restano protetti durante tutto il processo.' },
  infoPagoT: { pt: 'Formas de pagamento', en: 'Payment methods', es: 'Formas de pago', it: 'Metodi di pagamento' },
  infoPagoTxt: { pt: 'Pix aprovado na hora via Mercado Pago — o item cai no servidor na sequência.', en: 'Pix approved instantly via Mercado Pago — the item hits the server right after.', es: 'Pix aprobado al instante vía Mercado Pago — el ítem llega al servidor enseguida.', it: 'Pix approvato all\u2019istante via Mercado Pago — l\u2019oggetto arriva sul server subito dopo.' },
  relacionados: { pt: 'Você também vai gostar', en: 'You may also like', es: 'También te puede gustar', it: 'Potrebbero piacerti anche' },

  /* ---- conta ---- */
  minhaConta: { pt: 'Minha conta', en: 'My account', es: 'Mi cuenta', it: 'Il mio account' },
  contaIntro: { pt: 'Entre com o Discord para ver o histórico dos seus pedidos e acompanhar a entrega — sem precisar chamar o suporte.', en: 'Sign in with Discord to see your order history and track deliveries — no need to contact support.', es: 'Entra con Discord para ver el historial de tus pedidos y seguir la entrega — sin llamar al soporte.', it: 'Accedi con Discord per vedere lo storico dei tuoi ordini e seguire la consegna — senza chiamare l\u2019assistenza.' },
  sair: { pt: 'Sair', en: 'Sign out', es: 'Salir', it: 'Esci' },
  contaAtualiza: { pt: 'Atualiza sozinho — deixe a aba aberta para acompanhar a entrega.', en: 'Updates itself — keep the tab open to track the delivery.', es: 'Se actualiza solo — deja la pestaña abierta para seguir la entrega.', it: 'Si aggiorna da solo — lascia la scheda aperta per seguire la consegna.' },
  carregandoPedidos: { pt: 'Carregando pedidos…', en: 'Loading orders…', es: 'Cargando pedidos…', it: 'Caricamento ordini…' },
  semPedidosA: { pt: 'Você ainda não fez pedidos.', en: 'You have no orders yet.', es: 'Aún no tienes pedidos.', it: 'Non hai ancora ordini.' },
  sessaoExpirou: { pt: 'Sua sessão expirou — entre de novo com o Discord.', en: 'Your session expired — sign in with Discord again.', es: 'Tu sesión expiró — entra de nuevo con Discord.', it: 'Sessione scaduta — accedi di nuovo con Discord.' },
  naFila: { pt: 'Pago — na fila de entrega do servidor.', en: 'Paid — in the server delivery queue.', es: 'Pagado — en la fila de entrega del servidor.', it: 'Pagato — in coda di consegna sul server.' },
  entregueOk: { pt: 'Entregue — confira no seu personagem in-game.', en: 'Delivered — check on your character in-game.', es: 'Entregado — revisa en tu personaje in-game.', it: 'Consegnato — controlla sul tuo personaggio in-game.' },

  /* ---- 404 ---- */
  p404Titulo: { pt: 'Página não encontrada', en: 'Page not found', es: 'Página no encontrada', it: 'Pagina non trovata' },
  p404Texto: { pt: 'Esse endereço não existe na loja — talvez o link esteja velho ou tenha mudado de lugar.', en: 'This address does not exist in the store — the link may be old or has moved.', es: 'Esta dirección no existe en la tienda — el link puede ser viejo o cambió de lugar.', it: 'Questo indirizzo non esiste nello store — il link è vecchio o si è spostato.' },
  p404Voltar: { pt: 'Voltar à loja', en: 'Back to the store', es: 'Volver a la tienda', it: 'Torna allo store' },
  p404Catalogo: { pt: 'Ver o catálogo', en: 'View the catalog', es: 'Ver el catálogo', it: 'Vedi il catalogo' },

  /* ---- termos ---- */
  termosTitulo: { pt: 'Termos e condições', en: 'Terms & conditions', es: 'Términos y condiciones', it: 'Termini e condizioni' },
  termosNota: { pt: 'Tradução de cortesia — a versão em português prevalece.', en: 'Courtesy translation — the Portuguese version prevails.', es: 'Traducción de cortesía — prevalece la versión en portugués.', it: 'Traduzione di cortesia — prevale la versione in portoghese.' },

  /* ---- rotulagem acessível (sem texto fixo em nenhum idioma) ---- */
  navPrincipal: { pt: 'Navegação principal', en: 'Main navigation', es: 'Navegación principal', it: 'Navigazione principale' },
  lojaVerificada: { pt: 'Loja verificada', en: 'Verified store', es: 'Tienda verificada', it: 'Store verificato' },
  consentimentoAviso: { pt: 'Aviso de cookies e dados', en: 'Cookie and data notice', es: 'Aviso de cookies y datos', it: 'Avviso su cookie e dati' },
  qrDemo: { pt: 'QR Code demonstrativo', en: 'Demo QR code', es: 'Código QR de demostración', it: 'Codice QR dimostrativo' },

  /* ---- conta (login estilo ProLeague + consulta por código) ---- */
  contaLoginTitulo: { pt: 'Fazer login', en: 'Sign in', es: 'Iniciar sesión', it: 'Accedi' },
  contaLoginSub: { pt: 'Entre com sua conta para continuar', en: 'Sign in with your account to continue', es: 'Entra con tu cuenta para continuar', it: 'Accedi con il tuo account per continuare' },
  contaOu: { pt: 'ou', en: 'or', es: 'o', it: 'oppure' },
  consultaTitulo: { pt: 'Consultar pedido pelo código', en: 'Look up an order by code', es: 'Consultar pedido por código', it: 'Consulta un ordine per codice' },
  consultaDica: { pt: 'Sem conta? Informe o código do pedido (PED-…) para ver o status e o valor.', en: 'No account? Enter the order code (PED-…) to see its status and amount.', es: '¿Sin cuenta? Ingresa el código del pedido (PED-…) para ver el estado y el valor.', it: 'Nessun account? Inserisci il codice ordine (PED-…) per vedere stato e importo.' },
  consultar: { pt: 'Consultar', en: 'Look up', es: 'Consultar', it: 'Cerca' },
  consultando: { pt: 'Consultando…', en: 'Looking up…', es: 'Consultando…', it: 'Ricerca…' },
  consultaNaoAchou: { pt: 'Pedido não encontrado — confira o código.', en: 'Order not found — double-check the code.', es: 'Pedido no encontrado — revisa el código.', it: 'Ordine non trovato — controlla il codice.' },
  contaConectada: { pt: 'Conta Discord conectada', en: 'Discord account connected', es: 'Cuenta de Discord conectada', it: 'Account Discord collegato' },
  totalGasto: { pt: 'Total investido', en: 'Total spent', es: 'Total invertido', it: 'Totale speso' },
  numPedidos: { pt: 'Pedidos', en: 'Orders', es: 'Pedidos', it: 'Ordini' },
  entreguesConta: { pt: 'Entregues', en: 'Delivered', es: 'Entregados', it: 'Consegnati' },

  /* ---- conteúdo legal: termos (4 idiomas, <strong>/<em> preservados) ---- */
  termosAtualizada: { pt: 'Última atualização: novembro de 2026.', en: 'Last updated: November 2026.', es: 'Última actualización: noviembre de 2026.', it: 'Ultimo aggiornamento: novembre 2026.' },
  termos1T: { pt: '1. O que é a loja', en: '1. What the store is', es: '1. Qué es la tienda', it: '1. Che cos\u2019è lo store' },
  termos1Txt: { pt: 'A {loja} é uma loja de <strong>produtos digitais para um servidor de FiveM</strong> (vantagens e itens in-game, como VIPs e kits). Ao comprar, você concorda com estes termos sem restrições.', en: '{loja} is a store of <strong>digital products for a FiveM server</strong> (perks and in-game items such as VIPs and kits). By purchasing, you agree to these terms without restrictions.', es: '{loja} es una tienda de <strong>productos digitales para un servidor de FiveM</strong> (ventajas e ítems in-game como VIPs y kits). Al comprar, aceptas estos términos sin restricciones.', it: '{loja} è uno store di <strong>prodotti digitali per un server FiveM</strong> (vantaggi e oggetti in-game come VIP e kit). Acquistando, accetti questi termini senza restrizioni.' },
  termos2T: { pt: '2. Quem pode comprar', en: '2. Who can buy', es: '2. Quién puede comprar', it: '2. Chi può acquistare' },
  termos2L1: { pt: 'Qualquer jogador com um <strong>ID válido no servidor</strong> (letras, números, _ ou -).', en: 'Any player with a <strong>valid server ID</strong> (letters, numbers, _ or -).', es: 'Cualquier jugador con un <strong>ID válido en el servidor</strong> (letras, números, _ o -).', it: 'Qualunque giocatore con un <strong>ID valido sul server</strong> (lettere, numeri, _ o -).' },
  termos2L2: { pt: 'Menores de 18 anos devem comprar com autorização dos responsáveis — a conta do Pix é de quem paga.', en: 'Under-18s must buy with permission from a parent or guardian — the Pix account belongs to whoever pays.', es: 'Menores de 18 años deben comprar con autorización de sus responsables — la cuenta Pix es de quien paga.', it: 'I minori di 18 anni devono acquistare con l\u2019autorizzazione dei responsabili — il conto Pix è di chi paga.' },
  termos3T: { pt: '3. Preço, pagamento e cobrança', en: '3. Price, payment and billing', es: '3. Precio, pago y cobro', it: '3. Prezzo, pagamento e addebito' },
  termos3L1: { pt: 'Os preços são em <strong>reais (R$)</strong> e o pagamento é via Pix. Outras moedas exibidas no site são <strong>só referência</strong> (valor aproximado).', en: 'Prices are in <strong>BRL (R$)</strong> and payment is via Pix. Other currencies shown on the site are <strong>reference only</strong> (approximate value).', es: 'Los precios son en <strong>reales (R$)</strong> y el pago es vía Pix. Las otras monedas del sitio son <strong>solo referencia</strong> (valor aproximado).', it: 'I prezzi sono in <strong>real (R$)</strong> e il pagamento è via Pix. Le altre valute mostrate nel sito sono <strong>solo un riferimento</strong> (valore approssimativo).' },
  termos3L2: { pt: 'O pedido só é processado depois da confirmação do pagamento (Pix automático pelo Mercado Pago ou conferência da staff).', en: 'The order is only processed after payment confirmation (automatic Pix via Mercado Pago or staff verification).', es: 'El pedido solo se procesa tras la confirmación del pago (Pix automático por Mercado Pago o verificación del staff).', it: 'L\u2019ordine viene elaborato solo dopo la conferma del pagamento (Pix automatico via Mercado Pago o verifica dello staff).' },
  termos3L3: { pt: 'Nunca compartilhe comprovantes com terceiros fora dos canais oficiais da loja.', en: 'Never share payment receipts with third parties outside the store\u2019s official channels.', es: 'Nunca compartas comprobantes con terceros fuera de los canales oficiales de la tienda.', it: 'Non condividere mai le ricevute con terzi fuori dai canali ufficiali dello store.' },
  termos4T: { pt: '4. Entrega', en: '4. Delivery', es: '4. Entrega', it: '4. Consegna' },
  termos4L1: { pt: 'A entrega é <strong>automática</strong>: confirmado o pagamento, o item vai para o ID informado no checkout (fila do servidor, geralmente em segundos com o servidor online).', en: 'Delivery is <strong>automatic</strong>: once payment is confirmed, the item goes to the ID entered at checkout (server queue, usually within seconds while the server is online).', es: 'La entrega es <strong>automática</strong>: confirmado el pago, el ítem va al ID informado en el checkout (fila del servidor, generalmente en segundos con el servidor online).', it: 'La consegna è <strong>automatica</strong>: confermato il pagamento, l\u2019oggetto va all\u2019ID indicato al checkout (coda del server, di solito in pochi secondi col server online).' },
  termos4L2: { pt: '<strong>Confira o ID antes de confirmar</strong> — itens entregues para um ID errado informado por você não são de responsabilidade da loja.', en: '<strong>Check the ID before confirming</strong> — items delivered to a wrong ID you entered are not the store\u2019s responsibility.', es: '<strong>Verifica el ID antes de confirmar</strong> — los ítems entregados a un ID errado que informaste no son responsabilidad de la tienda.', it: '<strong>Controlla l\u2019ID prima di confermare</strong> — gli oggetti consegnati a un ID errato da te indicato non sono responsabilità dello store.' },
  termos4L3: { pt: 'Servidor offline? A fila espera e entrega quando ele voltar; nada se perde.', en: 'Server offline? The queue waits and delivers when it\u2019s back; nothing is lost.', es: '¿Servidor offline? La fila espera y entrega cuando vuelva; nada se pierde.', it: 'Server offline? La coda aspetta e consegna quando torna; niente si perde.' },
  termos5T: { pt: '5. Política de reembolso', en: '5. Refund policy', es: '5. Política de reembolso', it: '5. Politica di rimborso' },
  termos5L1: { pt: 'Produtos digitais entregues <strong>não têm reembolso</strong> após a entrega, salvo obrigação legal.', en: 'Delivered digital products have <strong>no refunds</strong> after delivery, except where the law requires.', es: 'Los productos digitales entregados <strong>no tienen reembolso</strong> después de la entrega, salvo obligación legal.', it: 'I prodotti digitali consegnati <strong>non hanno rimborso</strong> dopo la consegna, salvo obbligo di legge.' },
  termos5L2: { pt: 'Se houve cobrança duplicada, falha de entrega ou item diferente do anunciado, fale com a staff no Discord <strong>em até 7 dias</strong> com o código do pedido — resolvemos reentregando ou estornando pelo Pix.', en: 'For double charges, delivery failures or an item different from what was advertised, contact staff on Discord <strong>within 7 days</strong> with the order code — we fix it by redelivering or refunding via Pix.', es: 'Si hubo cobro duplicado, fallo de entrega o ítem distinto del anunciado, habla con el staff en Discord <strong>en un plazo de 7 días</strong> con el código del pedido — lo resolvemos reentregando o reembolsando por Pix.', it: 'Per addebiti duplicati, consegne fallite o un oggetto diverso da quello annunciato, contatta lo staff su Discord <strong>entro 7 giorni</strong> con il codice ordine — risolviamo riconsegnando o rimborsando via Pix.' },
  termos6T: { pt: '6. Regras do servidor', en: '6. Server rules', es: '6. Reglas del servidor', it: '6. Regole del server' },
  termos6L1: { pt: 'Vantagens compradas seguem as <strong>regras do servidor</strong> (roleplay). Uso indevido, exploração de bugs ou compras para burlar regras podem ser revogados <strong>sem reembolso</strong>.', en: 'Purchased perks follow the <strong>server rules</strong> (roleplay). Misuse, bug exploitation or purchases made to bypass rules may be revoked <strong>without refund</strong>.', es: 'Las ventajas compradas siguen las <strong>reglas del servidor</strong> (roleplay). El mal uso, la explotación de bugs o compras para burlar reglas pueden ser revocadas <strong>sin reembolso</strong>.', it: 'I vantaggi acquistati seguono le <strong>regole del server</strong> (roleplay). Uso improprio, sfruttamento di bug o acquisti per aggirare le regole possono essere revocati <strong>senza rimborso</strong>.' },
  termos6L2: { pt: 'Contas banidas por quebra de regras não recebem reembolso de itens já entregues.', en: 'Accounts banned for breaking rules get no refund for items already delivered.', es: 'Las cuentas baneadas por romper reglas no reciben reembolso de ítems ya entregados.', it: 'Gli account bannati per violazione delle regole non ricevono rimborso per gli oggetti già consegnati.' },
  termos7T: { pt: '7. Mudanças e disponibilidade', en: '7. Changes and availability', es: '7. Cambios y disponibilidad', it: '7. Modifiche e disponibilità' },
  termos7L1: { pt: 'Preços, catálogo e promoções podem mudar a qualquer momento; vale o preço na hora do pedido.', en: 'Prices, catalog and promotions can change at any time; what counts is the price at the moment of the order.', es: 'Precios, catálogo y promociones pueden cambiar en cualquier momento; vale el precio al momento del pedido.', it: 'Prezzi, catalogo e promozioni possono cambiare in qualsiasi momento; vale il prezzo al momento dell\u2019ordine.' },
  termos7L2: { pt: 'Estes termos podem ser atualizados — a versão publicada nesta página vale sempre.', en: 'These terms may be updated — the version published on this page always applies.', es: 'Estos términos pueden actualizarse — siempre vale la versión publicada en esta página.', it: 'Questi termini possono essere aggiornati — vale sempre la versione pubblicata in questa pagina.' },
  termos8T: { pt: '8. Suporte e contato', en: '8. Support and contact', es: '8. Soporte y contacto', it: '8. Assistenza e contatti' },
  termos8A: { pt: 'Dúvidas, problemas de pedido ou denúncias:', en: 'Questions, order problems or reports:', es: 'Dudas, problemas de pedido o denuncias:', it: 'Domande, problemi con gli ordini o segnalazioni:' },
  discordDaLoja: { pt: 'Discord da loja', en: 'store Discord', es: 'Discord de la tienda', it: 'Discord dello store' },
  termos8B: { pt: '(também nos botões de suporte do site). Informe sempre o <strong>código do pedido</strong> (PED-…).', en: '(also on the site\u2019s support buttons). Always include the <strong>order code</strong> (PED-…).', es: '(también en los botones de soporte del sitio). Siempre informa el <strong>código del pedido</strong> (PED-…).', it: '(anche nei pulsanti di assistenza del sito). Indica sempre il <strong>codice ordine</strong> (PED-…).' },
  termosVerPriv: { pt: 'Veja também nossa', en: 'See also our', es: 'Ve también nuestra', it: 'Vedi anche la nostra' },

  /* ---- conteúdo legal: privacidade (4 idiomas) ---- */
  privAtualizada: { pt: 'Última atualização: novembro de 2026 — feita conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).', en: 'Last updated: November 2026 — written in accordance with Brazil\u2019s General Data Protection Law (LGPD, Law 13.709/2018).', es: 'Última actualización: noviembre de 2026 — elaborada conforme a la Ley General de Protección de Datos (LGPD, Ley 13.709/2018).', it: 'Ultimo aggiornamento: novembre 2026 — redatta in conformità alla Legge Generale sulla Protezione dei Dati (LGPD, Legge 13.709/2018).' },
  privColetaT: { pt: 'O que a loja coleta', en: 'What the store collects', es: 'Qué recolecta la tienda', it: 'Cosa raccoglie lo store' },
  privColetaL1: { pt: '<strong>Seu ID no servidor</strong> (in-game): é necessário para entregar o produto comprado.', en: '<strong>Your server ID</strong> (in-game): needed to deliver the product you bought.', es: '<strong>Tu ID en el servidor</strong> (in-game): es necesario para entregar el producto comprado.', it: '<strong>Il tuo ID sul server</strong> (in-game): serve per consegnare il prodotto acquistato.' },
  privColetaL2: { pt: '<strong>Sua conta Discord</strong> (ID e nome), <em>apenas se você clicar em "Entrar com Discord"</em>: serve para o suporte te encontrar e avisar sobre o pedido.', en: '<strong>Your Discord account</strong> (ID and name), <em>only if you click "Sign in with Discord"</em>: lets support find you and notify you about the order.', es: '<strong>Tu cuenta de Discord</strong> (ID y nombre), <em>solo si haces clic en "Entrar con Discord"</em>: sirve para que el soporte te encuentre y te avise del pedido.', it: '<strong>Il tuo account Discord</strong> (ID e nome), <em>solo se clicchi su "Accedi con Discord"</em>: permette all\u2019assistenza di trovarti e avvisarti dell\u2019ordine.' },
  privColetaL3: { pt: '<strong>Histórico de pedidos</strong>: itens, valores e status — usado pela staff para conferir pagamentos.', en: '<strong>Order history</strong>: items, amounts and status — used by staff to verify payments.', es: '<strong>Historial de pedidos</strong>: ítems, valores y estado — usado por el staff para verificar pagos.', it: '<strong>Storico ordini</strong>: oggetti, importi e stato — usato dallo staff per verificare i pagamenti.' },
  privNaoT: { pt: 'O que a loja <strong>não</strong> coleta', en: 'What the store does <strong>not</strong> collect', es: 'Qué la tienda <strong>no</strong> recolecta', it: 'Cosa lo store <strong>non</strong> raccoglie' },
  privNaoL1: { pt: 'Não pedimos CPF, endereço, telefone ou qualquer dado sensível.', en: 'We don\u2019t ask for government IDs, address, phone or any sensitive data.', es: 'No pedimos documento de identidad, dirección, teléfono ni ningún dato sensible.', it: 'Non chiediamo documento d\u2019identità, indirizzo, telefono o dati sensibili.' },
  privNaoL2: { pt: 'Não vemos e guardamos dados do seu cartão: o pagamento via Pix fica no banco/Mercado Pago.', en: 'We never see or store your card data: the Pix payment stays with your bank/Mercado Pago.', es: 'No vemos ni guardamos datos de tu tarjeta: el pago vía Pix queda en el banco/Mercado Pago.', it: 'Non vediamo né conserviamo i dati della tua carta: il pagamento via Pix resta alla banca/Mercado Pago.' },
  privNavegadorT: { pt: 'O que fica no seu navegador', en: 'What stays in your browser', es: 'Qué queda en tu navegador', it: 'Cosa resta nel tuo browser' },
  privNavegadorTxt: { pt: 'Para o site funcionar, guardamos no seu próprio navegador (localStorage): tema escolhido, carrinho e a resposta do aviso de cookies. Isso sai do seu computador nunca — limpar os dados do navegador apaga.', en: 'For the site to work, we store in your own browser (localStorage): chosen theme, cart and the cookie notice answer. It never leaves your computer — clearing browser data erases it.', es: 'Para que el sitio funcione, guardamos en tu propio navegador (localStorage): tema elegido, carrito y la respuesta del aviso de cookies. Eso nunca sale de tu computadora — limpiar los datos del navegador lo borra.', it: 'Per far funzionare il sito, salviamo nel tuo browser (localStorage): tema scelto, carrello e risposta all\u2019avviso cookie. Non lascia mai il tuo computer — cancellando i dati del browser lo rimuovi.' },
  privUsoT: { pt: 'Para que usamos os dados', en: 'What we use the data for', es: 'Para qué usamos los datos', it: 'A cosa servono i dati' },
  privUsoL1: { pt: 'Entregar o que você comprou no servidor;', en: 'Deliver what you bought on the server;', es: 'Entregar lo que compraste en el servidor;', it: 'Consegnare ciò che hai acquistato sul server;' },
  privUsoL2: { pt: 'Conferir o pagamento e resolver problemas de pedido;', en: 'Verify payment and resolve order issues;', es: 'Verificar el pago y resolver problemas del pedido;', it: 'Verificare il pagamento e risolvere problemi degli ordini;' },
  privUsoL3: { pt: 'Manter a loja segura (registro interno das ações administrativas).', en: 'Keep the store safe (internal log of admin actions).', es: 'Mantener la tienda segura (registro interno de las acciones administrativas).', it: 'Mantenere sicuro lo store (registro interno delle azioni amministrative).' },
  privPrazoT: { pt: 'Por quanto tempo', en: 'For how long', es: 'Por cuánto tiempo', it: 'Per quanto tempo' },
  privPrazoTxt: { pt: 'Guardamos o histórico de pedidos enquanto a loja estiver ativa, para fins de conferência financeira. A senha do painel e o registro de ações ficam no servidor da loja.', en: 'We keep the order history while the store is active, for financial verification. The panel password and the action log live on the store\u2019s server.', es: 'Guardamos el historial de pedidos mientras la tienda esté activa, para verificación financiera. La contraseña del panel y el registro de acciones quedan en el servidor de la tienda.', it: 'Conserviamo lo storico degli ordini finché lo store è attivo, per finalità di verifica finanziaria. La password del pannello e il registro delle azioni restano sul server dello store.' },
  privDireitosT: { pt: 'Seus direitos', en: 'Your rights', es: 'Tus derechos', it: 'I tuoi diritti' },
  privDireitosTxt: { pt: 'Você pode pedir a qualquer momento: cópia dos seus dados, correção ou <strong>exclusão</strong> (anonimização do histórico). Basta falar com a staff no Discord da loja informando seu ID no servidor — pedimos uma confirmação simples pelo Discord para provar que a conta é sua.', en: 'You can ask at any time: a copy of your data, correction or <strong>deletion</strong> (history anonymization). Just talk to staff on the store Discord with your server ID — we ask for a simple confirmation on Discord to prove the account is yours.', es: 'Puedes pedir en cualquier momento: copia de tus datos, corrección o <strong>eliminación</strong> (anonimización del historial). Solo habla con el staff en el Discord de la tienda informando tu ID en el servidor — pedimos una confirmación simple por Discord para probar que la cuenta es tuya.', it: 'Puoi chiedere in qualsiasi momento: copia dei tuoi dati, correzione o <strong>cancellazione</strong> (anonimizzazione dello storico). Parla con lo staff sul Discord dello store indicando il tuo ID sul server — chiediamo una semplice conferma su Discord per provare che l\u2019account è tuo.' },
  privSegT: { pt: 'Segurança', en: 'Security', es: 'Seguridad', it: 'Sicurezza' },
  privSegTxt: { pt: 'O painel do dono é protegido por senha e as rotas administrativas são bloqueadas sem sessão. A comunicação do servidor do jogo com a loja usa chave compartilhada e as ações são registradas.', en: 'The owner panel is password-protected and admin routes are blocked without a session. Communication between the game server and the store uses a shared key and actions are logged.', es: 'El panel del dueño está protegido por contraseña y las rutas administrativas están bloqueadas sin sesión. La comunicación del servidor del juego con la tienda usa clave compartida y las acciones se registran.', it: 'Il pannello del proprietario è protetto da password e le rotte amministrative sono bloccate senza sessione. La comunicazione tra il server di gioco e lo store usa una chiave condivisa e le azioni vengono registrate.' },
  privContatoA: { pt: 'Dúvidas sobre esta política ou pedidos de exclusão: entre no', en: 'Questions about this policy or deletion requests: join the', es: 'Dudas sobre esta política o pedidos de eliminación: entra al', it: 'Domande su questa informativa o richieste di cancellazione: entra nel' },
  privContatoB: { pt: 'e fale com a staff.', en: 'and talk to staff.', es: 'y habla con el staff.', it: 'e parla con lo staff.' }
};

/* ---------- hook de tradução ---------- */
export function usarIdioma() {
  const idioma = usarPreferencia('gh_idioma', 'pt');
  const t = (chave, valores) => {
    const linha = DICT[chave] || {};
    let texto = linha[idioma] || linha.pt || chave;
    if (valores) for (const [k, v] of Object.entries(valores)) texto = texto.replaceAll('{' + k + '}', v);
    return texto;
  };
  return { idioma, t };
}

export function salvarIdioma(id) {
  salvarPreferencia('gh_idioma', id, 'idioma');
  document.documentElement.lang = id === 'pt' ? 'pt-BR' : id;
}

/* ---------- moedas (referência — cobrança é sempre em BRL) ---------- */
export const MOEDAS = [
  { id: 'brl', nome: 'Real', simbolo: 'R$', bandeira: '🇧🇷', taxa: 1, codigo: 'BRL', locale: 'pt-BR' },
  { id: 'usd', nome: 'Dólar', simbolo: '$', bandeira: '🇺🇸', taxa: 0.185, codigo: 'USD', locale: 'en-US' },
  { id: 'eur', nome: 'Euro', simbolo: '€', bandeira: '🇪🇺', taxa: 0.17, codigo: 'EUR', locale: 'de-DE' },
  { id: 'gbp', nome: 'Libra', simbolo: '£', bandeira: '🇬🇧', taxa: 0.145, codigo: 'GBP', locale: 'en-GB' }
];

export function usarMoeda() {
  return usarPreferencia('gh_moeda', 'brl');
}

export function salvarMoeda(id) {
  salvarPreferencia('gh_moeda', id, 'moeda');
}

/* preço exibido: valor convertido para a moeda de referência */
export function formatarPreco(valorEmReais, moedaId) {
  const m = MOEDAS.find((x) => x.id === moedaId) || MOEDAS[0];
  if (m.id === 'brl') return Number(valorEmReais || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const convertido = Number(valorEmReais || 0) * m.taxa;
  return convertido.toLocaleString(m.locale, { style: 'currency', currency: m.codigo, maximumFractionDigits: 2 });
}

/* ---------- cursores (SVG inline em data URI) ---------- */
function uri(svg) {
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '") ';
}

const MIRA_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="%23000" stroke-opacity=".55" stroke-width="3.4"><circle cx="14" cy="14" r="7"/><path d="M14 1v8M14 19v8M1 14h8M19 14h8"/></g><g fill="none" stroke="%23ffffff" stroke-width="1.6"><circle cx="14" cy="14" r="7"/><path d="M14 1v8M14 19v8M1 14h8M19 14h8"/><circle cx="14" cy="14" r="1.6" fill="%23ffffff"/></g></svg>'.replaceAll('%23', '#');

const PONTO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="5" fill="%23000" fill-opacity=".5"/><circle cx="9" cy="9" r="3.4" fill="%23ffffff"/></svg>'.replaceAll('%23', '#');

const PONTO_G_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="10" fill="%23000" fill-opacity=".45"/><circle cx="15" cy="15" r="7.6" fill="%23ffffff"/></svg>'.replaceAll('%23', '#');

export const CURSORES = [
  { id: 'sistema', chaveNome: 'cursorSistema', css: '' },
  { id: 'mira', chaveNome: 'cursorMira', css: uri(MIRA_SVG) + '14 14, auto' },
  { id: 'ponto', chaveNome: 'cursorPonto', css: uri(PONTO_SVG) + '9 9, auto' },
  { id: 'pontoG', chaveNome: 'cursorPontoG', css: uri(PONTO_G_SVG) + '15 15, auto' }
];

export function usarCursor() {
  return usarPreferencia('gh_cursor', 'sistema');
}

export function salvarCursor(id) {
  salvarPreferencia('gh_cursor', id, 'cursor');
}

/* cursor css de um id (para o preview "passe o mouse para testar") */
export function cssCursor(id) {
  const c = CURSORES.find((x) => x.id === id);
  return c && c.css ? c.css : '';
}
