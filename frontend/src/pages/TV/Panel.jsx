import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const sanitizeUrl = (url) => {
  if (!url) {
    return '';
  }

  try {
    const trimmed = url.trim();
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  } catch (error) {
    console.error('Erro ao sanitizar URL do backend:', error);
    return url;
  }
};

const detectBackendBaseUrl = () => {
  // Priorizar variável de ambiente
  const envUrl = sanitizeUrl(import.meta.env.VITE_API_URL);
  if (envUrl) {
    return envUrl;
  }

  // Fallback para detecção automática em desenvolvimento
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    if (!hostname) {
      return 'http://localhost:3000';
    }

    const normalizedProtocol = protocol || 'http:';
    const normalizedHostname = hostname === '[::]' ? 'localhost' : hostname;

    if (!port || port === '80' || port === '443') {
      return `${normalizedProtocol}//${normalizedHostname}`;
    }

    if (port === '3000') {
      return `${normalizedProtocol}//${normalizedHostname}:3000`;
    }

    return `${normalizedProtocol}//${normalizedHostname}:3000`;
  }

  return 'http://localhost:3000';
};

const detectSocketUrl = () => {
  const envUrl = sanitizeUrl(import.meta.env.VITE_WEBSOCKET_URL);

  if (envUrl) {
    return envUrl;
  }

  return detectBackendBaseUrl();
};

const API_URL = detectBackendBaseUrl();
const SOCKET_URL = detectSocketUrl();

console.log('🔍 [TV Frontend] Configuracao detectada:');
console.log('  - window.location.href:', window.location.href);
console.log('  - API_URL:', API_URL);
console.log('  - SOCKET_URL:', SOCKET_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

function Panel() {
  const [fila, setFila] = useState([]);
  const [socket, setSocket] = useState(null);
  const [estadoPlayer, setEstadoPlayer] = useState(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [autoplayConsent, setAutoplayConsent] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const handleVideoEnd = useCallback(() => {
    if (estadoPlayer?.musicaAtual && socket) {
      console.log('🔚 Finalizando música:', estadoPlayer.musicaAtual.id);
      socket.emit('musica:terminou', { pedidoId: estadoPlayer.musicaAtual.id });
    }
  }, [estadoPlayer?.musicaAtual, socket]);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
      // Enter fullscreen
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, []);

  // Conectar WebSocket e buscar dados iniciais
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    console.log('🔌 Conectando ao backend...');

    // Buscar fila inicial
    api.get('/api/musicas/fila')
      .then(res => {
        const filaFiltrada = res.data.filter(m => m.status !== 'tocando');
        console.log('📋 Fila:', filaFiltrada.length, 'músicas');
        setFila(filaFiltrada);
      })
      .catch(console.error);

    // Buscar estado do player
    api.get('/api/player/estado')
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

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const messageHandler = (event) => {
      const { type, autoplayConsent: consentValue } = event.data || {};

      switch (type) {
        case 'video-ended':
          handleVideoEnd();
          break;
        case 'player-ready':
          console.log('✅ Player da TV sinalizou que está pronto');
          setIframeReady(true);
          setAutoplayConsent(Boolean(consentValue));
          break;
        case 'autoplay-consent-changed':
          setAutoplayConsent(Boolean(event.data?.value));
          break;
        case 'player-autoplay-blocked':
          console.warn('⚠️ Player da TV sinalizou bloqueio de autoplay. Aguardando interação do usuário.');
          break;
        case 'player-autoplay-muted':
          console.warn('ℹ️ Player da TV iniciou reprodução sem áudio. Aguarde interação para ativar o som.');
          break;
        case 'toggle-fullscreen':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [handleVideoEnd, toggleFullscreen]);

  const sendVideoToIframe = useCallback((musica) => {
    if (!musica) {
      return;
    }

    const iframeWindow = videoRef.current?.contentWindow;

    if (!iframeWindow) {
      console.warn('ℹ️ Player da TV ainda não está pronto para receber vídeos.');
      return;
    }

    const videoUrl = `${API_URL}/api/stream/video/${musica.musicaYoutubeId}`;
    console.log('🎵 Enviando vídeo para o player:', videoUrl);

    iframeWindow.postMessage({
      type: 'load-video',
      url: videoUrl,
      format: 'mp4',
      autoplayConsent
    }, '*');
  }, [autoplayConsent]);

  useEffect(() => {
    if (!estadoPlayer?.musicaAtual) {
      return;
    }

    if (!iframeReady) {
      return;
    }

    sendVideoToIframe(estadoPlayer.musicaAtual);
  }, [estadoPlayer?.musicaAtual, iframeReady, sendVideoToIframe]);

  const proximaMusica = fila.length > 0 ? fila[0] : null;
  const musicaAtual = estadoPlayer?.musicaAtual;

  return (
    <div ref={containerRef} className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Área Principal - Player (Tela Cheia) */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Header - Tocando Agora */}
        <div className="absolute top-0 left-0 z-10 bg-gradient-to-br from-black/90 via-black/70 to-transparent p-3 md:p-4 pointer-events-none max-w-2xl">
          <div>
            <h2 className="text-sm md:text-lg font-bold mb-1 flex items-center gap-2 drop-shadow-2xl">
              <span className="text-lg md:text-2xl">🎵</span>
              Tocando Agora
            </h2>
            {musicaAtual ? (
              <div className="bg-white/10 backdrop-blur-md rounded-md p-2 md:p-3 border border-white/10 shadow-xl">
                <p className="text-base md:text-xl font-bold text-white drop-shadow-lg leading-tight truncate">
                  {musicaAtual.musicaTitulo}
                </p>
                <p className="text-xs md:text-sm text-purple-200 mt-0.5">
                  Pedido por: <span className="font-semibold text-yellow-300">{musicaAtual.nomeCliente || 'Anônimo'}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm md:text-base text-purple-300 drop-shadow-lg">Aguardando próxima música...</p>
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
              onLoad={() => {
                console.log('✅ Player da TV carregado');

                const iframeWindow = videoRef.current?.contentWindow;
                if (iframeWindow) {
                  iframeWindow.postMessage({ type: 'host-ready' }, '*');
                }
              }}
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

        {/* Logo Marca D'água */}
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 opacity-40 pointer-events-none">
          <p className="text-xl md:text-3xl font-bold text-white drop-shadow-2xl">Espeto Music</p>
          <p className="text-xs md:text-sm text-purple-300 drop-shadow-lg">Seu pedido, sua música!</p>
        </div>
      </div>
    </div>
  );
}

export default Panel;
