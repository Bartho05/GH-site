/* =========================================================
   Testes do banco SQLite (node:sqlite)
   Usa pasta temporária (env GHRP_DATA) e importa um
   store.json legado de teste — não toca no banco real.
   ========================================================= */
const { test, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghrp-db-'));

/* store.json "antigo": config + senha com hash + um pedido anterior à migração */
const auth = require('../src/auth');
const legado = {
  config: { loja: 'Loja Legado' }, // db importa cru (já saiu normalizado do servidor antes)
  admin: auth.hashSenha('segredoLongo1'),
  pedidos: [
    {
      id: 'PED-LEGADO-1',
      itens: [{ nome: 'VIP BRONZE – 7 DIAS', quantidade: 2 }],
      subtotal: 39.98, descontoPct: 0, desconto: 0, total: 39.98,
      cupom: null, criadoEm: '2026-11-09T12:00:00.000Z'
    }
  ]
};
fs.writeFileSync(path.join(pastaTemp, 'store.json'), JSON.stringify(legado));

process.env.GHRP_DATA = pastaTemp;
const db = require('../src/db');

after(() => { try { fs.rmSync(pastaTemp, { recursive: true, force: true }); } catch (e) {} });

test('importa o store.json legado na primeira execução', () => {
  assert.equal(db.getConfig().loja, 'Loja Legado');
  assert.ok(db.getAdmin() && db.getAdmin().hash);
  const pedidos = db.listarPedidos();
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].id, 'PED-LEGADO-1');
  assert.equal(pedidos[0].status, 'pendente'); // pedidos antigos entram como pendentes
  assert.equal(pedidos[0].total, 39.98);
});

test('senha importada do legado autentica', () => {
  const admin = db.getAdmin();
  assert.equal(auth.confereSenha('segredoLongo1', admin), true);
  assert.equal(auth.confereSenha('errada', admin), false);
});

test('config e senha sobrescrevem e leem de volta', () => {
  db.putConfig({ loja: 'Nova Loja', cupom: { codigo: 'X' } });
  assert.equal(db.getConfig().loja, 'Nova Loja');

  db.setAdmin({ salt: 'salt-x', hash: 'hash-x' });
  assert.deepEqual(db.getAdmin(), { salt: 'salt-x', hash: 'hash-x' });
  db.setAdmin(null); // volta a usar a senha inicial
  assert.equal(db.getAdmin(), null);
});

test('pedidos: inserir, ler por código e mudar status', () => {
  db.addPedido({
    id: 'PED-TESTE-1',
    itens: [{ nome: 'A', quantidade: 1 }],
    subtotal: 10, descontoPct: 0, desconto: 0, total: 10, cupom: null,
    playerId: '64', discordId: '12345678901234567',
    criadoEm: '2026-11-10T00:00:00.000Z'
  });

  const porCodigo = db.pedidoPorCodigo('PED-TESTE-1');
  assert.equal(porCodigo.status, 'pendente');
  assert.equal(porCodigo.playerId, '64');
  assert.equal(porCodigo.discordId, '12345678901234567');

  const maisRecente = db.listarPedidos()[0]; // novo primeiro
  assert.equal(maisRecente.id, 'PED-TESTE-1');

  const pago = db.setStatusPedido('PED-TESTE-1', 'pago');
  assert.equal(pago.status, 'pago');
  assert.equal(db.pedidoPorCodigo('PED-TESTE-1').status, 'pago');

  assert.equal(db.setStatusPedido('PED-TESTE-1', 'status-falso'), null);
  assert.equal(db.setStatusPedido('PED-NAO-EXISTE', 'pago'), null);
  assert.equal(db.pedidoPorCodigo('PED-NAO-EXISTE'), null);
});

test('resumo: contagem por status e arrecadado (pago + entregue)', () => {
  db.addPedido({
    id: 'PED-TESTE-2',
    itens: [{ nome: 'B', quantidade: 1 }],
    subtotal: 25.5, descontoPct: 0, desconto: 0, total: 25.5, cupom: null,
    criadoEm: '2026-11-10T01:00:00.000Z'
  });
  db.setStatusPedido('PED-TESTE-2', 'entregue');

  const r = db.resumoPedidos();
  assert.equal(r.quantidade, 3); // legado + os dois de teste
  assert.equal(r.porStatus.pendente.n, 1);
  assert.equal(r.porStatus.pago.n, 1);
  assert.equal(r.porStatus.entregue.n, 1);
  assert.equal(r.porStatus.entregue.total, 25.5);
  assert.equal(r.arrecadado, 35.5); // pago 10 + entregue 25.5
});

test('fila de entregas: um item por linha, marca entregue', () => {
  db.addEntrega({
    pedidoCodigo: 'PED-TESTE-2',
    itens: [{ nome: 'B', quantidade: 1 }, { nome: 'C', quantidade: 3 }],
    playerId: '64',
    discordId: '12345678901234567'
  });

  const fila = db.listarEntregas({ status: 'pendente' });
  assert.equal(fila.length, 2);
  assert.ok(fila.every((e) => e.status === 'pendente' && e.playerId === '64' && e.pedidoCodigo === 'PED-TESTE-2'));
  assert.ok(fila.some((e) => e.nome === 'C' && e.quantidade === 3));

  assert.equal(db.marcarEntrega(fila[0].id, 'entregue'), true);
  assert.equal(db.listarEntregas({ status: 'pendente' }).length, 1);
  assert.ok(db.listarEntregas({ status: 'entregue' })[0].entregueEm);

  assert.equal(db.marcarEntrega(9999, 'entregue'), false); // id que não existe
  assert.equal(db.marcarEntrega(fila[1].id, 'status-ruim'), false); // status fora da lista
});
