/* Testes unitários dos validadores */
const { test } = require('node:test');
const assert = require('node:assert');
const { normalizaConfig, normalizaPedido } = require('../src/validar');

test('config: entrada suja é potada ao padrão, não quebra', () => {
  const r = normalizaConfig({
    loja: '   LOJA <script>alert(1)</script>    ',
    cupom: { codigo: 'cupom com espaço', desconto: 999, minimo: -5 },
    servidor: { link: 'javascript:alert(1)', jogadores: -10 },
    temaPadrao: 'roxo-inexistente'
  });
  assert.equal(r.ok, true);
  assert.equal(r.config.loja, 'LOJA alert(1)');     // só texto sobrevive; sem < > no resultado
  assert.ok(!/[<>]/.test(r.config.loja));           // nada de markup sobrando
  assert.equal(r.config.cupom.desconto, 99);
  assert.equal(r.config.cupom.minimo, 0);
  assert.equal(r.config.servidor.link, '#');
  assert.equal(r.config.servidor.jogadores, 0);
  assert.equal(r.config.temaPadrao, 'laranja');
});

test('config: ids de categoria duplicados ganham sufixo', () => {
  const r = normalizaConfig({
    categorias: [
      { nome: 'VIPs', id: 'vips' },
      { nome: 'V.i.P.s!', id: '' },
      { nome: 'VIPs de novo', id: 'vips' }
    ],
    produtos: []
  });
  assert.equal(r.ok, true);
  const ids = r.config.categorias.map((c) => c.id);
  assert.deepEqual(ids, ['vips', 'v-i-p-s', 'vips-2']);
});

test('config: preço antigo menor ou igual ao atual é removido', () => {
  const r = normalizaConfig({ produtos: [{ nome: 'X', categoria: 'vips', preco: 50, precoAntigo: 50 }] });
  assert.equal(r.ok, true);
  assert.equal(r.config.produtos[0].precoAntigo, null);
});

test('config: corpo que não é objeto recusa', () => {
  assert.equal(normalizaConfig('nada').ok, false);
  assert.equal(normalizaConfig([1, 2]).ok, false);
  assert.equal(normalizaConfig(null).ok, false);
});

test('config: produto com categoria apagada recai na primeira', () => {
  const r = normalizaConfig({
    categorias: [{ nome: 'A', id: 'a' }, { nome: 'B', id: 'b' }],
    produtos: [{ nome: 'Item', categoria: ' Culhotes-sumida ', preco: 10 }]
  });
  assert.equal(r.config.produtos[0].categoria, 'a');
});

test('pedido: campos tratados, total arredondado em centavos', () => {
  const r = normalizaPedido(
    { itens: [{ nome: 'VIP OURO – 30 DIAS', quantidade: 2 }] },
    { produtos: [{ nome: 'VIP OURO – 30 DIAS', preco: 49.99 }], cupom: { codigo: 'X', desconto: 10, minimo: 999 } }
  );
  assert.equal(r.ok, true);
  assert.equal(r.pedido.subtotal, 99.98);
  assert.equal(r.pedido.descontoPct, 0);
  assert.equal(r.pedido.total, 99.98);
});

test('pedido: quantidade palpita e some em 50', () => {
  const r = normalizaPedido(
    { itens: [{ nome: 'P', quantidade: 1000 }] },
    { produtos: [{ nome: 'P', preco: 1 }], cupom: { codigo: '', desconto: 0, minimo: 0 } }
  );
  assert.equal(r.pedido.itens[0].quantidade, 50);
});

test('pedido: itens desconhecidos recusam', () => {
  const r = normalizaPedido(
    { itens: [{ nome: 'Espada Lendária X', quantidade: 1 }] },
    { produtos: [{ nome: 'P', preco: 1 }], cupom: { codigo: '', desconto: 0, minimo: 0 } }
  );
  assert.equal(r.ok, false);
});

test('pedido: cupom só vale acima do mínimo', () => {
  const cfg = { produtos: [{ nome: 'P', preco: 100 }], cupom: { codigo: 'BEMVINDO', desconto: 10, minimo: 150 } };
  const abaixo = normalizaPedido({ itens: [{ nome: 'P', quantidade: 1 }], cupom: 'bemvindo' }, cfg);
  assert.equal(abaixo.pedido.descontoPct, 0);
  const acima = normalizaPedido({ itens: [{ nome: 'P', quantidade: 2 }], cupom: 'BEMVINDO' }, cfg);
  assert.equal(acima.pedido.descontoPct, 10);
  assert.equal(acima.pedido.total, 180);
  assert.equal(acima.pedido.cupom, 'BEMVINDO');
});
