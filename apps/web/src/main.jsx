import { lazy, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import Loja from './loja/App.jsx';

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
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Loja />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
