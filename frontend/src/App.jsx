import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Cliente/Home';
import Pagamento from './pages/Cliente/Pagamento';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import TVPanel from './pages/TV/Panel';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-white transition-colors duration-300">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* MULTI-TENANT ROUTES - All routes now include /:slug */}

          {/* Cliente Routes */}
          <Route path="/:slug" element={<Home />} />
          <Route path="/:slug/pagamento/:status" element={<Pagamento />} />

          {/* Admin Routes */}
          <Route path="/:slug/admin/login" element={<AdminLogin />} />
          <Route path="/:slug/admin" element={<Navigate to="admin/dashboard" replace />} />
          <Route
            path="/:slug/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* TV Panel Route */}
          <Route path="/:slug/tv" element={<TVPanel />} />

          {/* BACKWARD COMPATIBILITY - Redirect old routes to demo slug */}
          <Route path="/" element={<Navigate to="/demo" replace />} />
          <Route path="/pagamento/:status" element={<Navigate to="/demo/pagamento/:status" replace />} />
          <Route path="/admin/login" element={<Navigate to="/demo/admin/login" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/demo/admin/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/demo/admin" replace />} />
          <Route path="/tv" element={<Navigate to="/demo/tv" replace />} />
          <Route path="/cliente" element={<Navigate to="/demo" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
