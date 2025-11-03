import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import OfflineIndicator from './components/OfflineIndicator';

const Home = lazy(() => import('./pages/Cliente/Home'));
const Pagamento = lazy(() => import('./pages/Cliente/Pagamento'));
const AdminLogin = lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminLocacoes = lazy(() => import('./pages/Admin/Locacoes'));
const TVPanel = lazy(() => import('./pages/TV/Panel'));
const LocacaoCliente = lazy(() => import('./pages/Cliente/LocacaoCliente'));

const RouteFallback = () => (
  <div className="flex h-[60vh] w-full items-center justify-center text-lg font-mono text-tv-phosphor animate-tv-glow">
    [ CARREGANDO INTERFACE... ]
  </div>
);

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-tv-black text-tv-phosphor crt-effect relative">
      {/* Efeito CRT Vignette */}
      <div className="crt-vignette"></div>
      
      <OfflineIndicator />
      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location} key={location.pathname}>
            {/* Cliente Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/pagamento/:status" element={<Pagamento />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/locacoes"
              element={
                <ProtectedRoute>
                  <AdminLocacoes />
                </ProtectedRoute>
              }
            />

            {/* Locação Cliente Route */}
            <Route path="/l/:slug" element={<LocacaoCliente />} />

            {/* TV Panel Routes - ORDEM IMPORTA: rota específica ANTES da genérica */}
            <Route path="/tv/:slugPainelTV" element={<TVPanel />} />
            <Route path="/tv" element={<TVPanel />} />

            {/* Redirect old routes for compatibility */}
            <Route path="/cliente" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  );
}

export default App;
