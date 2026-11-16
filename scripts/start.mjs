/* npm start — constrói o frontend se ainda não houver build, depois sobe a API */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

if (!existsSync(path.join(raiz, 'apps', 'web', 'dist', 'index.html'))) {
  console.log('[gh-roleplay] frontend sem build — construindo com o Vite (uma vez)...');
  const build = spawnSync('npm', ['run', 'build', '--workspace', 'apps/web'],
    { stdio: 'inherit', shell: true, cwd: raiz });
  if (build.status !== 0) process.exit(build.status || 1);
}

spawnSync('npm', ['run', 'start', '--workspace', 'apps/api'],
  { stdio: 'inherit', shell: true, cwd: raiz });
