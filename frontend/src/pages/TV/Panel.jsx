import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, Clock, Play, Pause, SkipForward, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
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
  const [muted, setMuted] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [focusedButton, setFocusedButton] = useState(0); // 0: Play/Pause, 1: Skip, 2: Volume-, 3: Volume+, 4: Mute

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const videoDescansoRef = useRef(null);

  // 🧹 LIMPEZA AUTOMÁTICA: Sempre começar com conexão limpa na TV
  useEffect(() => {
    console.log('🧹 [TV] Limpando cookies e storage para conexão limpa...');

    // Limpar todos os cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Limpar localStorage
    try {
      localStorage.clear();
      console.log('✅ [TV] localStorage limpo');
    } catch (e) {
      console.warn('⚠️  [TV] Não foi possível limpar localStorage:', e);
    }

    // Limpar sessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ [TV] sessionStorage limpo');
    } catch (e) {
      console.warn('⚠️  [TV] Não foi possível limpar sessionStorage:', e);
    }

    // Limpar IndexedDB (se houver)
    try {
      if (window.indexedDB) {
        window.indexedDB.databases().then((dbs) => {
          dbs.forEach((db) => {
            window.indexedDB.deleteDatabase(db.name);
          });
        });
        console.log('✅ [TV] IndexedDB limpo');
      }
    } catch (e) {
      console.warn('⚠️  [TV] Não foi possível limpar IndexedDB:', e);
    }

    console.log('✅ [TV] Conexão limpa estabelecida - sem cookies, sem cache');
  }, []); // Executa apenas uma vez ao montar

  const handleVideoEnd = useCallback(() => {
    if (estadoPlayer?.musicaAtual && socket) {
      console.log('🔚 Finalizando música:', estadoPlayer.musicaAtual.id);
      socket.emit('musica:terminou', { pedidoId: estadoPlayer.musicaAtual.id });
    }
  }, [estadoPlayer?.musicaAtual, socket]);

  // Funções de controle do player
  const handlePlayPause = useCallback(async () => {
    try {
      if (estadoPlayer?.status === 'playing') {
        await api.post('/api/player/pause');
        console.log('⏸️ Pausando player');
      } else {
        await api.post('/api/player/play');
        console.log('▶️ Iniciando player');
      }
    } catch (err) {
      console.error('Erro ao controlar player:', err);
    }
  }, [estadoPlayer?.status]);

  const handleSkip = useCallback(async () => {
    try {
      await api.post('/api/player/skip');
      console.log('⏭️ Pulando música');
    } catch (err) {
      console.error('Erro ao pular música:', err);
    }
  }, []);

  const handleVolumeUp = useCallback(() => {
    const newVolume = Math.min(100, volume + 10);
    setVolume(newVolume);
    const iframeWindow = videoRef.current?.contentWindow;
    if (iframeWindow) {
      iframeWindow.postMessage({ type: 'set-volume', volume: newVolume / 100 }, '*');
    }
    console.log('🔊 Volume:', newVolume);
  }, [volume]);

  const handleVolumeDown = useCallback(() => {
    const newVolume = Math.max(0, volume - 10);
    setVolume(newVolume);
    const iframeWindow = videoRef.current?.contentWindow;
    if (iframeWindow) {
      iframeWindow.postMessage({ type: 'set-volume', volume: newVolume / 100 }, '*');
    }
    console.log('🔉 Volume:', newVolume);
  }, [volume]);

  const handleToggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    const iframeWindow = videoRef.current?.contentWindow;
    if (iframeWindow) {
      iframeWindow.postMessage({ type: 'set-muted', muted: newMuted }, '*');
    }
    console.log(newMuted ? '🔇 Mutado' : '🔊 Desmutado');
  }, [muted]);

  // Navegação por teclado (controle remoto da TV)
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedButton((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedButton((prev) => Math.min(4, prev + 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Executar ação do botão focado
          switch (focusedButton) {
            case 0:
              handlePlayPause();
              break;
            case 1:
              handleSkip();
              break;
            case 2:
              handleVolumeDown();
              break;
            case 3:
              handleVolumeUp();
              break;
            case 4:
              handleToggleMute();
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedButton, handlePlayPause, handleSkip, handleVolumeDown, handleVolumeUp, handleToggleMute]);

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
  }, [handleVideoEnd]);

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
      className="h-screen w-screen flex flex-col bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg text-white overflow-hidden"
    >
      {/* Header - Indicador de Conexão e Info da Música */}
      <div className="flex-shrink-0 glass-heavy backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Info da música atual */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {musicaAtual ? (
              <>
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
                  </motion.div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                    <span className="text-xs font-semibold text-neon-cyan uppercase">Tocando Agora</span>
                    <EqualizerAnimation />
                  </div>
                  <h2 className="text-lg font-bold text-white truncate">{musicaAtual.musicaTitulo}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User className="w-3 h-3" />
                    <span className="truncate">{musicaAtual.nomeCliente || 'Anônimo'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-neon-purple" />
                <div>
                  <h2 className="text-lg font-bold gradient-text">
                    {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
                  </h2>
                  <p className="text-sm text-gray-400">Aguardando músicas...</p>
                </div>
              </div>
            )}
          </div>

          {/* Conexão e Stats */}
          <div className="flex items-center gap-4">
            {/* Fila */}
            <div className="text-center px-4 py-2 glass rounded-xl">
              <div className="flex items-center gap-2 text-neon-cyan mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xl font-bold">{fila.length}</span>
              </div>
              <p className="text-xs text-gray-400 uppercase">Na Fila</p>
            </div>

            {/* Status de conexão */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isConnected ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        {musicaAtual && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
              <span>{formatTime(currentTime)}</span>
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
        )}
      </div>

      {/* Player Area - Maior e centralizado */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden min-h-0">
        {/* Background */}
        {configs.BACKGROUND_IMAGE_URL && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${configs.BACKGROUND_IMAGE_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)',
                transform: 'scale(1.1)'
              }}
            />
            <div className="absolute inset-0 bg-black/70" />
          </>
        )}

        {musicaAtual ? (
          <div className="relative w-full h-full max-w-7xl mx-auto p-8">
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-neon-cyan/30">
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
            </div>
          </div>
        ) : (
          <>
            {/* Vídeo de descanso */}
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
                  if (videoDescansoRef.current) {
                    videoDescansoRef.current.style.display = 'none';
                  }
                }}
              />
            ) : null}

            {/* Tela de aguardo */}
            <motion.div
              className="text-center px-8 relative z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {configs.LOGO_URL ? (
                <motion.img
                  src={configs.LOGO_URL}
                  alt="Logo"
                  className="mx-auto mb-8 max-w-md max-h-48 object-contain drop-shadow-2xl"
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              ) : (
                <Music className="w-40 h-40 mx-auto text-neon-cyan mb-8" />
              )}

              <h1 className="text-7xl font-black mb-6 gradient-text">
                {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
              </h1>

              <motion.div
                className="glass-heavy rounded-2xl p-8 max-w-2xl mx-auto neon-border mb-8"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Music className="w-20 h-20 mx-auto text-neon-purple mb-4" />
                <p className="text-3xl text-white mb-2 font-bold">Aguardando músicas...</p>
                <p className="text-xl text-gray-300">
                  {configs.SLOGAN_ESTABELECIMENTO || 'Escaneie o QR Code para adicionar!'}
                </p>
              </motion.div>

              {/* QR Code */}
              {qrCodeData && (
                <motion.div
                  className="glass-heavy rounded-2xl p-6 max-w-sm mx-auto neon-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-300 mb-4 font-semibold">Escaneie para adicionar</p>
                  <img
                    src={qrCodeData.qrCode}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto rounded-xl shadow-2xl"
                  />
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Footer - Controles SEMPRE VISÍVEIS para navegação por controle remoto */}
      <div className="flex-shrink-0 glass-heavy backdrop-blur-xl border-t border-white/10 p-6">
        <div className="flex items-center justify-center gap-6">
          {/* Play/Pause */}
          <motion.button
            onClick={handlePlayPause}
            className={`p-8 rounded-2xl transition-all ${
              focusedButton === 0
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_30px_rgba(0,245,255,0.6)] scale-110'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            whileHover={{ scale: focusedButton === 0 ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!musicaAtual}
          >
            {estadoPlayer?.status === 'playing' ? (
              <Pause className="w-12 h-12" />
            ) : (
              <Play className="w-12 h-12" />
            )}
          </motion.button>

          {/* Skip */}
          <motion.button
            onClick={handleSkip}
            className={`p-8 rounded-2xl transition-all ${
              focusedButton === 1
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_30px_rgba(0,245,255,0.6)] scale-110'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            whileHover={{ scale: focusedButton === 1 ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!musicaAtual}
          >
            <SkipForward className="w-12 h-12" />
          </motion.button>

          {/* Divisor */}
          <div className="w-px h-16 bg-white/20 mx-4" />

          {/* Volume Down */}
          <motion.button
            onClick={handleVolumeDown}
            className={`p-6 rounded-2xl transition-all ${
              focusedButton === 2
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_30px_rgba(0,245,255,0.6)] scale-110'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            whileHover={{ scale: focusedButton === 2 ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-3xl font-bold">-</div>
          </motion.button>

          {/* Volume Display */}
          <div className="flex flex-col items-center gap-2">
            <Volume2 className="w-8 h-8 text-neon-cyan" />
            <div className="text-2xl font-bold font-mono">{volume}%</div>
          </div>

          {/* Volume Up */}
          <motion.button
            onClick={handleVolumeUp}
            className={`p-6 rounded-2xl transition-all ${
              focusedButton === 3
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_30px_rgba(0,245,255,0.6)] scale-110'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            whileHover={{ scale: focusedButton === 3 ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-3xl font-bold">+</div>
          </motion.button>

          {/* Divisor */}
          <div className="w-px h-16 bg-white/20 mx-4" />

          {/* Mute */}
          <motion.button
            onClick={handleToggleMute}
            className={`p-6 rounded-2xl transition-all ${
              focusedButton === 4
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_30px_rgba(0,245,255,0.6)] scale-110'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            whileHover={{ scale: focusedButton === 4 ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {muted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
          </motion.button>
        </div>

        {/* Dica de navegação */}
        <motion.p
          className="text-center text-sm text-gray-400 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Use as setas ← → do controle remoto para navegar • Enter ou OK para selecionar
        </motion.p>
      </div>
    </div>
  );
}

export default Panel;
