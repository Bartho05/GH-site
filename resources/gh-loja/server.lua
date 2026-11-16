--[[ =========================================================
    gh-loja — server.lua (Fase 3)

    Loop: busca a fila de entregas pendentes na API da loja
    (GET /api/deliveries/queue com X-Server-Key) e entrega
    item a item no servidor. Cada entrega marcada confirma
    de volta (POST /api/deliveries/:id/marcar).

    Jogador offline → a entrega continua na fila para a
    próxima rodada. Sem mapeamento no config → marca "falhou"
    e avisa no console (a staff entrega na mão).
   ========================================================= ]]

local QBCore = nil

CreateThread(function()
    if Config.Framework == 'qbx' then
        QBCore = exports['qbx_core']:GetCoreObject()
    else
        QBCore = exports['qb-core']:GetCoreObject()
    end
end)

local buscando = false
local avisouChave = false

--- confere de volta pra API: entregue ou falhou
local function marcarEntrega(id, status)
    PerformHttpRequest(Config.ApiUrl .. '/api/deliveries/' .. id .. '/marcar', function(statusHttp)
        if statusHttp ~= 200 then
            print('^1[gh-loja] não consegui marcar a entrega #' .. id .. ' como "' .. status .. '" (HTTP ' .. statusHttp .. ')^0')
        end
    end, 'POST', json.encode({ status = status }), {
        ['X-Server-Key'] = Config.Chave,
        ['Content-Type'] = 'application/json'
    })
end

--- resolve o jogador: número = source do servidor; senão = citizenid
local function jogadorDe(playerId)
    if not playerId or playerId == '' then return nil end
    local fonte = tonumber(playerId)
    if fonte then
        return QBCore.Functions.GetPlayer(fonte)
    end
    return QBCore.Functions.GetPlayerByCitizenId(playerId)
end

--- só deixa passar texto seguro pra dentro de comandos
local function seguro(v)
    if v == nil then return '' end
    return tostring(v):gsub('[^%w%-_]', '')
end

--- entrega uma pendência da fila
local function entregar(entrega)
    if type(entrega) ~= 'table' or type(entrega.id) ~= 'number' then return end

    local mapeamento = Config.Produtos[entrega.nome]
    if not mapeamento then
        print('^3[gh-loja] produto sem mapeamento no config.lua: "' .. tostring(entrega.nome) .. '" (entrega #' .. entrega.id .. ') — marque como entregue na mão^0')
        marcarEntrega(entrega.id, 'falhou')
        return
    end

    local jogador = jogadorDe(entrega.playerId)
    if not jogador then
        return -- offline: fica na fila pra próxima rodada
    end

    if mapeamento.tipo == 'item' then
        local quantidade = (tonumber(entrega.quantidade) or 1) * (tonumber(mapeamento.quantidade) or 1)
        local ok = jogador.Functions.AddItem(mapeamento.item, quantidade)
        if not ok then
            print('^3[gh-loja] inventário cheio — entrega #' .. entrega.id .. ' (' .. tostring(entrega.nome) .. ') tenta de novo na próxima rodada^0')
            return
        end
        TriggerClientEvent('QBCore:Notify', jogador.PlayerData.source,
            'Loja: você recebeu ' .. quantidade .. 'x ' .. tostring(entrega.nome), 'success')
        print('^2[gh-loja] entrega #' .. entrega.id .. ' ok: ' .. quantidade .. 'x ' .. tostring(entrega.nome) .. ' → ' .. tostring(entrega.playerId) .. '^0')
        marcarEntrega(entrega.id, 'entregue')

    elseif mapeamento.tipo == 'comando' then
        local comando = mapeamento.comando
        comando = comando:gsub('{playerId}', seguro(entrega.playerId))
        comando = comando:gsub('{quantidade}', tostring(tonumber(entrega.quantidade) or 1))
        comando = comando:gsub('{discordId}', seguro(entrega.discordId))
        ExecuteCommand(comando)
        print('^2[gh-loja] entrega #' .. entrega.id .. ' ok (comando): ' .. comando .. '^0')
        marcarEntrega(entrega.id, 'entregue')

    else
        print('^1[gh-loja] tipo de entrega desconhecido no config.lua: "' .. tostring(mapeamento.tipo) .. '"^0')
        marcarEntrega(entrega.id, 'falhou')
    end
end

--- busca a fila e processa
local function buscarFila()
    if Config.Chave == '' then
        if not avisouChave then
            print('^1[gh-loja] configure a chave! No server.cfg: set gh_loja_chave "SUA-CHAVE-SECRETA" (a mesma GHRP_SERVER_KEY da API)^0')
            avisouChave = true
        end
        return
    end
    if buscando or not QBCore then return end
    buscando = true

    PerformHttpRequest(Config.ApiUrl .. '/api/deliveries/queue', function(statusHttp, corpo)
        buscando = false
        if statusHttp ~= 200 then
            print('^1[gh-loja] fila de entregas falhou (HTTP ' .. statusHttp .. ') — confere gh_loja_api e gh_loja_chave^0')
            return
        end
        local ok, dados = pcall(json.decode, corpo)
        if not ok or type(dados) ~= 'table' or type(dados.entregas) ~= 'table' then
            print('^1[gh-loja] resposta inesperada da fila de entregas^0')
            return
        end
        for _, entrega in ipairs(dados.entregas) do
            local okChamada, erro = pcall(entregar, entrega)
            if not okChamada then
                print('^1[gh-loja] erro entregando #' .. tostring(entrega.id) .. ': ' .. tostring(erro) .. '^0')
            end
        end
    end, 'GET', '', { ['X-Server-Key'] = Config.Chave })
end

CreateThread(function()
    while true do
        buscarFila()
        Wait(Config.Intervalo)
    end
end)

print('[gh-loja] resource da loja carregado — fila a cada ' .. math.floor(Config.Intervalo / 1000) .. 's · API: ' .. Config.ApiUrl)
