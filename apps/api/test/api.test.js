/* =========================================================
   Testes de integração da API
   Sobe um servidor real em porta efêmera, com pasta de dados
   temporária (env GHRP_DATA) — não toca no store.json de verdade.

   A ordem importa: o teste de limite de tentativas fica no fim,
   porque o limite é por IP/processo.
   ========================================================= */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghrp-test-'));
process.env.GHRP_DATA = pastaTemp;
process.env.GHRP_SERVER_KEY = 'chave-servidor-teste'; // liga a rota da Fase 3 nos testes

const { criarServidor } = require('../src/server.js');
const api = require('../src/api');

let servidor = null;
let base = '';
let token = '';
let codigoCheckout = '';

function pede(rota, { metodo = 'GET', corpo, token: tkn, headers: extras = {} } = {}) {
  const cab = { ...extras };
  if (tkn) cab.Authorization = 'Bearer ' + tkn;
  let corpoReal;
  if (corpo !== undefined) {
    cab['Content-Type'] = 'application/json';
    corpoReal = JSON.stringify(corpo);
  }
  return fetch(base + rota, { method: metodo, headers: cab, body: corpoReal }).then(async (r) => {
    const tipo = r.headers.get('content-type') || '';
    return { status: r.status, dados: tipo.includes('json') ? await r.json() : await r.text() };
  });
}

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver));
  base = 'http://127.0.0.1:' + servidor.address().port;
});

after(() => new Promise((resolver) => servidor.close(resolver)));
after(() => {
  try { fs.rmSync(pastaTemp, { recursive: true, force: true }); } catch (e) { /* Temp dir é dispensável */ }
});

/* ----- infraestrutura ----- */
test('health responde', async () => {
  const r = await pede('/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.dados.ok, true);
  assert.equal(r.dados.nome, 'gh-roleplay-api');
});

test('site estático é servido (SPA)', async () => {
  const r = await pede('/');
  assert.equal(r.status, 200);
  assert.ok(r.dados.includes('GH Roleplay'));
  const admin = await pede('/admin'); // rota do React — fallback devolve o index.html
  assert.equal(admin.status, 200);
  assert.ok(admin.dados.includes('id="raiz"'));
  const antigo = await fetch(base + '/admin.html', { redirect: 'manual' }); // link antigo vira redirect
  assert.equal(antigo.status, 301);
  assert.equal(antigo.headers.get('location'), '/admin');
  const faltando = await pede('/nao-existe.txt'); // com extensão → 404 real
  assert.equal(faltando.status, 404);
    const travessia = await fetch(base + '/%2e%2e/package-lock.json');
    assert.equal(travessia.status, 404); // arquivo existe na raiz do monorepo, fora do site
});

test('config inicial é a de fábrica', async () => {
  const r = await pede('/api/config');
  assert.equal(r.status, 200);
  assert.equal(r.dados.loja, 'GH Roleplay');
  assert.ok(Array.isArray(r.dados.produtos) && r.dados.produtos.length > 0);
});

/* ----- autenticação ----- */
test('login com senha errada recusa', async () => {
  const r = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'errada' } });
  assert.equal(r.status, 401);
});

test('login com a senha inicial', async () => {
  const r = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'admin123' } });
  assert.equal(r.status, 200);
  assert.ok(r.dados.token && r.dados.token.length >= 32);
  token = r.dados.token;
});

/* ----- config protegida ----- */
test('PUT sem sessão recusa; com sessão grava e lê de volta', async () => {
  const semToken = await pede('/api/config', { metodo: 'PUT', corpo: { loja: 'X' } });
  assert.equal(semToken.status, 401);

  const comToken = await pede('/api/config', { metodo: 'PUT', token, corpo: { loja: '  Loja de Teste <b>bold</b> ' } });
  assert.equal(comToken.status, 200);
  assert.equal(comToken.dados.loja, 'Loja de Teste bold'); // sem etiquetas HTML

  const reler = await pede('/api/config');
  assert.equal(reler.dados.loja, 'Loja de Teste bold');
});

test('PUT com corpo que não é objeto recusa', async () => {
  const r = await pede('/api/config', { metodo: 'PUT', token, corpo: 'sou um texto' });
  assert.equal(r.status, 400);
});

/* ----- catálogo ----- */
test('produtos por categoria', async () => {
  const tudo = await pede('/api/products');
  assert.equal(tudo.status, 200);
  const vips = await pede('/api/products?categoria=vips');
  assert.ok(vips.dados.produtos.length > 0);
  assert.ok(vips.dados.produtos.every((p) => p.categoria === 'vips'));
});

/* ----- pedidos ----- */
test('cria pedido e calcula cupom', async () => {
  const simples = await pede('/api/orders', {
    metodo: 'POST',
    corpo: { itens: [{ nome: 'VIP OURO – 30 DIAS', quantidade: 2 }], playerId: '64', discordId: '12345' }
  });
  assert.equal(simples.status, 201);
  assert.equal(simples.dados.pedido.total, 99.98);
  assert.equal(simples.dados.pedido.descontoPct, 0);
  assert.equal(simples.dados.pedido.playerId, '64');
  assert.equal(simples.dados.pedido.discordId, '12345');
  assert.ok(simples.dados.pedido.id.startsWith('PED-'));

  const comCupom = await pede('/api/orders', {
    metodo: 'POST',
    corpo: {
      itens: [{ nome: 'VIP OURO – 30 DIAS', quantidade: 4 }],
      cupom: 'ghbemvindo' // minúsculo: o servidor normaliza
    }
  });
  assert.equal(comCupom.status, 201);
  assert.equal(comCupom.dados.pedido.descontoPct, 10);
  assert.equal(comCupom.dados.pedido.total, 179.96);
});

test('pedido com produto inexistente recusa', async () => {
  const r = await pede('/api/orders', { metodo: 'POST', corpo: { itens: [{ nome: 'Espada do Fim', quantidade: 1 }] } });
  assert.equal(r.status, 400);
});

test('lista de pedidos é protegida', async () => {
  const semToken = await pede('/api/orders');
  assert.equal(semToken.status, 401);
  const comToken = await pede('/api/orders', { token });
  assert.equal(comToken.status, 200);
  assert.ok(comToken.dados.pedidos.length >= 2);
  assert.ok(comToken.dados.resumo && comToken.dados.resumo.porStatus);
});

/* ----- status do pedido (dono muda pelo painel) ----- */
test('muda status do pedido e filtra listagem', async () => {
  const lista = await pede('/api/orders', { token });
  const codigo = lista.dados.pedidos[0].id;
  assert.ok(codigo && codigo.startsWith('PED-'));

  const semToken = await pede('/api/orders/' + codigo, { metodo: 'PATCH', corpo: { status: 'pago' } });
  assert.equal(semToken.status, 401);

  const invalido = await pede('/api/orders/' + codigo, { metodo: 'PATCH', token, corpo: { status: 'virou-ouro' } });
  assert.equal(invalido.status, 400);

  const inexistente = await pede('/api/orders/PED-NAO-EXISTE-0000', { metodo: 'PATCH', token, corpo: { status: 'pago' } });
  assert.equal(inexistente.status, 404);

  const ok = await pede('/api/orders/' + codigo, { metodo: 'PATCH', token, corpo: { status: 'pago' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.dados.pedido.status, 'pago');

  const filtrada = await pede('/api/orders?status=pago', { token });
  assert.ok(filtrada.dados.pedidos.length >= 1);
  assert.ok(filtrada.dados.pedidos.every((p) => p.status === 'pago'));
  assert.ok(filtrada.dados.resumo && filtrada.dados.resumo.porStatus);
});

/* ----- checkout (Fase 2) ----- */
test('config expõe recursos e checkout de fábrica', async () => {
  const r = await pede('/api/config');
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.dados.recursos).sort(), ['discordLogin', 'pixAutomatico']);
  assert.equal(r.dados.recursos.pixAutomatico, false); // sem MP_ACCESS_TOKEN nos testes
  assert.equal(r.dados.recursos.discordLogin, false);
  assert.ok(r.dados.checkout && typeof r.dados.checkout.chavePix === 'string');
});

test('checkout exige playerId e cria pedido pendente', async () => {
  api.zerarLimitesCheckout();

  const semId = await pede('/api/checkout', { metodo: 'POST', corpo: { itens: [{ nome: 'VIP OURO – 30 DIAS', quantidade: 1 }] } });
  assert.equal(semId.status, 400);

  const sujo = await pede('/api/checkout', { metodo: 'POST', corpo: { itens: 'não é lista', playerId: '77' } });
  assert.equal(sujo.status, 400);

  const ok = await pede('/api/checkout', {
    metodo: 'POST',
    corpo: { itens: [{ nome: 'VIP OURO – 30 DIAS', quantidade: 1 }], playerId: '77' }
  });
  assert.equal(ok.status, 201);
  assert.ok(ok.dados.pedido.id.startsWith('PED-'));
  assert.equal(ok.dados.pedido.status, 'pendente');
  assert.equal(ok.dados.pedido.total, 49.99);
  assert.equal(ok.dados.manual.tipoChavePix, 'aleatoria');
  codigoCheckout = ok.dados.pedido.id;

  /* item inexistente também recusa */
  const falso = await pede('/api/checkout', { metodo: 'POST', corpo: { itens: [{ nome: 'Espada X', quantidade: 1 }], playerId: '77' } });
  assert.equal(falso.status, 400);
});

test('acompanhamento público do pedido mostra só id/status/total', async () => {
  const r = await pede('/api/checkout/' + codigoCheckout);
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.dados).sort(), ['id', 'status', 'total']);
  assert.equal(r.dados.status, 'pendente');

  const inexistente = await pede('/api/checkout/PED-NAO-EXISTE-99');
  assert.equal(inexistente.status, 404);
});

test('OAuth Discord e webhook do MP avisam quando não estão configurados', async () => {
  const oauth = await pede('/api/auth/discord');
  assert.equal(oauth.status, 503);

  const sessao = await pede('/api/auth/discord/sessao', { headers: { 'X-Discord-Token': 'qualquer' } });
  assert.equal(sessao.status, 404);

  const webhook = await pede('/api/webhooks/mercadopago', { metodo: 'POST', corpo: { type: 'payment', data: { id: '123' } } });
  assert.equal(webhook.status, 503);
});

/* ----- entregas (Fase 3): PATCH → pago alimenta a fila do servidor ----- */
test('PATCH para pago grava pago_em e cria entregas', async () => {
  const antes = await pede('/api/checkout/' + codigoCheckout);
  assert.equal(antes.dados.status, 'pendente');

  const r = await pede('/api/orders/' + codigoCheckout, { metodo: 'PATCH', token, corpo: { status: 'pago' } });
  assert.equal(r.status, 200);
  assert.ok(r.dados.pedido.pagoEm);
  assert.equal(r.dados.pedido.status, 'pago');

  /* idempotente: marcar pago de novo não quebra nem duplica */
  const deNovo = await pede('/api/orders/' + codigoCheckout, { metodo: 'PATCH', token, corpo: { status: 'pago' } });
  assert.equal(deNovo.status, 200);
  assert.equal(deNovo.dados.pedido.status, 'pago');

  /* e o dono ainda pode avançar para entregue (vira auditória de status) */
  const entregue = await pede('/api/orders/' + codigoCheckout, { metodo: 'PATCH', token, corpo: { status: 'entregue' } });
  assert.equal(entregue.status, 200);
  assert.equal(entregue.dados.pedido.status, 'entregue');
});

test('fila do FiveM: chave errada recusa, chave certa lista e marca', async () => {
  const semChave = await pede('/api/deliveries/queue');
  assert.equal(semChave.status, 401);

  const errada = await pede('/api/deliveries/queue', { headers: { 'X-Server-Key': 'errada' } });
  assert.equal(errada.status, 401);

  const ok = await pede('/api/deliveries/queue', { headers: { 'X-Server-Key': 'chave-servidor-teste' } });
  assert.equal(ok.status, 200);
  assert.ok(ok.dados.entregas.length >= 1);
  const entrega = ok.dados.entregas[0];
  assert.ok(entrega.pedidoCodigo && entrega.nome && entrega.playerId);

  const marca = await pede('/api/deliveries/' + entrega.id + '/marcar', {
    metodo: 'POST',
    headers: { 'X-Server-Key': 'chave-servidor-teste' },
    corpo: { status: 'entregue' }
  });
  assert.equal(marca.status, 200);

  const statusRuim = await pede('/api/deliveries/' + entrega.id + '/marcar', {
    metodo: 'POST',
    headers: { 'X-Server-Key': 'chave-servidor-teste' },
    corpo: { status: 'virou-ouro' }
  });
  assert.equal(statusRuim.status, 400);

  const inexistente = await pede('/api/deliveries/999999/marcar', {
    metodo: 'POST',
    headers: { 'X-Server-Key': 'chave-servidor-teste' },
    corpo: { status: 'entregue' }
  });
  assert.equal(inexistente.status, 404);
});

/* ----- auditoria (Fase 4) ----- */
test('auditoria registra o que aconteceu e é protegida', async () => {
  const semToken = await pede('/api/auditoria');
  assert.equal(semToken.status, 401);

  const r = await pede('/api/auditoria', { token });
  assert.equal(r.status, 200);
  const acoes = r.dados.registros.map((a) => a.acao);
  assert.ok(acoes.includes('pedido_pago'));
  assert.ok(acoes.includes('pedido_status'));
  assert.ok(acoes.includes('entrega_marcada'));
  assert.ok(acoes.includes('admin_login'));
  assert.ok(r.dados.registros.every((a) => a.criadoEm));
});

/* ----- senha ----- */
test('troca de senha exige a atual certa e a nova cuidada', async () => {
  const errada = await pede('/api/auth/trocar-senha', { metodo: 'POST', token, corpo: { atual: 'errada', nova: 'novaSenha1' } });
  assert.equal(errada.status, 400);

  const curta = await pede('/api/auth/trocar-senha', { metodo: 'POST', token, corpo: { atual: 'admin123', nova: 'abc' } });
  assert.equal(curta.status, 400);

  const ok = await pede('/api/auth/trocar-senha', { metodo: 'POST', token, corpo: { atual: 'admin123', nova: 'novaSenha1' } });
  assert.equal(ok.status, 200);

  const comNova = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'novaSenha1' } });
  assert.equal(comNova.status, 200);

  const velha = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'admin123' } });
  assert.equal(velha.status, 401);
});

/* ----- reset ----- */
test('DELETE volta a config ao padrão', async () => {
  const r = await pede('/api/config', { metodo: 'DELETE', token });
  assert.equal(r.status, 200);
  assert.equal(r.dados.loja, 'GH Roleplay');
});

/* ----- limite de tentativas (último, pois consome a janela do IP) ----- */
const auth = require('../src/auth');

test('limite de tentativas de login', async () => {
  auth.zerarLimites(); // janela limpa para o teste ser determinístico

  const primeira = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'errada' } });
  const segunda = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'errada' } });
  assert.equal(primeira.status, 401);
  assert.equal(segunda.status, 401);

  let bloqueou = false;
  for (let i = 0; i < 12; i++) {
    const r = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'errada' } });
    if (r.status === 429) { bloqueou = true; break; }
    assert.equal(r.status, 401);
  }
  assert.ok(bloqueou); // a janela lota em 6 tentativas por minuto

  const correta = await pede('/api/auth/login', { metodo: 'POST', corpo: { senha: 'novaSenha1' } });
  assert.equal(correta.status, 429); // bloqueia até mesmo a senha correta, na janela cheia
});
