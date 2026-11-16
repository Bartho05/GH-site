/* =========================================================
   Utilidades compartilhadas entre a loja e o painel
   ========================================================= */

export const CHAVE_CONFIG = 'gh_config';

export function mesclar(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  if (base && typeof base === 'object' && extra && typeof extra === 'object') {
    const saida = { ...base };
    for (const k of Object.keys(extra)) saida[k] = mesclar(base[k], extra[k]);
    return saida;
  }
  return extra === undefined ? base : extra;
}

export function lerConfigLocal() {
  let salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(CHAVE_CONFIG)); } catch (e) {}
  return (salvo && typeof salvo === 'object') ? salvo : null;
}

export function escreverConfigLocal(cfg) {
  try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(cfg)); } catch (e) {}
}

/* site/painel abertos por http falam com a mesma origem;
   abertos por file:// falam com o servidor local */
export const API_RAIZ = (location.protocol === 'http:' || location.protocol === 'https:')
  ? ''
  : 'http://localhost:8123';

export async function puxarConfigServidor() {
  try {
    const r = await fetch(API_RAIZ + '/api/config');
    if (!r.ok) return null;
    const dados = await r.json();
    return (dados && typeof dados === 'object' && !Array.isArray(dados)) ? dados : null;
  } catch (e) {
    return null; // sem servidor: fica com localStorage + padrão de fábrica
  }
}

export const BRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function animsDesligadas() {
  return document.documentElement.dataset.anim === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* 'gamepad-2' → 'Gamepad2' (nome de componente do lucide-react) */
export function paraCamel(nome) {
  return String(nome).split('-').map((p) => (p ? p[0].toUpperCase() + p.slice(1) : '')).join('');
}

export function slugProduto(nome) {
  return 'produto-' + String(nome).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function fimDoDia() {
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  return fim.getTime();
}

/* rola até o card do produto e o destaca por 1,8s */
export function irParaProduto(nome) {
  const alvo = document.getElementById(slugProduto(nome));
  if (!alvo) return;
  alvo.scrollIntoView({ behavior: animsDesligadas() ? 'auto' : 'smooth', block: 'center' });
  alvo.style.borderColor = 'hsl(var(--primary))';
  setTimeout(() => { alvo.style.borderColor = ''; }, 1800);
}
