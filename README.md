# GH Roleplay — loja FiveM (monorepo)

Loja dark para servidores FiveM + painel do dono + backend Node puro.

> Código e conteúdo são próprios — nada foi copiado de outro site.

## Estrutura

| Pasta     | O que é |
|-----------|---------|
| `apps/web` | Frontend (HTML/CSS/JS puro). `index.html` = loja · `admin.html` = painel do dono |
| `apps/api` | Backend Node (só `node:http`, zero dependências). Serve o site e expõe a API JSON |

## Rodar

```bash
npm install       # uma vez (liga os workspaces)
npm start         # loja:    http://localhost:8123
                  # painel:  http://localhost:8123/admin.html
                  # api:     http://localhost:8123/api/health
npm run dev       # igual, com auto-recarga do servidor
npm test          # 23 testes (unitários + integração)
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
| `POST /api/orders` | `{itens:[{nome,quantidade}], cupom?}` → pedido validado no servidor (preço vem do servidor, cupom só acima do mínimo) |
| `GET  /api/orders` | **admin** lista os pedidos recebidos |

## Admin

Senha inicial: **admin123** — troque na aba *Segurança* do painel. Com servidor no ar, o login/salvamento/reset/troca de senha falam com a API; sem servidor, o painel avisa e opera modo local (localStorage).

## Modo offline

Abrindo `index.html` direto (file://), a loja funciona igual: usa o `config-base.js` + localStorage. Quando detecta o servidor (porta 8123), a config do servidor tem prioridade e o "Finalizar compra" cria pedidos reais.

## Segurança

- senha com scrypt + salt, comparação em tempo constante; sessões em memória (12h)
- limite de 6 tentativas de login por minuto (por IP)
- normalização no servidor: clamp de números preços, limite de tamanho, remoção de tags HTML (anti-XSS), ids de categoria únicos
- estático com bloqueio de path traversal
- CORS liberado para dev; restrinja `Access-Control-Allow-Origin` ao publicar

## Dados

`apps/api/data/store.json` guarda config, pedidos e o hash de senha. É criado semeadando do `apps/web/config-base.js` (fonte única dos valores iniciais). Apague o arquivo para resetar tudo, ou use "Resetar" no painel.
