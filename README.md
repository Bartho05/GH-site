# GH Roleplay — loja FiveM (monorepo)

Loja dark para servidores FiveM + painel do dono + backend Node puro +
resource de entrega automática in-game.

> Código e conteúdo são próprios — nada foi copiado de outro site.

**👉 Guia do dono, do zero, em português simples: [`GUIA-DO-DONO.md`](GUIA-DO-DONO.md)** — como ligar a loja, editar produtos pelo painel, onde colar cada chave de API (arquivo `.env`) e como testar uma compra de verdade.

## Estrutura

| Pasta     | O que é |
|-----------|---------|
| `apps/web` | Frontend **React + Vite** (`src/loja` = site + checkout · `src/admin` = painel; build em `dist/`) |
| `apps/api` | Backend Node (só módulos nativos `node:http` + `node:sqlite`, zero dependência npm) |
| `resources/gh-loja` | Resource Lua **QBCore/Qbox** que entrega os pedidos in-game |

## Rodar

```bash
npm install       # uma vez (liga os workspaces)
npm start         # builda o frontend (se preciso) e sobe tudo:
                  # loja:    http://localhost:8123
                  # checkout: http://localhost:8123/checkout
                  # conta:   http://localhost:8123/conta (login Discord)
                  # produto: http://localhost:8123/produto/:slug
                  # termos:  http://localhost:8123/terms
                  # painel:  http://localhost:8123/admin  (rota da SPA)
                  # api:     http://localhost:8123/api/health
npm run dev       # desenvolvimento: Vite com hot-reload (5173) + API (8123, proxy /api)
npm test          # 46 testes (unitários + integração + banco)
```

Porta e pasta de dados são configuráveis: `PORT=3000 GHRP_DATA=C:\dados npm start`.

## Variáveis de ambiente (chaves nunca vão no código)

| Variável | Para que serve | Sem ela... |
|----------|----------------|------------|
| `MP_ACCESS_TOKEN` | Mercado Pago: gera **Pix automático** (copia e cola) e valida o webhook | checkout usa **Pix manual** (chave do painel confirmada pela staff) |
| `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` | login do cliente via Discord (OAuth) no checkout | checkout só pede o ID do jogador |
| `GHRP_SERVER_KEY` | chave compartilhada com o resource FiveM (fila de entregas) | rota da fila responde 503 |
| `GHRP_ORIGIN` | origem pública da loja (ex.: `https://loja.ghroleplay.com`) — usada no redirect do OAuth e para **travar o CORS** | CORS aberto (dev) e OAuth desligado |

## API

| Rota | O que faz |
|------|-----------|
| `GET  /api/health` | status do serviço |
| `GET  /api/config` | config atual + `recursos` (booleans de Pix automático / login Discord) |
| `PUT  /api/config` | **admin** salva a config (normalizada com clamp no servidor) |
| `DELETE /api/config` | **admin** volta a config ao padrão de fábrica |
| `POST /api/auth/login` | `{senha}` → token Bearer válido por 12h |
| `POST /api/auth/logout` | encerra o token |
| `POST /api/auth/trocar-senha` | **admin** troca a senha (guarda scrypt+salt) |
| `GET  /api/auth/discord` | manda o cliente pro Discord (OAuth `identify`); `?volta=conta` devolve à página Minha conta; sem chaves → 503 |
| `GET  /api/auth/discord/callback` | o Discord volta com o `code`; sessão temporária de 30 min |
| `GET  /api/products?categoria=id` · `/api/categories` | catálogo |
| `POST /api/checkout` | **público** cria o pedido do cliente: `{itens, playerId, cupom?}` + header `X-Discord-Token` opcional → devolve pedido + Pix (copia e cola) ou a chave manual. Rate limit por IP |
| `GET  /api/checkout/:codigo` | **público** acompanha o pedido (só `id`, `status`, `total`) — usado pelo polling da página |
| `GET  /api/vendas?nome=` | **público** unidades vendidas de um produto (pedidos pagos/entregues) — contador da página do produto |
| `POST /api/orders` | fluxo antigo de criação de pedido (validado, com rate limit) |
| `GET  /api/orders` | **admin** lista os pedidos — filtro `?status=` + resumo |
| `PATCH /api/orders/:id` | **admin** muda o status. Ir para `pago` grava `pago_em` e **alimenta a fila de entregas** |
| `GET  /api/deliveries/queue` | **servidor FiveM** (header `X-Server-Key`) busca as entregas pendentes (mais antiga primeiro) |
| `POST /api/deliveries/:id/marcar` | **servidor FiveM** marca a entrega `entregue`/`falhou` |
| `GET  /api/stats` | **admin** estatísticas: faturamento por dia (30d), mais vendidos, ticket médio, clientes únicos |
| `GET  /api/entregas` | **admin** fila completa de entregas — filtro `?status=` (`pendente`/`entregue`/`falhou`/`todos`) |
| `POST /api/entregas/:id/marcar` | **admin** marca a entrega na mão pelo painel (servidor do jogo offline) |
| `GET  /api/minha/conta` | **cliente** histórico dos próprios pedidos (header `X-Discord-Token`) |
| `POST /api/webhooks/mercadopago` | o MP avisa o pagamento — o backend **re-busca o payment na API do MP** (nunca confia no corpo) e confirma o pedido via `external_reference` |
| `GET  /api/auditoria` | **admin** últimas ações: logins, config, status, pagamentos, entregas |

## Checkout (como fica pro cliente)

1. Cliente monta o carrinho → **Finalizar compra** → `/checkout`.
2. Informa o **ID no servidor** (obrigatório) e, se ativo, entra com o **Discord** (botão OAuth).
3. **Pix automático** (com `MP_ACCESS_TOKEN`): a página mostra o QR/copia e cola e o status muda sozinho (polling de 4s). **Pix manual**: mostra a chave configurada no painel; a staff confirma no painel → o pedido vira `pago` → a entrega já cai na fila do servidor.
4. Política de privacidade em `/privacidade` + banner de consentimento (LGPD).

## Admin

Painel em **`/admin`** (rota da SPA — o endereço antigo `/admin.html` redireciona pra lá). Senha inicial: **admin123** — troque na aba *Segurança* do painel. Abas: config completa da loja, **Estatísticas** (faturamento 30 dias, mais vendidos, ticket médio, exportação de pedidos em CSV na aba *Pedidos*), **Pedidos**, **Entregas** (fila + marcar na mão) e **registro de auditoria** (em *Segurança*).

## Conta do cliente e página de produto

- **`/conta`** — o cliente entra com o Discord e vê o histórico dos próprios pedidos (status ao vivo por polling de 10s). `/login` redireciona para cá.
- **`/produto/:slug`** — página do produto com foto real, descrição e quantidade (o card da vitrine liga pra ela).
- **`/terms`** — Termos e condições; **`/privacidade`** — LGPD; **`/404`** — página dedicada para endereço inexistente.
- Foto e descrição são cadastrados pelo painel, aba *Produtos* — opcionais; sem foto, o card usa o ícone/gradiente.

## Ajustes do visitante (estilo ProLeague)

No ícone de engrenagem do cabeçalho, o visitante escolhe (guardado no navegador):

- **Reduzir animações** — desliga a digitação do título e as entradas suaves;
- **Cor da loja** — DEFAULT / GTA VI / HALLOWEEN / NATAL (os temas sazonais ficam com cadeado fora de época: Halloween só em outubro, Natal só em dez/jan);
- **Idioma** — Português, English, Español, Italiano (interface; produtos seguem o que o dono cadastrou);
- **Moeda** — Real / Dólar / Euro / Libra com valor aproximado — a cobrança é sempre em reais;
- **Cursor** — padrão do sistema, mira (crosshair) ou ponto, com pré-visualização ao passar o mouse.

## Extras de paridade com o ProLeague

- **Ofertas sazonais** — cards de evento no topo ("Halloween até 31/10", "Natal até 25/12") aparecem sozinhos na estação certa e ligam pro catálogo;
- **Cupom de 1 clique** — botão "Aplicar GHBEMVINDO" no carrinho leva ao checkout, onde o cupom já vem preenchido;
- **Etapas do checkout** — 1 Pagamento → 2 Confirmação → 3 Entrega, com o passo atual marcado;
- **TikTok ao vivo** — na aba *Geral* do painel, preencha o link da live e o hero mostra o selo "Ao vivo agora no TikTok";
- **Vídeo tutorial do brinde** — a aba BRINDE usa o primeiro link do Youtube cadastrado em *Links & redes*;
- **Descrição das categorias** — campo novo em *Categorias* do painel; aparece embaixo do título de cada seção;
- **Redes completas** — Instagram, X, Discord, Youtube, TikTok e WhatsApp (ícones de marca próprios) + e-mail de contato no painel de suporte.

## Entrega automática (FiveM)

Instale o resource `resources/gh-loja` no servidor (passo a passo em
`resources/gh-loja/README.md`). Resumo:

```cfg
# server.cfg
set gh_loja_api "https://loja.ghroleplay.com"      # URL da API
set gh_loja_chave "SUA-CHAVE-SECRETA"              # = GHRP_SERVER_KEY do backend
ensure gh-loja
```

O resource (QBCore/Qbox) consulta a fila a cada 15s, entrega por
**source** (ID numérico) ou **citizenid**, e marca de volta na API.
O nome do produto precisa ser idêntico ao do painel — o mapa fica em
`resources/gh-loja/config.lua`.

## Segurança

- senha com scrypt + salt, comparação em tempo constante; sessões em memória (12h)
- limite de 6 tentativas de login por minuto + **rate limit no checkout** (8 pedidos/10min por IP)
- normalização no servidor: clamp de números/preços, limite de tamanho, remoção de tags HTML (anti-XSS), ids de categoria únicos
- estático com bloqueio de path traversal
- headers de segurança: `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`
- OAuth Discord com **state anti-CSRF** de uso único; sessão do checkout expira em 30 min
- webhook do MP só confere pelo pagamento re-buscado na API do MP
- fila do FiveM autenticada por chave (comparação em tempo constante via sha256)
- **CORS**: aberto em dev; com `GHRP_ORIGIN` definido, origens diferentes são recusadas
- auditoria das ações admin/servidor (guarda as últimas 2000)

## Dados

`apps/api/data/loja.db` — banco **SQLite** nativo do Node (zero dependência, arquivo único na VPS). Guarda config, senha do admin, pedidos (com `player_id`, `discord_id`, `discord_tag`, `mp_id`, `pago_em`), a fila de entregas e a auditoria. Migrações de colunas novas rodam sozinhas na inicialização; na primeira execução importa o `store.json` antigo, se existir. Backup = copiar o arquivo. Para resetar, apague `loja.db`.

## Roadmap restante

- Conta Mercado Pago + app no Discord reais: só criar e colocar as chaves nas env vars — todo o código já está pronto e testado.
- Anonimização por pedido de exclusão (LGPD): staff pode cancelar/apagar pedidos no banco; política em `/privacidade`.
