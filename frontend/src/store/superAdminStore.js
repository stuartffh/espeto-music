import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const useSuperAdminStore = create((set) => ({
  token: localStorage.getItem('superadmin_token') || null,
  superAdmin: null,
  isAuthenticated: !!localStorage.getItem('superadmin_token'),
  loading: false,
  error: null,

  // Login
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/super-admin/login`, {
        username,
        password,
      });

      const { token, superAdmin } = response.data;

      localStorage.setItem('superadmin_token', token);
      set({
        token,
        superAdmin,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.erro || 'Erro ao fazer login';
      set({
        loading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      return false;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('superadmin_token');
    set({
      token: null,
      superAdmin: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Verificar token
  verificarToken: async () => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      set({ isAuthenticated: false });
      return false;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/super-admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set({
        superAdmin: response.data.superAdmin,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      localStorage.removeItem('superadmin_token');
      set({
        token: null,
        superAdmin: null,
        isAuthenticated: false,
      });
      return false;
    }
  },

  // Limpar erro
  clearError: () => set({ error: null }),
}));

export { useSuperAdminStore };
export default useSuperAdminStore;
