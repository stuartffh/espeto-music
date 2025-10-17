import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';

function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { isAuthenticated, verificarToken } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Se requer Super Admin, verificar localStorage diferente
      if (requireSuperAdmin) {
        const token = localStorage.getItem('superAdminToken');
        setChecking(false);
        return;
      }

      // Verificação normal de Admin
      await verificarToken();
      setChecking(false);
    };
    checkAuth();
  }, [verificarToken, requireSuperAdmin]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-white text-xl">Verificando autenticação...</div>
      </div>
    );
  }

  // Verificação de Super Admin
  if (requireSuperAdmin) {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      return <Navigate to="/super-admin/login" replace />;
    }
    return children;
  }

  // Verificação de Admin normal
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
