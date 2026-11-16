import { lazy, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import Loja from './loja/App.jsx';
import Checkout from './loja/Checkout.jsx';
import Conta from './loja/Conta.jsx';
import Produto from './loja/Produto.jsx';
import Privacidade from './loja/Privacidade.jsx';
import Termos from './loja/Termos.jsx';
import NaoEncontrada from './loja/NaoEncontrada.jsx';

/* painel carrega em chunk separado: só quem entra em /admin baixa */
const Admin = lazy(() => import('./admin/App.jsx'));

function VoltarAoTopo() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

createRoot(document.getElementById('raiz')).render(
  <BrowserRouter>
    <VoltarAoTopo />
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Loja />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="/login" element={<Navigate to="/conta" replace />} />
        <Route path="/produto/:slug" element={<Produto />} />
        <Route path="/terms" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/404" element={<NaoEncontrada />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
