/* =========================================================
   server.js — backend da loja GH Roleplay (Node puro)

   - Serve o frontend (apps/web) no /
   - Rotas de API em /api/*  (ver api.js)
   - Zero dependências: usa só node:http/fs/crypto

   Testes: node --test test/   (usar PORT=0 no ambiente de teste)
   ========================================================= */
const http = require('http');
const fs = require('fs');
const path = require('path');
const api = require('./api');

const RAIZ_WEB = path.join(__dirname, '..', '..', 'web');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

const LIMITE_CORPO = 1000000; // 1 MB

function enviar(res, status, corpo, tipo) {
  const dados = typeof corpo === 'string' ? Buffer.from(corpo) : Buffer.from(JSON.stringify(corpo));
  res.writeHead(status, {
    'Content-Type': tipo || 'application/json; charset=utf-8',
    'Content-Length': dados.length,
    'Cache-Control': 'no-store'
  });
  res.end(dados);
}

function servirEstatico(req, res, pathname) {
  const alvo = pathname === '/' ? '/index.html' : pathname;
  const resolvido = path.resolve(path.join(RAIZ_WEB, alvo));
  if (resolvido !== RAIZ_WEB && !resolvido.startsWith(RAIZ_WEB + path.sep)) {
    return enviar(res, 404, 'arquivo não encontrado', 'text/plain; charset=utf-8');
  }
  fs.readFile(resolvido, (erro, dados) => {
    if (erro) return enviar(res, 404, 'arquivo não encontrado', 'text/plain; charset=utf-8');
    const tipo = MIME[path.extname(resolvido).toLowerCase()] || 'application/octet-stream';
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': dados.length });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': dados.length });
    res.end(dados);
  });
}

function lerCorpo(req) {
  return new Promise((resolver) => {
    const pedacos = [];
    let tamanho = 0;
    req.on('data', (pedaco) => {
      tamanho += pedaco.length;
      if (tamanho > LIMITE_CORPO) {
        req.destroy();
        resolver(null);
        return;
      }
      pedacos.push(pedaco);
    });
    req.on('end', () => {
      if (tamanho === 0) return resolver(null);
      try {
        resolver(JSON.parse(Buffer.concat(pedacos).toString('utf8')));
      } catch (e) {
        resolver(null);
      }
    });
    req.on('error', () => resolver(null));
  });
}

function criarServidor() {
  return http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    let pathname = '/';
    let url = null;
    try {
      url = new URL(req.url, 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch (e) {
      return enviar(res, 404, { erro: 'url inválida' });
    }

    try {
      if (pathname.startsWith('/api/')) {
        const metodo = req.method.toUpperCase();
        let corpo = null;
        if (metodo === 'POST' || metodo === 'PUT') {
          corpo = await lerCorpo(req);
          if (corpo === null) return enviar(res, 400, { erro: 'corpo JSON inválido ou grande demais' });
        }
        const enviarJson = (status, dados, tipo) => enviar(res, status, dados, tipo);
        return api.despachar(req, res, { metodo, pathname, url, corpo, enviar: enviarJson });
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        return servirEstatico(req, res, pathname);
      }
      return enviar(res, 405, { erro: 'método não permitido para esta rota' });
    } catch (erro) {
      console.error('[api] erro inesperado:', erro);
      try {
        enviar(res, 500, { erro: 'erro interno' });
      } catch (e) {
        res.end();
      }
    }
  });
}

if (require.main === module) {
  const PORTA = Number(process.env.PORT || process.env.GHRP_PORT || 8123);
  criarServidor().listen(PORTA, () => {
    console.log('[gh-roleplay] loja:    http://localhost:' + PORTA + '/');
    console.log('[gh-roleplay] admin:   http://localhost:' + PORTA + '/admin.html');
    console.log('[gh-roleplay] api:     http://localhost:' + PORTA + '/api/health');
  });
}

module.exports = { criarServidor, servirEstatico };
