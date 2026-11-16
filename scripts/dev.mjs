/* npm dev — sobe os dois juntos: API com auto-recarga + Vite (frontend) */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const api = spawn('npm', ['run', 'dev', '--workspace', 'apps/api'], { shell: true, cwd: raiz });
const web = spawn('npm', ['run', 'dev', '--workspace', 'apps/web'], { shell: true, cwd: raiz });

function encaminhar(nome, proc) {
  proc.stdout.on('data', (d) => process.stdout.write(`[${nome}] ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`[${nome}] ${d}`));
  proc.on('exit', (codigo) => {
    console.log(`[${nome}] encerrou (${codigo})`);
    process.exit(codigo || 0);
  });
}

encaminhar('api', api);
encaminhar('web', web);
console.log('[gh-roleplay] dev: vite na 5173 (loja) · api na 8123 (proxy /api)');
