import { create } from 'zustand';
import { carrinho as carrinhoAPI } from '../services/api';

const useCarrinhoStore = create((set, get) => ({
  // Estado
  carrinho: null,
  loading: false,
  error: null,
  isOpen: false,

  // Ações
  setCarrinho: (carrinho) => set({ carrinho }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsOpen: (isOpen) => set({ isOpen }),

  // Carregar carrinho
  carregarCarrinho: async () => {
    try {
      set({ loading: true, error: null });
      const response = await carrinhoAPI.listar();
      set({ carrinho: response.data.carrinho, loading: false });
      return response.data.carrinho;
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      set({ error: error.response?.data?.error || 'Erro ao carregar carrinho', loading: false });
      return null;
    }
  },

  // Adicionar música ao carrinho
  adicionarMusica: async (musica) => {
    try {
      set({ loading: true, error: null });
      const response = await carrinhoAPI.adicionar({
        titulo: musica.titulo,
        youtubeId: musica.youtubeId,
        thumbnail: musica.thumbnail,
        duracao: musica.duracao,
        valor: musica.valor || 5.0,
      });
      set({ carrinho: response.data.carrinho, loading: false, isOpen: true });
      return { success: true, data: response.data.carrinho };
    } catch (error) {
      console.error('Erro ao adicionar música ao carrinho:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao adicionar música ao carrinho';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Remover música do carrinho
  removerMusica: async (youtubeId) => {
    try {
      set({ loading: true, error: null });
      const response = await carrinhoAPI.remover(youtubeId);
      set({ carrinho: response.data.carrinho, loading: false });
      return { success: true, data: response.data.carrinho };
    } catch (error) {
      console.error('Erro ao remover música do carrinho:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao remover música do carrinho';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Limpar carrinho
  limparCarrinho: async () => {
    try {
      set({ loading: true, error: null });
      const response = await carrinhoAPI.limpar();
      set({ carrinho: response.data.carrinho, loading: false });
      return { success: true, data: response.data.carrinho };
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao limpar carrinho';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Definir nome do cliente
  definirNomeCliente: async (nomeCliente) => {
    try {
      set({ loading: true, error: null });
      const response = await carrinhoAPI.definirNome(nomeCliente);
      set({ carrinho: response.data.carrinho, loading: false });
      return { success: true, data: response.data.carrinho };
    } catch (error) {
      console.error('Erro ao definir nome do cliente:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao definir nome do cliente';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Finalizar carrinho (criar pagamento)
  finalizarCarrinho: async (dadosPagador = {}) => {
    try {
      set({ loading: true, error: null });
      const response = await carrinhoAPI.finalizar(dadosPagador);

      // Limpar carrinho local após finalização
      set({ carrinho: null, loading: false, isOpen: false });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erro ao finalizar carrinho:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao finalizar carrinho';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Abrir/fechar modal do carrinho
  abrirCarrinho: () => set({ isOpen: true }),
  fecharCarrinho: () => set({ isOpen: false }),
  toggleCarrinho: () => set((state) => ({ isOpen: !state.isOpen })),

  // Computed values
  getQuantidadeItens: () => {
    const { carrinho } = get();
    return carrinho?.quantidadeItens || 0;
  },

  getValorTotal: () => {
    const { carrinho } = get();
    return carrinho?.valorTotal || 0;
  },

  isCarrinhoVazio: () => {
    const { carrinho } = get();
    return !carrinho || carrinho.quantidadeItens === 0;
  },

  // Limpar erro
  limparErro: () => set({ error: null }),
}));

export default useCarrinhoStore;
