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

const { criarServidor } = require('../src/server.js');

let servidor = null;
let base = '';
let token = '';

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

test('site estático é servido', async () => {
  const r = await pede('/');
  assert.equal(r.status, 200);
  assert.ok(r.dados.includes('GH Roleplay'));
  const configBase = await pede('/config-base.js');
  assert.equal(configBase.status, 200);
  assert.ok(configBase.dados.includes('CONFIG_BASE'));
  const faltando = await pede('/nao-existe.txt');
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
    corpo: { itens: [{ nome: 'VIP OURO – 30 DIAS', quantidade: 2 }] }
  });
  assert.equal(simples.status, 201);
  assert.equal(simples.dados.pedido.total, 99.98);
  assert.equal(simples.dados.pedido.descontoPct, 0);
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
