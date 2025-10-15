import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [fila, setFila] = useState([]);
  const [socket, setSocket] = useState(null);
  const [estadoPlayer, setEstadoPlayer] = useState(null);
  const videoRef = useRef(null);

  // Conectar WebSocket e buscar dados iniciais
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    console.log('🔌 Conectando ao backend...');

    // Buscar fila inicial
    axios.get(`${API_URL}/api/musicas/fila`)
      .then(res => {
        const filaFiltrada = res.data.filter(m => m.status !== 'tocando');
        console.log('📋 Fila:', filaFiltrada.length, 'músicas');
        setFila(filaFiltrada);
      })
      .catch(console.error);

    // Buscar estado do player
    axios.get(`${API_URL}/api/player/estado`)
      .then(res => {
        console.log('🎮 Estado do player:', res.data);
        setEstadoPlayer(res.data);
      })
      .catch(console.error);

    // ========== EVENTOS DO PLAYER (iframe TV Player) ==========

    // Backend manda iniciar/trocar música
    newSocket.on('player:iniciar', (data) => {
      console.log('▶️ Backend: Iniciar música', data.musica.musicaTitulo);
      setEstadoPlayer(data.estado);

      if (videoRef.current) {
        const videoUrl = `${API_URL}/api/stream/video/${data.musica.musicaYoutubeId}`;
        console.log('🎵 Carregando vídeo:', videoUrl);

        // Enviar mensagem para o player dentro do iframe
        videoRef.current.contentWindow.postMessage({
          type: 'load-video',
          url: videoUrl,
          format: 'mp4'
        }, '*');
      }
    });

    // Listener para mensagens do player (quando vídeo termina)
    window.addEventListener('message', (event) => {
      if (event.data.type === 'video-ended') {
        handleVideoEnd();
      }
    });

    // ========== EVENTOS DA FILA ==========

    newSocket.on('fila:atualizada', (novaFila) => {
      const filaFiltrada = novaFila.filter(m => m.status !== 'tocando');
      console.log('📋 Fila atualizada:', filaFiltrada.length, 'músicas');
      setFila(filaFiltrada);
    });

    newSocket.on('fila:vazia', () => {
      console.log('📭 Fila vazia');
      setFila([]);
    });

    return () => newSocket.close();
  }, []);

  const handleVideoEnd = () => {
    if (estadoPlayer?.musicaAtual && socket) {
      console.log('🔚 Finalizando música:', estadoPlayer.musicaAtual.id);
      socket.emit('musica:terminou', { pedidoId: estadoPlayer.musicaAtual.id });
    }
  };

  const proximaMusica = fila.length > 0 ? fila[0] : null;
  const musicaAtual = estadoPlayer?.musicaAtual;

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-black text-white overflow-hidden">
      {/* Sidebar - Fila de Músicas */}
      <div className="w-full md:w-80 lg:w-96 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col shadow-2xl border-r border-purple-700/30">
        {/* Header da Fila */}
        <div className="p-4 md:p-6 bg-black/30 backdrop-blur-sm border-b border-purple-700/30">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <span className="text-3xl md:text-4xl">🎵</span>
            Próximas Músicas
          </h1>
          <p className="text-purple-200 text-sm mt-2">
            {fila.length} {fila.length === 1 ? 'música' : 'músicas'} na fila
          </p>
        </div>

        {/* Lista de Músicas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {fila.length === 0 ? (
            <div className="text-center text-purple-300 py-12">
              <div className="text-6xl mb-4 animate-bounce">🎼</div>
              <p className="text-xl font-semibold">Nenhuma música na fila</p>
              <p className="text-sm opacity-75 mt-2">Aguardando pedidos...</p>
            </div>
          ) : (
            fila.map((pedido, index) => (
              <div
                key={pedido.id}
                className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 transition-all duration-300 ${
                  index === 0 ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-yellow-400 text-black shadow-lg' : 'bg-purple-600 text-white'
                  }`}>
                    #{index + 1}
                  </div>
                </div>
                <img
                  src={pedido.musicaThumbnail}
                  alt=""
                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate leading-tight">{pedido.musicaTitulo}</p>
                  <p className="text-xs md:text-sm text-purple-200 truncate mt-1">
                    Por: <span className="text-yellow-300">{pedido.nomeCliente || 'Anônimo'}</span>
                  </p>
                  {index === 0 && (
                    <span className="inline-block mt-1 px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full shadow-md">
                      PRÓXIMA
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área Principal - Player */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Header - Tocando Agora */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/95 via-black/75 to-transparent p-4 md:p-6 pointer-events-none">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 flex items-center gap-3 drop-shadow-2xl">
              <span className="text-3xl md:text-5xl animate-pulse">🎵</span>
              Tocando Agora
            </h2>
            {musicaAtual ? (
              <div className="bg-white/15 backdrop-blur-lg rounded-lg p-3 md:p-4 inline-block border border-white/10 shadow-2xl max-w-full">
                <p className="text-lg md:text-3xl font-bold text-white drop-shadow-2xl leading-tight truncate">
                  {musicaAtual.musicaTitulo}
                </p>
                <p className="text-sm md:text-xl text-purple-200 mt-1">
                  Pedido por: <span className="font-semibold text-yellow-300">{musicaAtual.nomeCliente || 'Anônimo'}</span>
                </p>
              </div>
            ) : (
              <p className="text-lg md:text-2xl text-purple-300 drop-shadow-lg">Aguardando próxima música...</p>
            )}
          </div>
        </div>

        {/* Player otimizado para TV */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {musicaAtual ? (
            <iframe
              ref={videoRef}
              src="/tv-player.html"
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
            />
          ) : (
            <div className="text-center px-4 animate-fade-in">
              <div className="text-8xl mb-6 animate-bounce">🎸</div>
              <p className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Espeto Music
              </p>
              <p className="text-2xl md:text-4xl text-gray-400 mb-3">
                Aguardando músicas...
              </p>
              <p className="text-base md:text-xl text-gray-500">
                Adicione músicas pelo celular para começar!
              </p>
            </div>
          )}
        </div>

        {/* Overlay - Próxima Música */}
        {proximaMusica && musicaAtual && (
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 pointer-events-none max-w-xs md:max-w-md">
            <div className="bg-gradient-to-r from-purple-600/95 via-pink-600/95 to-purple-600/95 backdrop-blur-lg rounded-lg shadow-2xl p-3 md:p-4 border-2 border-yellow-400/50">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider mb-1 text-yellow-300 drop-shadow-lg">
                ⏭️ Próxima
              </p>
              <p className="font-bold text-sm md:text-lg text-white line-clamp-2 drop-shadow-lg leading-tight">
                {proximaMusica.musicaTitulo}
              </p>
              <p className="text-xs md:text-sm text-white/90 mt-1 truncate">
                Por: <span className="text-yellow-300">{proximaMusica.nomeCliente || 'Anônimo'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Logo Marca D'água */}
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 opacity-40 pointer-events-none">
          <p className="text-xl md:text-3xl font-bold text-white drop-shadow-2xl">Espeto Music</p>
          <p className="text-xs md:text-sm text-purple-300 drop-shadow-lg">Seu pedido, sua música!</p>
        </div>
      </div>
    </div>
  );
}

export default App;
