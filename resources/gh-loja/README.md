# gh-loja — entrega automática no servidor (FiveM)

Resource **QBCore / Qbox** que busca, a cada 15s, os pedidos pagos na loja
do site e entrega os itens/comandos in-game. Nenhum jogador precisa
digitar nada: pagou no site → item chega no servidor.

## Instalação

1. Copie a pasta `gh-loja` para `resources/` do seu servidor:
   ```
   [loja]
   gh-loja
   ```
2. No `server.cfg`, **antes** do `ensure gh-loja`:
   ```cfg
   # URL da API da loja (a mesma do site; em produção use o endereço público)
   set gh_loja_api "https://loja.seuservidor.com"

   # chave compartilhada — tem que ser IGUAL à GHRP_SERVER_KEY da API
   set gh_loja_chave "SUA-CHAVE-SECRETA"
   ```
3. `ensure gh-loja` e reinicie o servidor.

No console do FiveM deve aparecer:

```
[gh-loja] resource da loja carregado — fila a cada 15s · API: https://...
```

## Como funciona

1. Cliente compra no site → pedido fica `pendente`.
2. Pagamento confirmado (Pix via Mercado Pago ou `pago` no painel) →
   o backend cria uma **entrega pendente** para cada item do pedido.
3. Este resource busca `GET /api/deliveries/queue` (header
   `X-Server-Key`) e entrega:
   - **Jogador online** → entrega na hora e marca `entregue` na API.
   - **Jogador offline** → a entrega **continua na fila** e sai na
     próxima rodada (15s) quando ele entrar. Nada se perde.
4. Entregas com problema são marcadas `falhou` e avisam no console
   (a staff entrega na mão pelo painel).

O jogador é resolvido por **ID numérico** (source do servidor, ex.: `22`)
ou **citizenid** — o que o cliente preencher no checkout.

## Mapeamento dos produtos (`config.lua`)

O nome do produto no painel precisa ser **idêntico** à chave do mapa
(copie e cole — maiúsculas, espaços e o travessão `–` contam).

```lua
Config.Produtos = {
    ['VIP BRONZE – 7 DIAS'] = { tipo = 'comando', comando = 'addvip {playerId} bronze' },
    ['GLOCK RUBI']          = { tipo = 'item',    item = 'weapon_pistol' },
}
```

| campo | o que faz |
|---|---|
| `tipo = 'item'` | `AddItem` no inventário do jogador. `quantidade` (opcional) multiplica a quantidade vendida |
| `tipo = 'comando'` | executa o comando como console |

Marcadores disponíveis no `comando`:

| marcador | vira |
|---|---|
| `{playerId}` | ID do jogador informado no checkout |
| `{quantidade}` | quantidade vendida |
| `{discordId}` | ID do Discord (quando o cliente logou com Discord) |

**Sem mapeamento** → a entrega é marcada `falhou` e o console avisa com
o nome exato do produto. Cadastre o produto no painel **depois** de
adicionar a linha no `config.lua` (ou vice-versa — só mantenha iguais).

> **ox_inventory**: o `AddItem` padrão é do QBCore. Se você usa
> ox_inventory, troque em `server.lua` a chamada de entrega de item por
> `exports.ox_inventory:AddItem(source, item, count)` (o resto não muda).

## Chaves que conversam

```
Backend (API)                    FiveM (server.cfg)
GHRP_SERVER_KEY=xxxx       <->   set gh_loja_chave "xxxx"
```

Chave errada/vazia → fila responde **401** e o resource avisa no
console sem spam (avisa uma vez só). Sem `GHRP_SERVER_KEY` na API →
a fila responde **503**.

## Teste rápido (sem entrar no jogo)

Com a loja e o resource no ar:

1. Compre um produto no site com o seu ID in-game.
2. Marque o pedido como `pago` no painel (`/admin`).
3. Em até 15s o item/comando executa no servidor e o console mostra
   `entrega #N ok`.

## Endpoints que o resource usa

| rota | uso |
|---|---|
| `GET /api/deliveries/queue` | busca as pendências (até 50, mais antiga primeiro) |
| `POST /api/deliveries/:id/marcar` | confirma `entregue` ou `falhou` |
