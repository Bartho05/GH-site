import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /* assets com caminho ABSOLUTO (/assets/...): com './' relativo, rotas
     aninhadas (/produto/:slug) resolviam ./assets como /produto/assets —
     404 no acesso direto/refresh (a SPA funcionava por não recarregar) */
  base: '/',
  plugins: [react()],
  server: {
    /* no dev (vite na 5173), /api vai para o backend na 8123 */
    proxy: {
      '/api': 'http://localhost:8123'
    }
  }
});
