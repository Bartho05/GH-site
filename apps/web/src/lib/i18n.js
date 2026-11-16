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
  entrarDiscord: { pt: 'Entrar com o Discord', en: 'Sign in with Discord', es: 'Entrar con Discord', it: 'Accedi con Discord' },
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
  termosNota: { pt: 'O texto legal vale na versão em português.', en: 'The Portuguese version of this legal text applies.', es: 'La versión en portugués de este texto legal es la válida.', it: 'Fa fede la versione in portoghese di questo testo legale.' }
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
