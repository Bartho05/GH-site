# GH Roleplay — loja FiveM (monorepo)

Loja dark para servidores FiveM + painel do dono + backend Node puro.

> Código e conteúdo são próprios — nada foi copiado de outro site.

## Estrutura

| Pasta     | O que é |
|-----------|---------|
| `apps/web` | Frontend **React + Vite** (`src/loja` = site · `src/admin` = painel; build em `dist/`) |
| `apps/api` | Backend Node (só módulos nativos `node:http` + `node:sqlite`, zero dependência npm) |

## Rodar

```bash
npm install       # uma vez (liga os workspaces)
npm start         # builda o frontend (se preciso) e sobe tudo:
                  # loja:    http://localhost:8123
                  # painel:  http://localhost:8123/admin.html
                  # api:     http://localhost:8123/api/health
npm run dev       # desenvolvimento: Vite com hot-reload (5173) + API (8123, proxy /api)
npm test          # 30 testes (unitários + integração + banco)
```

Porta e pasta de dados são configuráveis: `PORT=3000 GHRP_DATA=C:\dados npm start`.

## API

| Rota | O que faz |
|------|-----------|
| `GET  /api/health` | status do serviço |
| `GET  /api/config` | config atual da loja (o site puxa daqui ao abrir) |
| `PUT  /api/config` | **admin** salva a config (normalizada com clamp no servidor) |
| `DELETE /api/config` | **admin** volta a config ao padrão de fábrica |
| `POST /api/auth/login` | `{senha}` → token Bearer válido por 12h |
| `POST /api/auth/logout` | encerra o token |
| `POST /api/auth/trocar-senha` | **admin** troca a senha (guarda scrypt+salt) |
| `GET  /api/products?categoria=id` · `/api/categories` | catálogo |
| `POST /api/orders` | `{itens:[{nome,quantidade}], cupom?, playerId?, discordId?}` → pedido validado no servidor (preço vem do servidor, cupom só acima do mínimo) |
| `GET  /api/orders` | **admin** lista os pedidos — filtro `?status=` + resumo (contagens e total arrecadado) |
| `PATCH /api/orders/:id` | **admin** muda o status: `pendente`, `pago`, `entregue`, `cancelado` |

## Admin

Senha inicial: **admin123** — troque na aba *Segurança* do painel. Com servidor no ar, o login/salvamento/reset/troca de senha falam com a API; sem servidor, o painel avisa e opera modo local (localStorage).

## Modo offline

Com o frontend em React/Vite, o site roda sempre via servidor (`npm start` — módulos ES não abrem por `file://`). Sem a API no ar, a loja continua navegável com a config do `localStorage`/padrão de fábrica; só o checkout e o painel exigem o backend. A config do servidor tem prioridade sobre a local quando os dois existem.

## Segurança

- senha com scrypt + salt, comparação em tempo constante; sessões em memória (12h)
- limite de 6 tentativas de login por minuto (por IP)
- normalização no servidor: clamp de números preços, limite de tamanho, remoção de tags HTML (anti-XSS), ids de categoria únicos
- estático com bloqueio de path traversal
- CORS liberado para dev; restrinja `Access-Control-Allow-Origin` ao publicar

## Dados

`apps/api/data/loja.db` — banco **SQLite** nativo do Node (zero dependência, arquivo único na VPS). Guarda config, senha do admin, pedidos e a fila de entregas para o servidor FiveM. Na primeira execução importa automaticamente o `store.json` antigo, se existir; sem ele, semeia a config de `apps/web/src/config-base.mjs`. Backup = copiar o arquivo. Para resetar, apague `loja.db` (e o `store.json`, se quiser zerar o legado).

## Próximas fases

1. **Checkout completo:** login com Discord (OAuth) + ID do jogador + pagamento via Mercado Pago/Pix (webhook confirma e o pedido vira `pago` sozinho). Precisa de: app no Discord e conta no Mercado Pago (chaves ficam em variáveis de ambiente, nunca no código).
2. **Entrega automática:** resource Lua (QBCore/Qbox) consulta a fila de entregas no backend e entrega o item/VIP ao player, marcando como entregue.
3. **LGPD + segurança:** banner de consentimento, política de privacidade, anonimização de dados, CORS travado para o domínio, auditoria das ações do admin.
