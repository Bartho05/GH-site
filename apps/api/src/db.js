/* =========================================================
   db.js — persistência simples em arquivo JSON
   apps/api/data/store.json  (pode trocar com o env GHRP_DATA)

   Guarda: config da loja, pedidos e o hash da senha do admin.
   Na primeira execução semeia a config a partir do config-base.js
   do frontend (fonte única de verdade).
   ========================================================= */
const fs = require('fs');
const path = require('path');

const RAIZ_WEB = path.join(__dirname, '..', '..', 'web');
const { CONFIG_BASE } = require(path.join(RAIZ_WEB, 'config-base.js'));

function pastaDados() {
  return process.env.GHRP_DATA || path.join(__dirname, '..', 'data');
}
function caminhoArquivo() {
  return path.join(pastaDados(), 'store.json');
}

let cache = null;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function padrao() {
  return {
    config: clone(CONFIG_BASE),
    pedidos: [],
    admin: null, // { salt, hash } — null = senha inicial (admin123)
    atualizadoEm: new Date().toISOString()
  };
}

function ler() {
  if (cache) return cache;
  try {
    const disco = JSON.parse(fs.readFileSync(caminhoArquivo(), 'utf8'));
    if (disco && typeof disco === 'object') {
      cache = { ...padrao(), ...disco };
      return cache;
    }
  } catch (e) { /* arquivo ausente ou inválido → semeia */ }
  cache = padrao();
  gravar();
  return cache;
}

function gravar() {
  fs.mkdirSync(pastaDados(), { recursive: true });
  fs.writeFileSync(caminhoArquivo(), JSON.stringify(cache, null, 2));
}

module.exports = {
  CONFIG_BASE,
  clone,
  getConfig() {
    return clone(ler().config);
  },
  putConfig(config) {
    const dados = ler();
    dados.config = clone(config);
    dados.atualizadoEm = new Date().toISOString();
    gravar();
    return clone(dados.config);
  },
  resetConfig() {
    return this.putConfig(clone(CONFIG_BASE));
  },
  getAdmin() {
    return ler().admin;
  },
  setAdmin(admin) {
    const dados = ler();
    dados.admin = admin;
    gravar();
  },
  addPedido(pedido) {
    const dados = ler();
    dados.pedidos.unshift(pedido);
    if (dados.pedidos.length > 500) dados.pedidos.length = 500;
    gravar();
  },
  listarPedidos() {
    return clone(ler().pedidos);
  }
};
