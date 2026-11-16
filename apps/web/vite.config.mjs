import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  /* caminhos relativos: o build funciona até aberto por file:// */
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(raiz, 'index.html'),
        admin: path.resolve(raiz, 'admin.html')
      }
    }
  },
  server: {
    /* no dev (vite na 5173), /api vai para o backend na 8123 */
    proxy: {
      '/api': 'http://localhost:8123'
    }
  }
});
