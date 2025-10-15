import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Cliente/Home';
import Pagamento from './pages/Cliente/Pagamento';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import TVPanel from './pages/TV/Panel';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Cliente Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pagamento" element={<Pagamento />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* TV Panel Route */}
        <Route path="/tv" element={<TVPanel />} />

        {/* Redirect old routes for compatibility */}
        <Route path="/cliente" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
