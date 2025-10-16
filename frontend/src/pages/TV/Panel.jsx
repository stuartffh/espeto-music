import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, Clock, Play, Pause, SkipForward, Volume2, Maximize, Heart, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';
import socket from '../../services/socket';
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

// Formatar tempo (segundos -> MM:SS)
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function Panel() {
  const [fila, setFila] = useState([]);
  const [estadoPlayer, setEstadoPlayer] = useState(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [autoplayConsent, setAutoplayConsent] = useState(false);
  const [configs, setConfigs] = useState({});
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [showControls, setShowControls] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const videoDescansoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

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

  // Mostrar controles temporariamente
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
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

    // Buscar QR Code
    api.get('/qrcode')
      .then(res => {
        setQrCodeData(res.data);
      })
      .catch(console.error);
  }, []);

  // Monitorar conexão do socket
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Socket conectado');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket desconectado');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Conectar WebSocket e buscar dados iniciais
  useEffect(() => {
    console.log('🔌 Usando socket global compartilhado...');

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
        if (res.data.volume) {
          setVolume(res.data.volume);
        }
      })
      .catch(console.error);

    // ========== EVENTOS DO PLAYER (iframe TV Player) ==========

    // Backend manda iniciar/trocar música
    const handlePlayerIniciar = (data) => {
      console.log('▶️ Backend: Iniciar música', data.musica.musicaTitulo);
      setEstadoPlayer(data.estado);
      setCurrentTime(0);
      if (data.estado.musicaAtual?.musicaDuracao) {
        setDuration(data.estado.musicaAtual.musicaDuracao);
      }
    };

    // Backend manda pausar
    const handlePlayerPausar = (data) => {
      console.log('⏸️ Backend: Pausar música');
      setEstadoPlayer(data.estado);
      // Pausar o player no iframe
      const iframeWindow = videoRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'pause' }, '*');
      }
    };

    // Backend manda retomar
    const handlePlayerRetomar = (data) => {
      console.log('▶️ Backend: Retomar música');
      setEstadoPlayer(data.estado);
      // Retomar o player no iframe
      const iframeWindow = videoRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'play' }, '*');
      }
    };

    // Backend manda parar
    const handlePlayerParar = (data) => {
      console.log('⏹️ Backend: Parar player');
      setEstadoPlayer(data.estado);
      setCurrentTime(0);
      setDuration(0);
      // Parar o player no iframe
      const iframeWindow = videoRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'stop' }, '*');
      }
    };

    // ========== EVENTOS DA FILA ==========

    const handleFilaAtualizada = (novaFila) => {
      const filaFiltrada = novaFila.filter(m => m.status !== 'tocando');
      console.log('📋 Fila atualizada:', filaFiltrada.length, 'músicas');
      setFila(filaFiltrada);
    };

    const handleFilaVazia = () => {
      console.log('📭 Fila vazia');
      setFila([]);
    };

    // ========== EVENTOS DE CONFIGURAÇÃO ==========

    const handleConfigAtualizada = (data) => {
      console.log(`🔄 Configuração atualizada: ${data.chave} = ${data.valor}`);
      setConfigs(prevConfigs => ({
        ...prevConfigs,
        [data.chave]: data.valor
      }));
    };

    // Registrar event listeners
    socket.on('player:iniciar', handlePlayerIniciar);
    socket.on('player:pausar', handlePlayerPausar);
    socket.on('player:retomar', handlePlayerRetomar);
    socket.on('player:parar', handlePlayerParar);
    socket.on('fila:atualizada', handleFilaAtualizada);
    socket.on('fila:vazia', handleFilaVazia);
    socket.on('config:atualizada', handleConfigAtualizada);

    // Cleanup: remover event listeners quando componente desmontar
    return () => {
      socket.off('player:iniciar', handlePlayerIniciar);
      socket.off('player:pausar', handlePlayerPausar);
      socket.off('player:retomar', handlePlayerRetomar);
      socket.off('player:parar', handlePlayerParar);
      socket.off('fila:atualizada', handleFilaAtualizada);
      socket.off('fila:vazia', handleFilaVazia);
      socket.off('config:atualizada', handleConfigAtualizada);
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
        case 'time-update':
          if (event.data.currentTime !== undefined) {
            setCurrentTime(event.data.currentTime);
          }
          if (event.data.duration !== undefined && event.data.duration > 0) {
            setDuration(event.data.duration);
          }
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

  // Atualizar tempo atual a cada segundo quando tocando
  useEffect(() => {
    if (estadoPlayer?.status === 'playing') {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          return next <= duration ? next : duration;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [estadoPlayer?.status, duration]);

  const musicaAtual = estadoPlayer?.musicaAtual;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg text-white overflow-hidden"
      onMouseMove={showControlsTemporarily}
      onClick={showControlsTemporarily}
    >
      {/* Indicador de Conexão */}
      <motion.div
        className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full ${isConnected ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border backdrop-blur-sm`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">Conectado</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">Desconectado</span>
          </>
        )}
      </motion.div>

      {/* Área Principal - Player */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Header - Tocando Agora (Redesenhado) */}
        <AnimatePresence>
          {musicaAtual && (
            <motion.div
              className="absolute top-0 left-0 right-0 z-20 glass-heavy backdrop-blur-xl border-b border-white/10"
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-6">
                  {/* Info da música */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Thumbnail */}
                    {musicaAtual.musicaThumbnail && (
                      <motion.div
                        className="relative w-16 h-16 rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <img
                          src={musicaAtual.musicaThumbnail}
                          alt={musicaAtual.musicaTitulo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </motion.div>
                    )}

                    {/* Título e artista */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="bg-gradient-to-r from-neon-cyan to-neon-purple p-1.5 rounded-lg">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">
                          Tocando Agora
                        </span>
                        <EqualizerAnimation />
                      </div>
                      <h2 className="text-xl font-bold text-white truncate mb-1">
                        {musicaAtual.musicaTitulo}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="w-4 h-4" />
                        <span className="truncate">
                          {musicaAtual.nomeCliente || 'Anônimo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar e tempo */}
                  <div className="hidden md:flex flex-col items-end gap-2 w-48">
                    <div className="flex items-center gap-3 text-sm font-mono text-gray-300">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player com Controles Overlay */}
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
              <div className="w-full h-full neon-border-glow rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Animated border glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink opacity-30 blur-2xl animate-glow-pulse" />

                <iframe
                  ref={videoRef}
                  src="/tv-player.html"
                  className="w-full h-full border-0 relative z-10 rounded-2xl"
                  allow="autoplay; fullscreen"
                  onLoad={() => {
                    console.log('✅ Player da TV carregado');

                    const iframeWindow = videoRef.current?.contentWindow;
                    if (iframeWindow) {
                      iframeWindow.postMessage({ type: 'host-ready' }, '*');
                    }
                  }}
                />

                {/* Controles Overlay (aparece ao mover mouse) */}
                <AnimatePresence>
                  {showControls && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-20"
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Progress bar grande */}
                      <div className="mb-6 w-full">
                        <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden group cursor-pointer">
                          <motion.div
                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple relative"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm font-mono text-gray-300">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Controles */}
                      <div className="flex items-center justify-center gap-6">
                        <motion.button
                          className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart className="w-6 h-6" />
                        </motion.button>

                        <motion.button
                          className="p-6 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:shadow-neon-cyan transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {estadoPlayer?.status === 'playing' ? (
                            <Pause className="w-8 h-8" />
                          ) : (
                            <Play className="w-8 h-8" />
                          )}
                        </motion.button>

                        <motion.button
                          className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <SkipForward className="w-6 h-6" />
                        </motion.button>

                        <div className="flex items-center gap-3 ml-4">
                          <Volume2 className="w-5 h-5" />
                          <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white"
                              style={{ width: `${volume}%` }}
                            />
                          </div>
                        </div>

                        <motion.button
                          className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all ml-4"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={toggleFullscreen}
                        >
                          <Maximize className="w-6 h-6" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

              {/* Tela de aguardo com animações aprimoradas */}
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
                    className="mx-auto mb-12 max-w-xs md:max-w-md max-h-48 object-contain drop-shadow-2xl"
                    animate={{
                      y: [0, -20, 0],
                      filter: ['drop-shadow(0 10px 30px rgba(0, 255, 255, 0.3))', 'drop-shadow(0 20px 40px rgba(0, 255, 255, 0.5))', 'drop-shadow(0 10px 30px rgba(0, 255, 255, 0.3))']
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <motion.div
                    className="text-8xl mb-12"
                    animate={{
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Music className="w-40 h-40 mx-auto text-neon-cyan drop-shadow-neon" />
                  </motion.div>
                )}

                <h1 className="text-6xl md:text-9xl font-black mb-8 gradient-text drop-shadow-2xl animate-float">
                  {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
                </h1>

                <motion.div
                  className="glass-heavy rounded-2xl p-8 md:p-12 max-w-3xl mx-auto neon-border-glow mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="inline-block mb-6"
                  >
                    <Music className="w-24 h-24 text-neon-purple" />
                  </motion.div>
                  <p className="text-3xl md:text-5xl text-white mb-4 font-bold">
                    Aguardando músicas...
                  </p>
                  <p className="text-xl md:text-2xl text-gray-300">
                    {configs.SLOGAN_ESTABELECIMENTO || 'Adicione músicas pelo celular para começar!'}
                  </p>
                </motion.div>

                {/* QR Code Aprimorado */}
                {qrCodeData && (
                  <motion.div
                    className="mt-12 glass-heavy rounded-2xl p-8 max-w-md mx-auto neon-border"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-lg md:text-xl text-gray-300 mb-6 font-semibold">
                      Escaneie para adicionar músicas
                    </p>
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <img
                        src={qrCodeData.qrCode}
                        alt="QR Code"
                        className="w-48 h-48 md:w-56 md:h-56 mx-auto rounded-xl shadow-2xl"
                      />
                      <div className="absolute inset-0 rounded-xl border-4 border-neon-cyan opacity-50 blur-sm animate-pulse" />
                    </motion.div>
                    <p className="text-sm text-gray-400 mt-6">
                      {qrCodeData.url}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </div>

        {/* Footer - Stats e Logo */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-10 glass-heavy backdrop-blur-xl border-t border-white/10"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-black gradient-text">
                {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
              </p>
              <p className="text-sm text-gray-400">
                {configs.SLOGAN_ESTABELECIMENTO || 'Seu pedido, sua música!'}
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2 text-neon-cyan mb-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-2xl font-bold">{fila.length}</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Na Fila</p>
              </div>

              {musicaAtual && (
                <div className="text-center">
                  <div className="flex items-center gap-2 text-neon-purple mb-1">
                    <Music className="w-5 h-5" />
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Tocando</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sidebar da Fila - Redesenhada e mais sofisticada */}
      {fila.length > 0 && (
        <motion.div
          className="hidden xl:flex w-96 2xl:w-[28rem] glass-heavy border-l border-white/10 flex-col overflow-hidden"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          {/* Header da fila */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-neon-cyan to-neon-purple p-3 rounded-xl">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black gradient-text">Próximas</h3>
                <p className="text-sm text-gray-400">
                  {fila.length} música{fila.length > 1 ? 's' : ''} aguardando
                </p>
              </div>
            </div>
          </div>

          {/* Lista da fila */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {fila.map((musica, index) => (
                <motion.div
                  key={musica.id}
                  className="glass rounded-xl p-4 hover:bg-white/5 transition-all group"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Posição */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-black text-lg shadow-lg">
                      {index + 1}
                    </div>

                    {/* Thumbnail (se disponível) */}
                    {musica.musicaThumbnail && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={musica.musicaThumbnail}
                          alt={musica.musicaTitulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate leading-tight mb-2 group-hover:text-neon-cyan transition-colors">
                        {musica.musicaTitulo}
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">
                          {musica.nomeCliente || 'Anônimo'}
                        </p>
                      </div>
                      {musica.musicaDuracao && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <p className="text-xs text-gray-500 font-mono">
                            {formatTime(musica.musicaDuracao)}
                          </p>
                        </div>
                      )}
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
