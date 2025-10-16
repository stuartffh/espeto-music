import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, Clock } from 'lucide-react';
import axios from 'axios';
import EqualizerAnimation from '../../components/EqualizerAnimation';

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
  const [configs, setConfigs] = useState({});
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const videoDescansoRef = useRef(null);

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

  // Buscar configurações do sistema
  useEffect(() => {
    api.get('/api/config')
      .then(res => {
        const configMap = {};
        res.data.forEach(config => {
          configMap[config.chave] = config.valor;
        });
        setConfigs(configMap);
        console.log('⚙️ Configurações carregadas:', configMap);

        // Aplicar favicon customizado
        if (configMap.FAVICON_URL) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = configMap.FAVICON_URL;
          document.getElementsByTagName('head')[0].appendChild(link);
        }

        // Aplicar título customizado
        if (configMap.NOME_ESTABELECIMENTO) {
          document.title = `${configMap.NOME_ESTABELECIMENTO} - TV`;
        }
      })
      .catch(console.error);
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

    // Backend manda pausar
    newSocket.on('player:pausar', (data) => {
      console.log('⏸️ Backend: Pausar música');
      setEstadoPlayer(data.estado);
      // Pausar o player no iframe
      const iframeWindow = videoRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'pause' }, '*');
      }
    });

    // Backend manda retomar
    newSocket.on('player:retomar', (data) => {
      console.log('▶️ Backend: Retomar música');
      setEstadoPlayer(data.estado);
      // Retomar o player no iframe
      const iframeWindow = videoRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'play' }, '*');
      }
    });

    // Backend manda parar
    newSocket.on('player:parar', (data) => {
      console.log('⏹️ Backend: Parar player');
      setEstadoPlayer(data.estado);
      // Parar o player no iframe
      const iframeWindow = videoRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'stop' }, '*');
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

    // ========== EVENTOS DE CONFIGURAÇÃO ==========

    newSocket.on('config:atualizada', (data) => {
      console.log(`🔄 Configuração atualizada: ${data.chave} = ${data.valor}`);
      setConfigs(prevConfigs => ({
        ...prevConfigs,
        [data.chave]: data.valor
      }));
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

  const musicaAtual = estadoPlayer?.musicaAtual;

  return (
    <div ref={containerRef} className="h-screen w-screen flex bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg text-white overflow-hidden">
      {/* Área Principal - Player */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Header - Tocando Agora */}
        <AnimatePresence>
          {musicaAtual && (
            <motion.div
              className="absolute top-0 left-0 z-20 glass p-4 md:p-6 m-4 md:m-6 pointer-events-none max-w-2xl rounded-xl neon-border shadow-neon-cyan"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-neon-cyan to-neon-purple p-2 rounded-lg">
                  <Music className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-sm md:text-lg font-bold gradient-text">
                    Tocando Agora
                  </h2>
                  <EqualizerAnimation />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-lg md:text-2xl font-bold text-white leading-tight">
                  {musicaAtual.musicaTitulo}
                </p>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                  <User className="w-4 h-4" />
                  <span>Pedido por:</span>
                  <span className="font-semibold text-neon-cyan">
                    {musicaAtual.nomeCliente || 'Anônimo'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player com Neon Border */}
        <div
          className="flex-1 bg-black flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage: configs.BACKGROUND_IMAGE_URL ? `url(${configs.BACKGROUND_IMAGE_URL})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay escuro para melhor legibilidade quando há imagem de fundo */}
          {configs.BACKGROUND_IMAGE_URL && (
            <div className="absolute inset-0 bg-black/50" />
          )}

          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-cyan/5 animate-pulse" />

          {musicaAtual ? (
            <div className="relative w-full h-full p-4 md:p-8">
              <div className="w-full h-full neon-border rounded-xl overflow-hidden shadow-neon-purple relative">
                {/* Animated border glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink opacity-20 blur-xl animate-glow-pulse" />

                <iframe
                  ref={videoRef}
                  src="/tv-player.html"
                  className="w-full h-full border-0 relative z-10 rounded-xl"
                  allow="autoplay; fullscreen"
                  onLoad={() => {
                    console.log('✅ Player da TV carregado');

                    const iframeWindow = videoRef.current?.contentWindow;
                    if (iframeWindow) {
                      iframeWindow.postMessage({ type: 'host-ready' }, '*');
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Vídeo de descanso em loop */}
              {configs.VIDEO_DESCANSO_ATIVO === 'true' && configs.VIDEO_DESCANSO_URL ? (
                <video
                  ref={videoDescansoRef}
                  src={configs.VIDEO_DESCANSO_URL}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={(e) => {
                    console.error('❌ Erro ao carregar vídeo de descanso:', e);
                    // Fallback para tela padrão
                    if (videoDescansoRef.current) {
                      videoDescansoRef.current.style.display = 'none';
                    }
                  }}
                />
              ) : null}

              {/* Tela de aguardo com animações */}
              <motion.div
                className="text-center px-4 relative z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {configs.LOGO_URL ? (
                  <motion.img
                    src={configs.LOGO_URL}
                    alt="Logo"
                    className="mx-auto mb-8 max-w-xs md:max-w-md max-h-48 object-contain drop-shadow-2xl"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <motion.div
                    className="text-8xl mb-8"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Music className="w-32 h-32 mx-auto text-neon-cyan" />
                  </motion.div>
                )}

                <h1 className="text-5xl md:text-8xl font-bold mb-6 gradient-text drop-shadow-lg animate-float">
                  {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
                </h1>

                <motion.div
                  className="glass rounded-xl p-6 md:p-8 max-w-2xl mx-auto neon-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Music className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-neon-purple" />
                  <p className="text-2xl md:text-4xl text-white mb-3 font-semibold">
                    Aguardando músicas...
                  </p>
                  <p className="text-base md:text-xl text-gray-300">
                    {configs.SLOGAN_ESTABELECIMENTO || 'Adicione músicas pelo celular para começar!'}
                  </p>
                </motion.div>

                {/* QR Code Placeholder */}
                <motion.div
                  className="mt-8 glass rounded-xl p-6 max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-sm md:text-base text-gray-400 mb-3">
                    Escaneie o QR Code para adicionar músicas
                  </p>
                  <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-white rounded-lg flex items-center justify-center animate-pulse">
                    <span className="text-gray-400 text-xs">QR Code</span>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </div>

        {/* Logo Marca D'água */}
        <motion.div
          className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 glass rounded-lg p-3 md:p-4 opacity-80"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-lg md:text-2xl font-bold gradient-text">
            {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
          </p>
          <p className="text-xs md:text-sm text-gray-300">
            {configs.SLOGAN_ESTABELECIMENTO || 'Seu pedido, sua música!'}
          </p>
        </motion.div>
      </div>

      {/* Sidebar da Fila - Apenas em telas grandes (>1280px) */}
      {fila.length > 0 && (
        <motion.div
          className="hidden xl:flex w-80 2xl:w-96 glass border-l border-dark-border p-6 flex-col gap-4 overflow-hidden"
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-neon-cyan to-neon-purple p-2 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-text">Próximas</h3>
              <p className="text-sm text-gray-400">{fila.length} música{fila.length > 1 ? 's' : ''} na fila</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            <AnimatePresence>
              {fila.map((musica, index) => (
                <motion.div
                  key={musica.id}
                  className="glass rounded-lg p-3 hover:bg-neon-cyan/5 transition"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate leading-tight">
                        {musica.musicaTitulo}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">
                          {musica.nomeCliente || 'Anônimo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Panel;
