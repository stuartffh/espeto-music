import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('admin_token') || null,
  admin: null,
  isAuthenticated: !!localStorage.getItem('admin_token'),
  loading: false,
  error: null,

  // Login
  login: async (username, password, slug) => {
    set({ loading: true, error: null });
    try {
      // MULTI-TENANT: Enviar slug no header x-tenant-slug
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      }, {
        headers: {
          'x-tenant-slug': slug
        }
      });

      const { token, admin } = response.data;

      localStorage.setItem('admin_token', token);

      // MULTI-TENANT: Salvar dados do estabelecimento no TenantContext
      if (admin.estabelecimento) {
        const tenantData = {
          slug: admin.estabelecimento.slug,
          estabelecimentoId: admin.estabelecimento.id,
          nome: admin.estabelecimento.nome,
          codigo: admin.estabelecimento.codigo,
        };
        localStorage.setItem('tenantData', JSON.stringify(tenantData));
      }

      set({
        token,
        admin,
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
    localStorage.removeItem('admin_token');
    set({
      token: null,
      admin: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Verificar token
  verificarToken: async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      set({ isAuthenticated: false });
      return false;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/verificar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { admin } = response.data;

      // MULTI-TENANT: Salvar dados do estabelecimento no TenantContext
      if (admin.estabelecimento) {
        const tenantData = {
          slug: admin.estabelecimento.slug,
          estabelecimentoId: admin.estabelecimento.id,
          nome: admin.estabelecimento.nome,
          codigo: admin.estabelecimento.codigo,
        };
        localStorage.setItem('tenantData', JSON.stringify(tenantData));
      }

      set({
        admin,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      localStorage.removeItem('admin_token');
      set({
        token: null,
        admin: null,
        isAuthenticated: false,
      });
      return false;
    }
  },

  // Limpar erro
  clearError: () => set({ error: null }),
}));

export { useAuthStore };
export default useAuthStore;
