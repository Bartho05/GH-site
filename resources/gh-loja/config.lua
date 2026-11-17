--[[ =========================================================
    gh-loja — configuração (Fase 3)

    Este resource busca a fila de entregas na API da loja e
    entrega os itens no servidor. Tudo que você precisa ajustar
    está aqui.
   ========================================================= ]]

Config = {}

-- URL da API da loja (a mesma do site). Em produção use o
-- endereço público (ex.: https://loja.ghroleplay.com).
-- Pode vir do server.cfg:  set gh_loja_api "http://127.0.0.1:8123"
Config.ApiUrl = GetConvar('gh_loja_api', 'http://127.0.0.1:8123')

-- Chave compartilhada com o backend (env GHRP_SERVER_KEY na API).
-- Pode vir do server.cfg:  set gh_loja_chave "SUA-CHAVE-SECRETA"
Config.Chave = GetConvar('gh_loja_chave', '')

-- Intervalo entre consultas à fila (em ms). 15s fica bom.
Config.Intervalo = 15000

-- Framework do servidor: 'qb' (QBCore) ou 'qbx' (Qbox).
-- Se você usa ox_inventory, veja a nota no README.md.
Config.Framework = 'qb'

--[[ Mapa de entrega: NOME EXATO do produto no site → como entregar.

     tipo = 'item'
       entrega `item` no inventário (quantidade = quantidade vendida × `quantidade`)

     tipo = 'comando'
       executa o comando como console, trocando os marcadores:
         {playerId}    → ID do jogador informado no checkout
         {quantidade}  → quantidade vendida
         {discordId}   → ID do Discord (quando o cliente logou)

     ATENÇÃO: o nome precisa ser idêntico ao do painel (copie e cole,
     inclusive letras maiúsculas e o travessão "–"). Produto sem
     mapeamento é marcado como "falhou" e avisa no console. ]]
Config.Produtos = {
    ['VIP BOOSTER – 1 DIA']    = { tipo = 'comando', comando = 'addvip {playerId} booster' },
    ['COMBO BEM-VINDO']        = { tipo = 'item',    item = 'combo_bemvindo' },
    ['VIP BRONZE – 7 DIAS']    = { tipo = 'comando', comando = 'addvip {playerId} bronze' },
    ['VIP OURO – 30 DIAS']     = { tipo = 'comando', comando = 'addvip {playerId} ouro' },
    ['VIP DIAMANTE – 30 DIAS'] = { tipo = 'comando', comando = 'addvip {playerId} diamante' },
    ['SW4 BLINDADA']           = { tipo = 'item',    item = 'sw4_blindada' },
    ['MANSÃO NO MORRO']        = { tipo = 'comando', comando = 'givehouse {playerId}' },
    ['GLOCK RUBI']             = { tipo = 'item',    item = 'weapon_pistol' },
    ['KIT ARMAS COMPLETO']     = { tipo = 'item',    item = 'kit_armas' },
    ['CAIXA LENDÁRIA']         = { tipo = 'item',    item = 'caixa_lendaria' },
    ['COMBO INICIANTE']        = { tipo = 'item',    item = 'combo_iniciante' },
    ['DANÇA EXCLUSIVA']        = { tipo = 'comando', comando = 'adddanca {playerId}' },
    ['SKIN PERSONALIZADA']     = { tipo = 'comando', comando = 'addskin {playerId}' },
    ['RESETAR PERSONAGEM']     = { tipo = 'comando', comando = 'resetchar {playerId}' },

    -- BARCO é veículo: AJUSTE o comando abaixo ao do seu servidor
    -- (aqui vai um spawn genérico de barco como exemplo).
    ['BARCO']                  = { tipo = 'comando', comando = 'givevehicle {playerId} boat' }
}
