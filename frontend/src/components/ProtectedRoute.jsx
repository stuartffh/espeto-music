import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useSuperAdminStore from '../store/superAdminStore';

function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { isAuthenticated, verificarToken } = useAuthStore();
  const { isAuthenticated: isSuperAdminAuthenticated, verificarToken: verificarTokenSuperAdmin } = useSuperAdminStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (requireSuperAdmin) {
        // Verificar token de Super Admin
        await verificarTokenSuperAdmin();
        setChecking(false);
        return;
      }

      // Verificação normal de Admin
      await verificarToken();
      setChecking(false);
    };
    checkAuth();
  }, [verificarToken, verificarTokenSuperAdmin, requireSuperAdmin]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-white text-xl">Verificando autenticação...</div>
      </div>
    );
  }

  // Verificação de Super Admin
  if (requireSuperAdmin) {
    if (!isSuperAdminAuthenticated) {
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
