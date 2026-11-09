/* =========================================================
   auth.js — senha (scrypt), tokens de sessão e limite de tentativas
   ========================================================= */
const crypto = require('crypto');

const SENHA_INICIAL = 'admin123';
const DURACAO_SESSAO = 12 * 60 * 60 * 1000; // 12h

const sessoes = new Map(); // token → expiraEm
const tentativasPorIp = new Map(); // ip → { n, resetEm }

function hashSenha(senha, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 32).toString('hex');
  return { salt, hash };
}

/* admin == null → usa a senha inicial em texto (dono deve trocar depois) */
function confereSenha(senha, admin) {
  if (!admin || !admin.hash) return senha === SENHA_INICIAL;
  const tentativa = crypto.scryptSync(senha, admin.salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(tentativa, 'hex'), Buffer.from(admin.hash, 'hex'));
}

function criarToken() {
  limparExpiradas();
  const token = crypto.randomBytes(32).toString('hex');
  sessoes.set(token, Date.now() + DURACAO_SESSAO);
  return token;
}

function tokenValido(token) {
  if (!token) return false;
  const expira = sessoes.get(token);
  if (!expira || expira < Date.now()) {
    sessoes.delete(token);
    return false;
  }
  return true;
}

function revogarToken(token) {
  sessoes.delete(token);
}

function limparExpiradas() {
  const agora = Date.now();
  for (const [token, expira] of sessoes) {
    if (expira < agora) sessoes.delete(token);
  }
}

/* 6 tentativas de login por minuto, por IP */
function limiteOk(ip) {
  const agora = Date.now();
  const registro = tentativasPorIp.get(ip) || { n: 0, resetEm: agora + 60000 };
  if (agora > registro.resetEm) {
    registro.n = 0;
    registro.resetEm = agora + 60000;
  }
  registro.n += 1;
  tentativasPorIp.set(ip, registro);
  return registro.n <= 6;
}

/* usado pelos testes para começar com a janela limpa */
function zerarLimites() {
  tentativasPorIp.clear();
}

module.exports = {
  SENHA_INICIAL,
  hashSenha,
  confereSenha,
  criarToken,
  tokenValido,
  revogarToken,
  limiteOk,
  zerarLimites
};
