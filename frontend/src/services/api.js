import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
