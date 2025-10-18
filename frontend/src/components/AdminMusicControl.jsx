import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Music, Search, X, ExternalLink, List } from 'lucide-react';
import axios from 'axios';
import socket from '../services/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

/**
 * AdminMusicControl - Controle de música ambiente para administradores
 *
 * Permite que admins busquem músicas no YouTube, adicionem URLs/playlists
 * e toquem música na TV durante períodos de descanso (fila vazia)
 */
function AdminMusicControl({ token }) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [musicaAtual, setMusicaAtual] = useState(null);
  const [fila, setFila] = useState([]);
  const [mostrandoBusca, setMostrandoBusca] = useState(false);
  const [urlDireta, setUrlDireta] = useState('');

  // Buscar estado inicial
  useEffect(() => {
    buscarEstadoPlayer();
    buscarFila();

    // Escutar eventos do socket
    socket.on('fila:atualizada', handleFilaAtualizada);
    socket.on('player:iniciar', handlePlayerIniciar);
    socket.on('player:parar', handlePlayerParar);

    return () => {
      socket.off('fila:atualizada', handleFilaAtualizada);
      socket.off('player:iniciar', handlePlayerIniciar);
      socket.off('player:parar', handlePlayerParar);
    };
  }, []);

  const buscarEstadoPlayer = async () => {
    try {
      const res = await api.get('/api/player/estado');
      if (res.data?.musicaAtual) {
        setMusicaAtual(res.data.musicaAtual);
      }
    } catch (error) {
      console.error('Erro ao buscar estado do player:', error);
    }
  };

  const buscarFila = async () => {
    try {
      const res = await api.get('/api/musicas/fila');
      setFila(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
    }
  };

  const handleFilaAtualizada = (novaFila) => {
    setFila(novaFila || []);
  };

  const handlePlayerIniciar = (data) => {
    if (data?.musica) {
      setMusicaAtual(data.musica);
    }
  };

  const handlePlayerParar = () => {
    setMusicaAtual(null);
  };

  const buscarMusicas = async (e) => {
    e?.preventDefault();
    if (!busca.trim()) return;

    setLoading(true);
    try {
      const res = await api.get('/api/musicas/buscar', {
        params: { q: busca, maxResults: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setResultados(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
      alert('Erro ao buscar músicas no YouTube');
    } finally {
      setLoading(false);
    }
  };

  const extrairYoutubeId = (url) => {
    // Suporta formatos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/ // ID direto
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const adicionarPorUrl = async () => {
    if (!urlDireta.trim()) {
      alert('Por favor, insira uma URL ou ID do YouTube');
      return;
    }

    const youtubeId = extrairYoutubeId(urlDireta);
    if (!youtubeId) {
      alert('URL inválida. Use o formato: youtube.com/watch?v=ID ou youtu.be/ID');
      return;
    }

    try {
      // Buscar detalhes do vídeo
      const res = await api.get('/api/musicas/detalhes', {
        params: { videoId: youtubeId },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        await tocarMusica(res.data);
        setUrlDireta('');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do vídeo:', error);
      alert('Erro ao buscar vídeo. Verifique se o ID/URL está correto.');
    }
  };

  const tocarMusica = async (musica) => {
    try {
      // Criar pedido especial "admin" no modo gratuito
      const res = await api.post('/api/musicas/admin-play', {
        youtubeId: musica.id,
        titulo: musica.titulo,
        thumbnail: musica.thumbnail,
        duracao: musica.duracao
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMostrandoBusca(false);
      alert('Música adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar música:', error);
      alert(error.response?.data?.erro || 'Erro ao adicionar música');
    }
  };

  const pularMusica = async () => {
    if (!musicaAtual) return;

    try {
      await api.post('/api/player/pular', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Erro ao pular música:', error);
      alert('Erro ao pular música');
    }
  };

  const filaClientes = fila.filter(m => m.status === 'pago');
  const temFilaClientes = filaClientes.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Controle de Música Ambiente
          </h2>
        </div>
        <button
          onClick={() => setMostrandoBusca(!mostrandoBusca)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          {mostrandoBusca ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          {mostrandoBusca ? 'Fechar' : 'Buscar Música'}
        </button>
      </div>

      {/* Status Atual */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {musicaAtual ? (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tocando agora:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{musicaAtual.musicaTitulo}</p>
                {musicaAtual.nomeCliente && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pedido por: {musicaAtual.nomeCliente}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma música tocando</p>
            )}
          </div>
          {musicaAtual && (
            <button
              onClick={pularMusica}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Pular
            </button>
          )}
        </div>

        {temFilaClientes && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <List className="w-4 h-4" />
              <span>
                {filaClientes.length} música(s) de clientes na fila
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Músicas de admin só tocam quando a fila de clientes está vazia
            </p>
          </div>
        )}
      </div>

      {/* Modal de Busca */}
      <AnimatePresence>
        {mostrandoBusca && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {/* Busca por Texto */}
              <form onSubmit={buscarMusicas} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar no YouTube
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Nome da música ou artista..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={loading || !busca.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                </div>
              </form>

              {/* URL Direta */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adicionar por URL ou ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlDireta}
                    onChange={(e) => setUrlDireta(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... ou ID do vídeo"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={adicionarPorUrl}
                    disabled={!urlDireta.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cole a URL completa do YouTube ou apenas o ID do vídeo
                </p>
              </div>

              {/* Resultados da Busca */}
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Buscando...</p>
                </div>
              )}

              {!loading && resultados.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Resultados ({resultados.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {resultados.map((musica) => (
                      <div
                        key={musica.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <img
                          src={musica.thumbnail}
                          alt={musica.titulo}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {musica.titulo}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {musica.canal}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {Math.floor(musica.duracao / 60)}:{String(musica.duracao % 60).padStart(2, '0')}
                          </p>
                        </div>
                        <button
                          onClick={() => tocarMusica(musica)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                        >
                          <Play className="w-4 h-4" />
                          Tocar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && resultados.length === 0 && busca && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminMusicControl;
