import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * MULTI-TENANT: Configuração de slug do estabelecimento
 * Este valor será automaticamente incluído em todas as requisições
 */
let currentSlug = null;
let currentCodigo = null;

/**
 * Define o slug do estabelecimento para as requisições
 * @param {string} slug - Slug do estabelecimento
 */
export const setTenantSlug = (slug) => {
  currentSlug = slug;
  console.log('🏢 [API] Tenant slug definido:', slug);
};

/**
 * Define o código do estabelecimento para as requisições
 * @param {string} codigo - Código do estabelecimento
 */
export const setTenantCodigo = (codigo) => {
  currentCodigo = codigo;
  console.log('🔑 [API] Tenant código definido:', codigo);
};

/**
 * Limpa os dados do tenant
 */
export const clearTenant = () => {
  currentSlug = null;
  currentCodigo = null;
  console.log('🧹 [API] Tenant limpo');
};

// Interceptor de requisição: adiciona tenant em todas as chamadas
api.interceptors.request.use(
  (config) => {
    // Adicionar slug como header (se disponível)
    if (currentSlug) {
      config.headers['X-Estabelecimento-Slug'] = currentSlug;
    }

    // Adicionar código como header (se disponível)
    if (currentCodigo) {
      config.headers['X-Estabelecimento-Codigo'] = currentCodigo;
    }

    // Adicionar slug como query parameter também (para maior compatibilidade)
    if (currentSlug && !config.params?.slug) {
      config.params = {
        ...config.params,
        slug: currentSlug,
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta: tratar erros multi-tenant
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400) {
      const message = error.response?.data?.erro || error.response?.data?.error;
      if (message?.includes('Estabelecimento não identificado')) {
        console.error('❌ [API] Estabelecimento não identificado. Verifique o slug/código.');
      }
    }
    return Promise.reject(error);
  }
);

// Músicas
export const buscarMusicas = (query) => api.get(`/musicas/buscar?q=${encodeURIComponent(query)}`);
export const criarPedidoMusica = (dados) => api.post('/musicas', dados);
export const buscarFila = () => api.get('/musicas/fila');
export const buscarMusicaAtual = () => api.get('/musicas/atual');

// Pagamentos
export const criarPagamento = (pedidoId) => api.post('/pagamentos', { pedidoId });
export const criarPagamentoPix = (pedidoId, dadosPagador) => api.post('/pagamentos/pix', {
  pedidoId,
  ...dadosPagador
});

// Carrinho
export const carrinho = {
  listar: () => api.get('/carrinho'),
  adicionar: (musica) => api.post('/carrinho', musica),
  remover: (youtubeId) => api.delete(`/carrinho/${youtubeId}`),
  limpar: () => api.delete('/carrinho'),
  definirNome: (nomeCliente) => api.patch('/carrinho/nome', { nomeCliente }),
  finalizar: (dadosPagador) => api.post('/pagamentos/carrinho', dadosPagador),
};

// Gift Cards (Public)
export const validarGiftCard = (codigo) => api.get(`/public/gifts/validar/${codigo}`);
export const usarGiftCard = (codigo, pedidoMusicaId, nomeCliente) =>
  api.post('/public/gifts/usar', { codigo, pedidoMusicaId, nomeCliente });
export const usarGiftCardCarrinho = (dados) =>
  api.post('/public/gifts/usar-carrinho', dados);

// Gift Cards (Admin)
export const listarGiftCards = (token) =>
  api.get('/gifts', { headers: { Authorization: `Bearer ${token}` } });
export const criarGiftCard = (dados, token) =>
  api.post('/gifts', dados, { headers: { Authorization: `Bearer ${token}` } });
export const deletarGiftCard = (id, token) =>
  api.delete(`/gifts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
export const desativarGiftCard = (id, token) =>
  api.patch(`/gifts/${id}/desativar`, {}, { headers: { Authorization: `Bearer ${token}` } });

export default api;
