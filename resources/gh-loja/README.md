# gh-loja — entrega automática dos pedidos do site (Fase 3)

Resource server-side para **QBCore/Qbox**. A cada 15 segundos ele busca a
fila de entregas na API da loja e entrega os produtos comprados direto no
inventário (ou via comando). Cada entrega é confirmada de volta na API.

## Instalação

1. Copie a pasta `gh-loja` para dentro do `resources` do seu servidor:
   ```
   resources/
   └── gh-loja/
       ├── fxmanifest.lua
       ├── config.lua
       └── server.lua
   ```
2. No `server.cfg`, **depois** de iniciar o backend da loja:
   ```cfg
   # URL pública da API da loja (a mesma do site)
   set gh_loja_api "https://loja.ghroleplay.com"

   # MESMA chave configurada como GHRP_SERVER_KEY no backend (.env)
   set gh_loja_chave "SUA-CHAVE-SECRETA-AQUI"

   ensure gh-loja
   ```
3. Reinicie o servidor. No console deve aparecer:
   `[gh-loja] resource da loja carregado — fila a cada 15s · API: ...`

## Como o ID do jogador funciona

No checkout o cliente informa o **ID no servidor**:

- **número** (ex.: `64`) → tratado como *source* do jogador online;
- **texto** (ex.: `ABC12345`) → tratado como *citizenid* (QBCore/Qbox).

Jogador offline? A entrega fica na fila e tenta de novo na próxima rodada —
nada se perde.

## Mapeamento de produtos (`config.lua`)

Cada produto do site precisa existir em `Config.Produtos` com o **nome
exatamente igual** ao do painel (copie e cole — inclusive o travessão `–`).

| tipo       | efeito                                                              |
| ---------- | ------------------------------------------------------------------- |
| `item`     | entrega o `item` no inventário (quantidade vendida × `quantidade`)  |
| `comando`  | roda o comando como console com `{playerId}`, `{quantidade}`, `{discordId}` |

Produto sem mapeamento: é marcado como **falhou** na fila e o console
avisa — a staff entrega na mão e marca o pedido como *entregue* no painel.

Inventário cheio: a entrega fica pendente e tenta de novo automaticamente.

## ox_inventory

Se o servidor usa **ox_inventory** (comum em Qbox), troque a entrega de
item em `server.lua` por:

```lua
local ok = exports.ox_inventory:AddItem(jogador.PlayerData.source, mapeamento.item, quantidade)
```

## Conferindo a fila na mão

```bash
# lista pendentes (mesma chave do resource)
curl -H "X-Server-Key: SUA-CHAVE-SECRETA-AQUI" https://loja.ghroleplay.com/api/deliveries/queue
```
