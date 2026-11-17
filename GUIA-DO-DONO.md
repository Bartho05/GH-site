# GUIA DO DONO — tudo do zero, sem enigma

Guia em português simples pra você operar a loja sozinho. Cada coisa
tem passo a passo numerado. Se travar em algo, procure a seção
**Problemas comuns** no fim.

---

## 1. Como ligar a loja

Você precisa só de um computador com **Node.js** (versão 20 ou maior).

1. Abra o **PowerShell** na pasta do projeto (`C:\Users\Bartho\Documents\SiteGH`).
2. Na primeira vez:
   ```
   npm install
   npm run build
   ```
3. Para ligar:
   ```
   npm start
   ```
4. Vai aparecer no terminal os endereços:
   - **Loja:** http://localhost:8123
   - **Painel:** http://localhost:8123/admin
   - **API:** http://localhost:8123/api/health

Fechar o terminal desliga a loja. Pra deixar ligada o tempo todo em
um servidor de verdade (VPS), dá pra usar o `pm2` (Node) ou rodar
como serviço — me pede que eu te passo o comando exato na hora.

---

## 2. Primeiro acesso ao painel

1. Abra **http://localhost:8123/admin**.
2. A senha inicial é **`admin123`**.
3. ⚠️ Troque a senha logo: aba **Segurança** → "Trocar senha do painel"
   → preenche senha atual (admin123) + a nova → Salvar.
4. Pronto: esse painel edita a loja **ao vivo** — salvou, mudou no site.

### O que tem em cada aba (tour rápido)

| Aba | Pra que serve |
|---|---|
| **Geral** | Nome da loja, logo, anúncio da barra, cupom, chave Pix manual |
| **Banner** | A faixa grande do topo do site |
| **Cor** | Tema (laranja/rosa/halloween/verde) |
| **Números** | Os contadores do hero ("10k jogadores" etc.) |
| **Pódio** | O top 3 do ranking na home |
| **Categorias** | As prateleiras (VIPs, Veículos...) — cada produto vive numa |
| **Produtos** | Cadastrar/editar os produtos da loja |
| **Depoimentos** | Os reviews da home |
| **Links & redes** | Discord, Instagram etc. do rodapé |
| **Integrações** | Status das chaves de API e onde colocá-las |
| **Estatísticas** | Faturamento, mais vendidos, ticket médio |
| **Pedidos** | A lista de compras dos clientes |
| **Entregas** | A fila do que o FiveM precisa entregar |
| **Segurança** | Trocar senha + registro de quem mexeu no quê |

---

## 3. Cadastrando um produto (passo a passo)

1. Painel → aba **Categorias** → se a prateleira não existe ainda,
   botão **Adicionar categoria** → nome (ex.: `VEÍCULOS`). O `id` é
   gerado sozinho, não mexa nele de produtos antigos.
2. Aba **Produtos** → **Adicionar produto** → abre um cartão novo.
3. Preencha:
   - **Categoria** — escolhe a prateleira.
   - **Nome do produto** — esse nome é o que liga com o FiveM, veja a regra na seção 6.
   - **Preço** e **Preço antigo** (só se tiver promoção).
   - **Ícone** — desenhinho da capa (lista em inglês: `car` = carro, `gem` = gema...).
   - **Cores da capa** — dois retangulinhos de cor, abrem o seletor.
   - **Selo** — adesivo opcional no canto ("Promoção", "Novo").
   - **Descrição** — opcional, com Enter pra quebrar linha; aparece
     na página do produto (clicando no card na loja).
4. **Salvar tudo** (botão laranja no topo).
5. Abre a loja e confere. 💡 Na aba Produtos, a capa do cartão é uma
   **prévia ao vivo** — as cores e o ícone mudam enquanto você edita.

Para **remover**: lixeira no topo do cartão do produto → Salvar tudo.

---

## 4. Cupom de desconto

Aba **Geral**: código (ex.: `GH10`), desconto em % e pedido mínimo em R$.
Ele aparece no banner do site e na página do produto automaticamente.

---

## 5. Chaves de API — onde elas vivem

**Resposta curta:** no arquivo **`.env`** na pasta do projeto
(`C:\Users\Bartho\Documents\SiteGH\.env`). Elas **não** são
configuradas dentro do painel — o painel só **mostra o status**.

### Passo a passo

1. Na pasta do projeto existe **`.env.exemplo`** (o modelo). Copie e
   renomeie a cópia para **`.env`**.
2. Abra o `.env` no Bloco de Notas.
3. Cole a linha da integração que quiser (o painel tem botão **copiar**
   em cada cartão, na aba **Integrações**) e preencha com os seus valores.
4. Salve e reinicie a loja (Ctrl+C no terminal, `npm start` de novo).
5. Abra o painel → aba **Integrações** → o cartão ficou **verde** ✅.

### As três chaves

| Chave | Pra que serve | Onde arrumo |
|---|---|---|
| `MP_ACCESS_TOKEN` | Pix entra e vira "pago" sozinho | mercadopago.com → Suas integrações → Credenciais de produção → Access token |
| `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` + `GHRP_ORIGIN` | Login com Discord no checkout | discord.com/developers → New Application → OAuth2 (e coloque o redirect `https://SEUSITE.com/api/auth/discord/callback`) |
| `GHRP_SERVER_KEY` | Entrega automática no FiveM | Você mesma inventa uma senha longa — e repete no server.cfg do jogo |

Sem o token do Mercado Pago a loja funciona do mesmo jeito — só que
você marca o pagamento à mão (aba **Pedidos** → status → `pago`) depois
de conferir o Pix no app.

⚠️ O `.env` **nunca vai pro GitHub** (o `.gitignore` já bloqueia) e
nunca mande ele pra ninguém.

---

## 6. Entrega automática no FiveM

1. Copie a pasta `resources/gh-loja` para a pasta `resources/` do seu
   servidor FiveM (QBCore/Qbox).
2. No `server.cfg`:
   ```cfg
   set gh_loja_api "https://SUA-LOJA-PUBLICA.com"
   set gh_loja_chave "A-MESMA-CHAVE-DO-ENV"
   ensure gh-loja
   ```
3. **Regra de ouro:** o nome do produto no painel tem que ser
   **idêntico** à linha do `resources/gh-loja/config.lua`
   (maiúsculas, espaços e o travessão `–` contam). Ex.:
   `VIP BRONZE – 7 DIAS`. Se não mapear, a entrega marca "falhou" e
   avisa no console do FiveM.
4. Produto **item** chega no inventário; produto **comando** executa
   o comando que você definir (ex.: `addvip {playerId} bronze`).
5. Jogador offline no momento? A entrega **espera na fila** e cai
   quando ele entrar. Nada se perde.

Documentação completa do resource: `resources/gh-loja/README.md`.

---

## 7. Testar uma compra de verdade (checklist)

1. Na loja, adicione um produto → **Finalizar compra**.
2. Preencha o **ID do jogador** (seu ID no FiveM, ex.: `4321`).
3. Com `MP_ACCESS_TOKEN` ligado: aparece o **Pix copia e cola** — pague
   com um valor real pequeno (ex.: R$ 0,50) e em segundos o pedido
   vira `pago` sozinho. Sem token: marque `pago` à mão no painel.
4. Vá em **Pedidos** — o pedido aparece lá.
5. Vá em **Entregas** — dentro de 15s o FiveM puxa e entrega
   (com o resource ligado). O console do jogo imprime
   `[gh-loja] entrega #N ok`.
6. Compra de teste no Pix = crie um produto de R$ 0,50 só pra isso,
   use, e desative depois.

---

## 8. Problemas comuns

| Sintoma | Causa provável | Conserto |
|---|---|---|
| Página branca na loja | build desatualizado | `npm run build` e recarregar (F5) |
| Painel não entra | senha trocada | veja aba Segurança; sem servidor, a senha fica no navegador |
| Fila de entregas dá 503 | `GHRP_SERVER_KEY` não definida na API | criar o `.env` (seção 5) e reiniciar |
| FiveM avisa "chave do servidor inválida" | chave do server.cfg ≠ do .env | deixe as duas idênticas |
| Produto comprado nunca chega no jogo | nome não bate com o config.lua | copie o nome do painel e cole no config.lua (travessão `–` conta) |
| Pedido pago, mas item sumiu da fila | jogador estava com inventário cheio | fica pendente; entrega na próxima rodada com espaço |
| Mudou no painel e o site não mudou | esqueceu de **Salvar tudo** | botão laranja no topo do painel |

Qualquer coisa fora disso: me chama. 🚀
