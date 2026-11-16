import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /* caminhos relativos no build (assets de dist/ com ./) */
  base: './',
  plugins: [react()],
  server: {
    /* no dev (vite na 5173), /api vai para o backend na 8123 */
    proxy: {
      '/api': 'http://localhost:8123'
    }
  }
});
