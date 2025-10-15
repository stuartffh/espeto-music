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

export default api;
