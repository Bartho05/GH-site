/* =========================================================
   db.js — banco de dados da loja (SQLite nativo do Node)
   apps/api/data/loja.db  (a pasta pode mudar com o env GHRP_DATA)

   Guarda: config da loja, senha do admin, pedidos e a fila de
   entregas para o servidor FiveM (Fase 3).

   Na primeira execução:
   - se existir um store.json do backend antigo, importa tudo dele
   - senão, semeia a config a partir do config-base.js do frontend
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const RAIZ_WEB = path.join(__dirname, '..', '..', 'web');
const { CONFIG_BASE } = require(path.join(RAIZ_WEB, 'config-base.js'));

const STATUSES_PEDIDO = ['pendente', 'pago', 'entregue', 'cancelado'];
const STATUSES_ENTREGA = ['pendente', 'entregue', 'falhou'];

function pastaDados() {
  return process.env.GHRP_DATA || path.join(__dirname, '..', 'data');
}
function caminhoBanco() {
  return path.join(pastaDados(), 'loja.db');
}
function caminhoLegado() {
  return path.join(pastaDados(), 'store.json');
}

let db = null;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function abrir() {
  if (db) return db;
  fs.mkdirSync(pastaDados(), { recursive: true });
  db = new DatabaseSync(caminhoBanco());
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      salt TEXT,
      hash TEXT
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      codigo TEXT PRIMARY KEY,
      itens_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      desconto_pct REAL NOT NULL DEFAULT 0,
      desconto REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      cupom TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      player_id TEXT,
      discord_id TEXT,
      criado_em TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status, criado_em DESC);
    CREATE TABLE IF NOT EXISTS entregas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_codigo TEXT NOT NULL REFERENCES pedidos(codigo),
      item_nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      discord_id TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      criado_em TEXT NOT NULL,
      entregue_em TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status, id);
  `);
  semearOuImportar();
  return db;
}

/* Primeira execução: importa o store.json do backend antigo
   (config + senha + pedidos) ou semeia a config de fábrica. */
function semearOuImportar() {
  const temConfig = db.prepare('SELECT id FROM config WHERE id = 1').get();
  if (temConfig) return;

  let importado = false;
  try {
    const legado = JSON.parse(fs.readFileSync(caminhoLegado(), 'utf8'));
    if (legado && legado.config && typeof legado.config === 'object') {
      db.prepare('INSERT INTO config (id, json, atualizado_em) VALUES (1, ?, ?)')
        .run(JSON.stringify(legado.config), new Date().toISOString());
      if (legado.admin && legado.admin.salt && legado.admin.hash) {
        db.prepare('INSERT INTO admin (id, salt, hash) VALUES (1, ?, ?)')
          .run(String(legado.admin.salt), String(legado.admin.hash));
      }
      const inserePedido = db.prepare(`
        INSERT INTO pedidos
          (codigo, itens_json, subtotal, desconto_pct, desconto, total, cupom, status, player_id, discord_id, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', NULL, NULL, ?)
      `);
      for (const p of (Array.isArray(legado.pedidos) ? legado.pedidos : []).slice(0, 500)) {
        if (!p || typeof p.id !== 'string' || !p.id) continue;
        try {
          inserePedido.run(
            p.id,
            JSON.stringify(Array.isArray(p.itens) ? p.itens : []),
            Number(p.subtotal) || 0,
            Number(p.descontoPct) || 0,
            Number(p.desconto) || 0,
            Number(p.total) || 0,
            p.cupom || null,
            p.criadoEm || new Date().toISOString()
          );
        } catch (e) { /* código repetido ou linha ruim: pula */ }
      }
      importado = true;
    }
  } catch (e) { /* sem store.json legado — segue para o seed */ }

  if (!importado) {
    db.prepare('INSERT INTO config (id, json, atualizado_em) VALUES (1, ?, ?)')
      .run(JSON.stringify(CONFIG_BASE), new Date().toISOString());
  }
}

function linhaPedido(r) {
  return {
    id: r.codigo,
    itens: JSON.parse(r.itens_json || '[]'),
    subtotal: r.subtotal,
    descontoPct: r.desconto_pct,
    desconto: r.desconto,
    total: r.total,
    cupom: r.cupom || null,
    status: r.status,
    playerId: r.player_id || null,
    discordId: r.discord_id || null,
    criadoEm: r.criado_em
  };
}

module.exports = {
  CONFIG_BASE,
  clone,
  STATUSES_PEDIDO,
  STATUSES_ENTREGA,

  /* ----- config ----- */
  getConfig() {
    const r = abrir().prepare('SELECT json FROM config WHERE id = 1').get();
    return JSON.parse(r.json);
  },
  putConfig(config) {
    abrir().prepare(`
      INSERT INTO config (id, json, atualizado_em) VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET json = excluded.json, atualizado_em = excluded.atualizado_em
    `).run(JSON.stringify(config), new Date().toISOString());
    return this.getConfig();
  },
  resetConfig() {
    return this.putConfig(clone(CONFIG_BASE));
  },

  /* ----- senha do admin (null = senha inicial admin123) ----- */
  getAdmin() {
    const r = abrir().prepare('SELECT salt, hash FROM admin WHERE id = 1').get();
    if (!r || !r.hash) return null;
    return { salt: r.salt, hash: r.hash };
  },
  setAdmin(admin) {
    abrir().prepare(`
      INSERT INTO admin (id, salt, hash) VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET salt = excluded.salt, hash = excluded.hash
    `).run(admin ? admin.salt : null, admin ? admin.hash : null);
  },

  /* ----- pedidos ----- */
  addPedido(pedido) {
    abrir().prepare(`
      INSERT INTO pedidos
        (codigo, itens_json, subtotal, desconto_pct, desconto, total, cupom, status, player_id, discord_id, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pedido.id,
      JSON.stringify(pedido.itens || []),
      pedido.subtotal || 0,
      pedido.descontoPct || 0,
      pedido.desconto || 0,
      pedido.total || 0,
      pedido.cupom || null,
      pedido.status || 'pendente',
      pedido.playerId || null,
      pedido.discordId || null,
      pedido.criadoEm || new Date().toISOString()
    );
    return clone(pedido);
  },

  listarPedidos({ status, limite = 200 } = {}) {
    let sql = 'SELECT * FROM pedidos';
    const params = [];
    if (status && STATUSES_PEDIDO.includes(status)) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY criado_em DESC, rowid DESC LIMIT ?';
    params.push(limite);
    return abrir().prepare(sql).all(...params).map(linhaPedido);
  },

  pedidoPorCodigo(codigo) {
    const r = abrir().prepare('SELECT * FROM pedidos WHERE codigo = ?').get(codigo);
    return r ? linhaPedido(r) : null;
  },

  setStatusPedido(codigo, status) {
    if (!STATUSES_PEDIDO.includes(status)) return null;
    const r = abrir().prepare('UPDATE pedidos SET status = ? WHERE codigo = ?').run(status, codigo);
    if (r.changes === 0) return null;
    return this.pedidoPorCodigo(codigo);
  },

  /* números para o painel: quantos pedidos por status e quanto entrou de dinheiro */
  resumoPedidos() {
    const porStatus = {};
    for (const s of STATUSES_PEDIDO) porStatus[s] = { n: 0, total: 0 };
    let quantidade = 0;
    let arrecadado = 0;
    for (const l of abrir().prepare(
      'SELECT status, COUNT(*) AS n, COALESCE(SUM(total), 0) AS total FROM pedidos GROUP BY status'
    ).all()) {
      if (!porStatus[l.status]) porStatus[l.status] = { n: 0, total: 0 };
      porStatus[l.status] = { n: l.n, total: l.total };
      quantidade += l.n;
      if (l.status === 'pago' || l.status === 'entregue') arrecadado += l.total;
    }
    return { porStatus, quantidade, arrecadado: Math.round(arrecadado * 100) / 100 };
  },

  /* ----- fila de entregas (o resource FiveM consome isto na Fase 3) ----- */
  addEntrega({ pedidoCodigo, itens, playerId, discordId, criadoEm }) {
    const insere = abrir().prepare(`
      INSERT INTO entregas (pedido_codigo, item_nome, quantidade, player_id, discord_id, status, criado_em)
      VALUES (?, ?, ?, ?, ?, 'pendente', ?)
    `);
    const agora = criadoEm || new Date().toISOString();
    db.exec('BEGIN');
    try {
      for (const item of (itens || [])) {
        insere.run(pedidoCodigo, String(item.nome || ''), Number(item.quantidade) || 1,
          String(playerId || ''), discordId || null, agora);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },

  listarEntregas({ status = 'pendente', limite = 100 } = {}) {
    if (!STATUSES_ENTREGA.includes(status)) status = 'pendente';
    return abrir().prepare('SELECT * FROM entregas WHERE status = ? ORDER BY id LIMIT ?')
      .all(status, limite)
      .map((r) => ({
        id: r.id,
        pedidoCodigo: r.pedido_codigo,
        nome: r.item_nome,
        quantidade: r.quantidade,
        playerId: r.player_id,
        discordId: r.discord_id,
        status: r.status,
        criadoEm: r.criado_em,
        entregueEm: r.entregue_em
      }));
  },

  marcarEntrega(id, status) {
    if (!STATUSES_ENTREGA.includes(status)) return false;
    const entregueEm = status === 'entregue' ? new Date().toISOString() : null;
    const r = abrir().prepare('UPDATE entregas SET status = ?, entregue_em = ? WHERE id = ?')
      .run(status, entregueEm, id);
    return r.changes > 0;
  }
};
