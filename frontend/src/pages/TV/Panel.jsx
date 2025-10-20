import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, Clock, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';
import socket, { joinRoom } from '../../services/socket';
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
  const { slugPainelTV } = useParams(); // Detecta se está em modo locação
  const [locacaoData, setLocacaoData] = useState(null); // Dados da locação
  const [fila, setFila] = useState([]);
  const [estadoPlayer, setEstadoPlayer] = useState(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [autoplayConsent, setAutoplayConsent] = useState(false);
  const [configs, setConfigs] = useState({});
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQueue, setShowQueue] = useState(false); // Controle de visibilidade da próxima música
  const [musicaAmbiente, setMusicaAmbiente] = useState(null); // Música ambiente quando fila vazia
  const [tocandoAmbiente, setTocandoAmbiente] = useState(false); // Flag se está tocando música ambiente
  const [showDedicatoria, setShowDedicatoria] = useState(false); // Controle de visibilidade da dedicatória
  const [tempoDedicatoria, setTempoDedicatoria] = useState(10); // Tempo de exibição da dedicatória
  const [isFullscreen, setIsFullscreen] = useState(false); // Detecta se está em fullscreen
  const [showProximaFullscreen, setShowProximaFullscreen] = useState(false); // Controle para próxima música em fullscreen
  const [descansoErro, setDescansoErro] = useState(false); // Erro ao carregar vídeo de descanso

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const videoDescansoRef = useRef(null);
  const queueTimerRef = useRef(null); // Timer para auto-hide da fila
  const ambientePlayerRef = useRef(null); // Ref para o player de música ambiente
  const dedicatoriaTimerRef = useRef(null); // Timer para auto-hide da dedicatória
  const lastLoadedVideoIdRef = useRef(null); // Rastrear último vídeo enviado para evitar duplicação
  const lastTimeUpdateRef = useRef(0); // Throttle para updates de tempo

  // Variáveis derivadas do estado (devem vir antes dos useEffects que as usam)
  const musicaAtual = estadoPlayer?.musicaAtual;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 🎨 Mesclar configurações globais com dados da locação
  const getConfig = (key, defaultValue = '') => {
    // Se tem dados de locação, priorizar eles
    if (locacaoData) {
      switch(key) {
        case 'NOME_ESTABELECIMENTO':
          return locacaoData.nomeEstabelecimento || locacaoData.nomeEvento || configs[key] || defaultValue;
        case 'LOGO_URL':
          return locacaoData.logoUrl || configs[key] || defaultValue;
        case 'COR_PRIMARIA':
          return locacaoData.corPrimaria || configs[key] || defaultValue;
        case 'COR_SECUNDARIA':
          return locacaoData.corSecundaria || configs[key] || defaultValue;
        case 'VIDEO_DESCANSO_URL':
          return locacaoData.videoDescansoUrl || configs[key] || defaultValue;
        case 'VIDEO_DESCANSO_ATIVO':
          return locacaoData.videoDescansoUrl ? 'true' : (configs[key] || defaultValue);
        default:
          return configs[key] || defaultValue;
      }
    }
    // Caso contrário, usar config global
    return configs[key] || defaultValue;
  };

  // 📺 BUSCAR DADOS DA LOCAÇÃO (se slugPainelTV presente)
  useEffect(() => {
    if (slugPainelTV) {
      console.log('🎯 [TV] Carregando dados da locação:', slugPainelTV);

      api.get(`/api/public/painel/${slugPainelTV}`)
        .then(res => {
          if (res.data.sucesso && res.data.locacao) {
            const locacao = res.data.locacao;
            console.log('✅ [TV] Dados da locação carregados:', locacao);
            setLocacaoData(locacao);

            // Configurar QR code do cliente
            setQrCodeData(`${API_URL}/l/${locacao.slug}`);

            // Aplicar título personalizado
            document.title = `${locacao.nomeEstabelecimento || locacao.nomeEvento} - TV`;

            // 🎯 ENTRAR NA ROOM DA LOCAÇÃO
            joinRoom(locacao.id).then(() => {
              console.log(`✅ [TV] Conectado à room da locação: ${locacao.id}`);
            });
          }
        })
        .catch(error => {
          console.error('❌ [TV] Erro ao carregar locação:', error);
          // Se erro 404/403, redirecionar para /tv padrão
          if (error.response && (error.response.status === 404 || error.response.status === 403)) {
            window.location.href = '/tv';
          }
        });
    } else {
      // Modo global (sem locação)
      console.log('🌐 [TV] Modo global - sem locação específica');
      joinRoom(null).then(() => {
        console.log('✅ [TV] Conectado à room global');
      });
    }
  }, [slugPainelTV]);

  // 🧹 LIMPEZA AUTOMÁTICA: Sempre começar com conexão limpa na TV
  useEffect(() => {
    console.log('🧹 [TV] Limpando cookies e storage para conexão limpa...');

    // Limpar todos os cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Limpar localStorage (NÃO preservar serverStartTime - sempre pegar valor fresco)
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
      // Limpar ref para permitir que próxima música seja carregada
      lastLoadedVideoIdRef.current = null;
    }
  }, [estadoPlayer?.musicaAtual, socket]);

  // Buscar configurações do sistema
  useEffect(() => {
    api.get('/api/public/config')
      .then(res => {
        const configMap = {};
        res.data.forEach(config => {
          configMap[config.chave] = config.valor;
        });
        setConfigs(configMap);
        console.log('⚙️ Configurações carregadas:', configMap);

        // Configurar música ambiente se ativa
        if (configMap.MUSICA_AMBIENTE_ATIVA === 'true' && configMap.MUSICA_AMBIENTE_YOUTUBE_ID) {
          setMusicaAmbiente({
            youtubeId: configMap.MUSICA_AMBIENTE_YOUTUBE_ID,
            titulo: configMap.MUSICA_AMBIENTE_TITULO || 'Música Ambiente',
            volume: parseInt(configMap.MUSICA_AMBIENTE_VOLUME) || 30
          });
          console.log('🎵 Música ambiente configurada:', configMap.MUSICA_AMBIENTE_TITULO);
        } else {
          setMusicaAmbiente(null);
        }

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

        // Se houver dados de locação, sobrescrever título
        if (locacaoData) {
          document.title = `${locacaoData.nomeEstabelecimento || locacaoData.nomeEvento} - TV`;
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

  // Monitorar conexão do socket e recuperar estado ao reconectar
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Socket conectado');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket desconectado');
      setIsConnected(false);
    };

    // Recuperar estado completo ao reconectar após desconexão
    const handleReconnect = async () => {
      console.log('🔄 Socket reconectado! Sincronizando estado do player...');
      setIsConnected(true);

      try {
        // Buscar estado atualizado do backend
        const [filaRes, estadoRes] = await Promise.all([
          api.get('/api/musicas/fila'),
          api.get('/api/player/estado')
        ]);

        // Atualizar fila
        const filaFiltrada = filaRes.data.filter(m => m.status === 'pago');
        console.log('📋 Fila sincronizada:', filaFiltrada.length, 'músicas pagas aguardando');
        setFila(filaFiltrada);

        // Atualizar estado do player
        console.log('🎮 Estado do player sincronizado:', estadoRes.data);
        setEstadoPlayer(estadoRes.data);

        // Se há música tocando, reenviar para o iframe
        if (estadoRes.data?.musicaAtual && iframeReady) {
          console.log('🎵 Reenviando música atual para o player...');
          // sendVideoToIframe será chamada quando definida
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar estado após reconexão:', error);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
    };
  }, [iframeReady]);

  // Conectar WebSocket e buscar dados iniciais
  useEffect(() => {
    console.log('🔌 Usando socket global compartilhado...');

    // Solicitar estado inicial do servidor (com serverStartTime)
    const storedServerStartTime = localStorage.getItem('serverStartTime');
    socket.emit('request:estado-inicial', {
      clientServerStartTime: storedServerStartTime ? parseInt(storedServerStartTime) : null
    });

    // Listener para estado inicial (salvar serverStartTime)
    socket.on('estado:inicial', (data) => {
      console.log('📥 Estado inicial recebido:', data);

      // Salvar serverStartTime no localStorage
      if (data.serverStartTime) {
        localStorage.setItem('serverStartTime', data.serverStartTime.toString());
        console.log('💾 ServerStartTime salvo:', data.serverStartTime);
      }

      // Atualizar fila e música atual
      if (data.fila) {
        setFila(data.fila.filter(m => m.status === 'pago'));
      }
      if (data.musicaAtual) {
        setEstadoPlayer(prev => ({ ...prev, musicaAtual: data.musicaAtual }));
      }
    });

    // Autenticar TV no controle remoto
    socket.emit('remote-control-auth', {
      token: 'tv-token', // Em produção, usar token real
      role: 'tv'
    });

    socket.on('remote-control-auth-response', (response) => {
      if (response.success) {
        console.log('✅ TV autenticada no controle remoto:', response.sessionId);
      } else {
        console.error('❌ Falha na autenticação do controle remoto:', response.reason);
      }
    });

    // Responder heartbeat
    socket.on('heartbeat', (data) => {
      socket.emit('heartbeat-response', { timestamp: Date.now() });
    });

    // Buscar fila inicial
    api.get('/api/musicas/fila')
      .then(res => {
        // Filtrar músicas que não estão tocando (apenas as pagas aguardando)
        const filaFiltrada = res.data.filter(m => m.status === 'pago');
        console.log('📋 Fila inicial:', filaFiltrada.length, 'músicas pagas aguardando');
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
    const handlePlayerIniciar = (data) => {
      console.log('▶️ [TV] Backend: Iniciar música', data.musica.musicaTitulo);
      console.log('📦 [TV] Dados recebidos:', data);
      console.log('🎵 [TV] Música atual:', data.estado?.musicaAtual?.musicaTitulo);
      console.log('📊 [TV] Estado:', data.estado?.status);
      setEstadoPlayer(data.estado);
      console.log('✅ [TV] Estado do player atualizado. UseEffect deve disparar agora...');
      // NÃO resetar currentTime aqui - deixar o iframe fazer isso
      // O player-time-update vai atualizar com o tempo real
      if (data.estado.musicaAtual?.musicaDuracao) {
        setDuration(data.estado.musicaAtual.musicaDuracao);
      }

      // Mostrar dedicatória se existir
      if (data.estado.musicaAtual?.dedicatoria || data.estado.musicaAtual?.dedicatoriaDe) {
        console.log('💝 Mostrando dedicatória para:', data.musica.musicaTitulo);
        setShowDedicatoria(true);

        // Buscar tempo de exibição configurado
        api.get('/api/public/config/TEMPO_EXIBICAO_DEDICATORIA')
          .then(res => {
            const tempo = parseInt(res.data.valor) || 10;
            setTempoDedicatoria(tempo);

            // Esconder após o tempo configurado
            if (dedicatoriaTimerRef.current) {
              clearTimeout(dedicatoriaTimerRef.current);
            }
            dedicatoriaTimerRef.current = setTimeout(() => {
              setShowDedicatoria(false);
            }, tempo * 1000);
          })
          .catch(err => {
            console.error('Erro ao buscar tempo de dedicatória:', err);
            // Usar padrão de 10 segundos
            if (dedicatoriaTimerRef.current) {
              clearTimeout(dedicatoriaTimerRef.current);
            }
            dedicatoriaTimerRef.current = setTimeout(() => {
              setShowDedicatoria(false);
            }, 10000);
          });
      } else {
        setShowDedicatoria(false);
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
      // Mostrar apenas músicas PAGAS (próximas a tocar) - não mostrar a que está tocando
      const filaFiltrada = novaFila.filter(m => m.status === 'pago');
      console.log('📋 Fila atualizada:', filaFiltrada.length, 'músicas próximas');
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

    // 🔄 Evento de servidor reiniciado (auto-reload)
    const handleServerReload = (data) => {
      console.log('🔄 [RELOAD] Servidor reiniciou! Recarregando página...');
      console.log('   Old start time:', data.oldStartTime);
      console.log('   New start time:', data.newStartTime);

      // Forçar reload da página
      window.location.reload();
    };

    socket.on('server:reload-required', handleServerReload);

    // Cleanup: remover event listeners quando componente desmontar
    return () => {
      socket.off('player:iniciar', handlePlayerIniciar);
      socket.off('player:pausar', handlePlayerPausar);
      socket.off('player:retomar', handlePlayerRetomar);
      socket.off('player:parar', handlePlayerParar);
      socket.off('estado:inicial');
      socket.off('fila:atualizada', handleFilaAtualizada);
      socket.off('fila:vazia', handleFilaVazia);
      socket.off('config:atualizada', handleConfigAtualizada);
      socket.off('server:reload-required', handleServerReload);
    };
  }, []);

  // Enviar fila para o player sempre que ela mudar
  useEffect(() => {
    if (!iframeReady || !videoRef.current) return;

    const iframeWindow = videoRef.current.contentWindow;
    if (iframeWindow) {
      console.log('📤 Enviando fila atualizada para o player:', fila.length, 'músicas');
      iframeWindow.postMessage({
        type: 'update-queue',
        queue: fila
      }, '*');
    }
  }, [fila, iframeReady]);

  // Função para alternar fullscreen do containerRef (página inteira)
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      console.warn('⚠️ [PANEL] containerRef não encontrado');
      return;
    }

    try {
      if (!document.fullscreenElement &&
          !document.webkitFullscreenElement &&
          !document.mozFullScreenElement &&
          !document.msFullscreenElement) {
        // Entrar em fullscreen
        console.log('🖥️ [PANEL] Entrando em fullscreen do containerRef');
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          container.msRequestFullscreen();
        }
      } else {
        // Sair de fullscreen
        console.log('🖥️ [PANEL] Saindo de fullscreen');
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
    } catch (err) {
      console.error('❌ [PANEL] Erro ao alternar fullscreen:', err);
    }
  }, []);

  useEffect(() => {
    const messageHandler = (event) => {
      // Segurança: validar origem das mensagens do iframe
      try {
        const allowedOrigin = new URL(API_URL).origin;
        const currentOrigin = window.location.origin;
        if (event.origin && event.origin !== allowedOrigin && event.origin !== currentOrigin) {
          return;
        }
      } catch (_) {}
      const { type, autoplayConsent: consentValue } = event.data || {};

      switch (type) {
        case 'player-ready':
          console.log('✅ Player da TV sinalizou que está pronto');
          setIframeReady(true);
          setAutoplayConsent(Boolean(consentValue));
          break;
        case 'player-destroyed':
          console.log('🔄 Player foi destruído, aguardando recriação...');
          setIframeReady(false);
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
        case 'player-time-update': {
          const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          if (now - lastTimeUpdateRef.current > 250) {
            if (event.data.currentTime !== undefined || event.data.time !== undefined) {
              const time = event.data.currentTime || event.data.time;
              setCurrentTime(time);
            }
            if (event.data.duration !== undefined && event.data.duration > 0) {
              setDuration(event.data.duration);
            }
            lastTimeUpdateRef.current = now;
          }
          break;
        }
        case 'toggle-fullscreen':
          console.log('📺 [PANEL] Recebido comando toggle-fullscreen do iframe');
          toggleFullscreen();
          break;
        case 'set-volume':
          // Repassar comando de volume para o iframe
          if (videoRef.current?.contentWindow && event.data.volume !== undefined) {
            videoRef.current.contentWindow.postMessage({
              type: 'set-volume',
              volume: event.data.volume
            }, '*');
          }
          break;
        case 'set-muted':
          // Repassar comando de mute para o iframe
          if (videoRef.current?.contentWindow && event.data.muted !== undefined) {
            videoRef.current.contentWindow.postMessage({
              type: 'set-muted',
              muted: event.data.muted
            }, '*');
          }
          break;
        case 'play':
          // Repassar comando de play para o iframe
          if (videoRef.current?.contentWindow) {
            videoRef.current.contentWindow.postMessage({ type: 'play' }, '*');
          }
          break;
        case 'pause':
          // Repassar comando de pause para o iframe
          if (videoRef.current?.contentWindow) {
            videoRef.current.contentWindow.postMessage({ type: 'pause' }, '*');
          }
          break;
        case 'stop':
          // Repassar comando de stop para o iframe
          if (videoRef.current?.contentWindow) {
            videoRef.current.contentWindow.postMessage({ type: 'stop' }, '*');
          }
          break;
        case 'video-ended':
          // Vídeo do YouTube terminou, tocar próxima música da fila
          console.log('🎬 Vídeo terminou, chamando handleVideoEnd para tocar próxima...');
          handleVideoEnd();
          break;
        case 'video-error':
          // Erro no vídeo do YouTube, pular para próxima
          console.error('❌ Erro no YouTube Player:', event.data.error);
          console.log('⏭️ Pulando para próxima música...');
          handleVideoEnd();
          break;
        case 'video-started':
          // Vídeo iniciado com sucesso
          console.log('✅ Vídeo iniciado:', event.data.musica?.titulo);
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

  // Hotkeys: 'f' para alternar fullscreen, 'Escape' para sair
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleFullscreen]);

  const sendVideoToIframe = useCallback((musica) => {
    console.log('📤 [TV] sendVideoToIframe chamado para:', musica?.musicaTitulo);

    if (!musica) {
      console.log('❌ [TV] Sem música para enviar');
      return;
    }

    // Evitar enviar o mesmo vídeo múltiplas vezes
    if (lastLoadedVideoIdRef.current === musica.musicaYoutubeId) {
      console.log('⏭️ [TV] Vídeo já foi enviado, ignorando duplicação:', musica.musicaYoutubeId);
      return;
    }

    const iframeWindow = videoRef.current?.contentWindow;

    if (!iframeWindow) {
      console.warn('❌ [TV] Player da TV ainda não está pronto para receber vídeos.');
      return;
    }

    // Enviar YouTube ID diretamente para o player decidir como tocar
    // O player pode usar YouTube embed (sem download) ou stream local (com download)
    console.log('🎵 [TV] Enviando música para o player:', musica.musicaTitulo);
    console.log('🆔 [TV] YouTube ID:', musica.musicaYoutubeId);
    console.log('🔊 [TV] Autoplay consent:', autoplayConsent);

    iframeWindow.postMessage({
      type: 'load-video',
      youtubeId: musica.musicaYoutubeId,
      streamUrl: `${API_URL}/api/stream/video/${musica.musicaYoutubeId}`,
      autoplayConsent,
      musica: {
        titulo: musica.musicaTitulo,
        cliente: musica.nomeCliente
      }
    }, '*');

    // Marcar como enviado
    lastLoadedVideoIdRef.current = musica.musicaYoutubeId;
    console.log('✅ [TV] PostMessage enviado para iframe!');
  }, [autoplayConsent]);

  useEffect(() => {
    console.log('🔄 [TV] UseEffect disparado! Verificando condições...');
    console.log('🎵 [TV] estadoPlayer?.musicaAtual:', estadoPlayer?.musicaAtual?.musicaTitulo);
    console.log('✅ [TV] iframeReady:', iframeReady);

    if (!estadoPlayer?.musicaAtual) {
      console.log('⏭️ [TV] Sem música atual, parando player...');
      // Quando não há música, parar o player do YouTube para evitar áudio em background
      if (iframeReady && videoRef.current?.contentWindow) {
        console.log('⏹️ [TV] Enviando comando stop para o iframe');
        videoRef.current.contentWindow.postMessage({ type: 'stop' }, '*');
      }
      return;
    }

    if (!iframeReady) {
      console.log('⏭️ [TV] Iframe não está pronto, ignorando...');
      return;
    }

    console.log('🚀 [TV] Condições OK! Enviando vídeo para iframe...');
    sendVideoToIframe(estadoPlayer.musicaAtual);
  }, [estadoPlayer?.musicaAtual, iframeReady, sendVideoToIframe]);

  // REMOVIDO: interval local que causava conflito com tempo real do YouTube
  // A barra de progresso é atualizada APENAS pelo player-time-update do iframe (linha 477-494)
  // Isso garante sincronização perfeita com o YouTube Player sem "tic-tac"

  // Mostrar próxima música em 3 momentos: início, meio e 10 segundos antes do fim
  useEffect(() => {
    // Se não há próxima música ou não está tocando, esconder
    if (fila.length === 0 || !duration || estadoPlayer?.status !== 'playing') {
      if (showQueue) {
        console.log('🎵 Escondendo fila - sem próxima música ou não está tocando');
        setShowQueue(false);
      }
      // Limpar timer se existir
      if (queueTimerRef.current) {
        clearTimeout(queueTimerRef.current);
        queueTimerRef.current = null;
      }
      return;
    }

    // Calcular momentos para mostrar (em segundos)
    const showAtStart = 2; // Mostrar 2 segundos após início
    const showAtMiddle = Math.floor(duration / 2); // Meio da música
    const showBeforeEnd = Math.max(duration - 10, duration * 0.8); // 10 segundos antes do fim ou 80% da música

    console.log(`⏱️ Tempo atual: ${currentTime}s de ${duration}s - Fila visível: ${showQueue}`);

    // Verificar qual momento mostrar baseado no tempo atual
    // Momento 1: Início (2-7 segundos)
    if (currentTime >= showAtStart && currentTime < showAtStart + 5) {
      if (!showQueue) {
        console.log(`🎵 Momento 1: Início da música - mostrando fila`);
        setShowQueue(true);
        // Agendar para esconder após este período
        if (queueTimerRef.current) {
          clearTimeout(queueTimerRef.current);
        }
        queueTimerRef.current = setTimeout(() => {
          console.log('🎵 Fim do período inicial - escondendo fila');
          setShowQueue(false);
          queueTimerRef.current = null;
        }, (showAtStart + 5 - currentTime) * 1000);
      }
    }
    // Momento 2: Meio da música (meio até meio+5)
    else if (currentTime >= showAtMiddle && currentTime < showAtMiddle + 5) {
      if (!showQueue) {
        console.log(`🎵 Momento 2: Meio da música - mostrando fila`);
        setShowQueue(true);
        // Agendar para esconder após este período
        if (queueTimerRef.current) {
          clearTimeout(queueTimerRef.current);
        }
        queueTimerRef.current = setTimeout(() => {
          console.log('🎵 Fim do período do meio - escondendo fila');
          setShowQueue(false);
          queueTimerRef.current = null;
        }, (showAtMiddle + 5 - currentTime) * 1000);
      }
    }
    // Momento 3: 10 segundos antes do fim - manter visível até o fim
    else if (currentTime >= showBeforeEnd) {
      if (!showQueue) {
        console.log(`🎵 Momento 3: Final da música - mantendo fila visível até o fim`);
        setShowQueue(true);
        // Limpar qualquer timer pendente - não queremos esconder no final
        if (queueTimerRef.current) {
          clearTimeout(queueTimerRef.current);
          queueTimerRef.current = null;
        }
      }
    }
    // Fora dos momentos de exibição - garantir que está escondido
    else if (showQueue && currentTime < showBeforeEnd) {
      // Se estamos mostrando mas não deveríamos, verificar se há timer ativo
      if (!queueTimerRef.current) {
        console.log('🎵 Fora dos momentos de exibição - escondendo fila');
        setShowQueue(false);
      }
    }

    // Cleanup
    return () => {
      if (queueTimerRef.current) {
        clearTimeout(queueTimerRef.current);
        queueTimerRef.current = null;
      }
    };
  }, [currentTime, duration, fila.length, estadoPlayer?.status]); // Removido showQueue das dependências

  // Controlar música ambiente - priorizar tela de descanso; fallback para ambiente se descanso falhar
  useEffect(() => {
    const descansoDisponivel = (configs.VIDEO_DESCANSO_ATIVO === 'true') && Boolean(configs.VIDEO_DESCANSO_URL) && !descansoErro;
    const deveMostrarAmbiente = musicaAmbiente &&
                                !descansoDisponivel && // Não tocar música ambiente se tela de descanso estiver disponível
                                fila.length === 0 &&
                                !estadoPlayer?.musicaAtual && // Sem música atual
                                (!estadoPlayer || estadoPlayer.status === 'stopped');

    if (deveMostrarAmbiente && !tocandoAmbiente) {
      console.log('🎵 Iniciando música ambiente:', musicaAmbiente.titulo);
      setTocandoAmbiente(true);
    } else if (!deveMostrarAmbiente && tocandoAmbiente) {
      console.log('⏹️ Parando música ambiente - música na fila ou tocando');
      setTocandoAmbiente(false);
    }
  }, [
    musicaAmbiente,
    fila.length,
    estadoPlayer?.musicaAtual,
    estadoPlayer?.status,
    tocandoAmbiente,
    configs.VIDEO_DESCANSO_ATIVO,
    configs.VIDEO_DESCANSO_URL,
    descansoErro
  ]);

  // Garantir que ao existir música atual, a música ambiente fique desligada
  useEffect(() => {
    if (estadoPlayer?.musicaAtual && tocandoAmbiente) {
      setTocandoAmbiente(false);
    }
  }, [estadoPlayer?.musicaAtual, tocandoAmbiente]);

  // Garantir que vídeo de descanso toque quando visível
  useEffect(() => {
    if (!musicaAtual && videoDescansoRef.current) {
      // Garantir que vídeo de descanso esteja tocando
      const playPromise = videoDescansoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('⚠️ Autoplay do vídeo de descanso bloqueado:', err);
        });
      }
    }
  }, [musicaAtual]);

  // Detectar mudanças de fullscreen DO IFRAME (botão do player, não F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      // Detectar se o elemento em fullscreen é o containerRef (onde está o player)
      // Quando o botão fullscreen do iframe é clicado, o container pai entra em fullscreen
      const isPlayerFullscreen = fullscreenElement === containerRef.current ||
                                  fullscreenElement === videoRef.current;

      console.log('🖥️ Fullscreen mudou:', isPlayerFullscreen, 'Elemento:', fullscreenElement?.tagName);
      setIsFullscreen(isPlayerFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Também escutar mensagens do iframe
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'fullscreen-changed') {
        console.log('📺 [PANEL] Recebendo mensagem de fullscreen do iframe:', event.data.isFullscreen);
        setIsFullscreen(event.data.isFullscreen);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Controlar exibição da próxima música (10s antes do fim) - funciona em todos os modos
  useEffect(() => {
    if (!estadoPlayer?.musicaAtual || estadoPlayer.status !== 'playing' || !duration || duration <= 0) {
      setShowProximaFullscreen(false);
      return;
    }

    const timeRemaining = duration - currentTime;

    // Debug: Log a cada 5 segundos
    if (Math.floor(currentTime) % 5 === 0 && currentTime > 0) {
      console.log(`⏱️ [TIMER] Tempo restante: ${Math.floor(timeRemaining)}s | Próxima na fila: ${fila.length > 0 ? 'Sim' : 'Não'}`);
    }

    // Mostrar próxima música apenas 10s antes do fim (quando há próxima música na fila)
    if (timeRemaining <= 10 && timeRemaining > 0 && fila.length > 0) {
      if (!showProximaFullscreen) {
        console.log('🎵 [PRÓXIMA] Mostrando overlay (10s antes do fim)');
        setShowProximaFullscreen(true);
      }
    } else {
      if (showProximaFullscreen) {
        console.log('🎵 [PRÓXIMA] Escondendo overlay');
        setShowProximaFullscreen(false);
      }
    }
  }, [currentTime, duration, fila.length, estadoPlayer?.status, estadoPlayer?.musicaAtual, showProximaFullscreen]);

  // Log para debug de fullscreen
  useEffect(() => {
    console.log('🎬 [PANEL] Estado de fullscreen:', isFullscreen);
  }, [isFullscreen]);

  // Monitorar reinicialização do backend via WebSocket
  useEffect(() => {
    if (!socket) return;

    // Listener para comando de reload do servidor
    const handleServerReload = (data) => {
      console.log('🔄 [WEBSOCKET] Servidor reiniciou! Recarregando página...');
      console.log('  - Dados:', data);

      // Recarregar página imediatamente sem modal
      window.location.reload();
    };

    socket.on('server:reload-required', handleServerReload);

    return () => {
      socket.off('server:reload-required', handleServerReload);
    };
  }, [socket]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg text-white overflow-hidden"
    >
      {/* Fullscreen Overlay - REMOVIDO: Agora usando overlays permanentes dentro do player */}

      {/* Header Superior - Informações (esconder em fullscreen) */}
      {!isFullscreen && (
        <div className="flex-shrink-0 glass-heavy backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Info da música atual ou logo */}
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
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                    <span className="text-xs font-semibold text-neon-cyan uppercase tracking-wide">Tocando Agora</span>
                    <EqualizerAnimation />
                  </div>
                  <h2 className="text-xl font-bold text-white truncate mb-1">{musicaAtual.musicaTitulo}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User className="w-3 h-3" />
                    <span className="truncate">{musicaAtual.nomeCliente || 'Anônimo'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {getConfig('LOGO_URL') ? (
                  <img src={getConfig('LOGO_URL')} alt="Logo" className="h-14 object-contain" decoding="async" referrerPolicy="no-referrer" />
                ) : (
                  <Music className="w-10 h-10 text-neon-purple" />
                )}
                <div>
                  <h2 className="text-2xl font-bold gradient-text">
                    {getConfig('NOME_ESTABELECIMENTO', 'Espeto Music')}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {getConfig('SLOGAN_ESTABELECIMENTO', 'Seu pedido, sua música!')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats e Conexão */}
          <div className="flex items-center gap-4">
            {/* Fila */}
            <div className="text-center px-4 py-2 glass rounded-xl">
              <div className="flex items-center gap-2 text-neon-cyan mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xl font-bold">{fila.length}</span>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Na Fila</p>
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

        {/*
          Barra de progresso removida daqui.
          O iframe tv-player.html já tem barra de progresso (OSD) integrada.
        */}
        </div>
      )}

      {/* Área Principal: Player + Sidebar (sem sidebar em fullscreen) */}
      <div className={`flex-1 flex overflow-hidden min-h-0 ${isFullscreen ? 'flex-col' : ''}`}>
        {/* Player - Ocupa todo espaço disponível */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          {/* Background */}
          {configs.BACKGROUND_IMAGE_URL && (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${configs.BACKGROUND_IMAGE_URL})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: isFullscreen ? 'blur(6px)' : 'blur(10px)',
                  transform: 'scale(1.05)',
                  willChange: 'transform, filter'
                }}
              />
              <div className="absolute inset-0 bg-black/70" />
            </>
          )}

          {/* Iframe do player - SEMPRE renderizado para evitar recriação */}
          <div className={`relative w-full h-full p-6 ${!musicaAtual ? 'hidden' : ''}`}>
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                ref={videoRef}
                src="/tv-player.html"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                referrerPolicy="no-referrer"
                loading="eager"
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

          {/* Vídeo de descanso - SEMPRE renderizado para carregar antecipadamente */}
          {getConfig('VIDEO_DESCANSO_ATIVO') === 'true' && getConfig('VIDEO_DESCANSO_URL') && (
            <video
              ref={videoDescansoRef}
              src={getConfig('VIDEO_DESCANSO_URL')}
              className={`absolute inset-0 w-full h-full object-cover ${musicaAtual ? 'hidden' : ''}`}
              autoPlay
              loop
              muted
              playsInline
              onError={(e) => {
                console.error('❌ Erro ao carregar vídeo de descanso:', e);
                if (videoDescansoRef.current) {
                  videoDescansoRef.current.style.display = 'none';
                }
                // Ativar fallback para música ambiente
                setDescansoErro(true);
              }}
              onCanPlay={() => {
                // Resetar erro quando o descanso estiver ok novamente
                if (descansoErro) setDescansoErro(false);
              }}
            />
          )}

          {/* Tela de descanso - mostrar quando não há música */}
          {!musicaAtual && (
            <>

              {/* Tela de aguardo */}
              <motion.div
                className="text-center px-8 relative z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {getConfig('LOGO_URL') ? (
                  <motion.img
                    src={getConfig('LOGO_URL')}
                    alt="Logo"
                    className="mx-auto mb-8 max-w-md max-h-48 object-contain drop-shadow-2xl"
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                ) : (
                  <Music className="w-40 h-40 mx-auto text-neon-cyan mb-8" />
                )}

                <h1 className="text-7xl font-black mb-6 gradient-text">
                  {getConfig('NOME_ESTABELECIMENTO', 'Espeto Music')}
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

                {/* QR Code - Ocultar em fullscreen para evitar duplicação com overlay */}
                {qrCodeData && !isFullscreen && (
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
                      width="192"
                      height="192"
                      loading="lazy"
                    />
                  </motion.div>
                )}
              </motion.div>
            </>
          )}

          {/* ========== OVERLAYS PERMANENTES ========== */}
          {/* Nota: Estes overlays só aparecem em FULLSCREEN para evitar duplicação com o header */}

          {/* 1. OVERLAY: Música Atual (Top-Left) - Visível em fullscreen quando há música */}
          {isFullscreen && musicaAtual && (
            <motion.div
              className="absolute top-4 left-4 z-50 glass-heavy border-2 border-neon-cyan/40 rounded-xl shadow-2xl overflow-hidden max-w-sm"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', damping: 20 }}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Thumbnail com animação de pulse */}
                {musicaAtual.musicaThumbnail && (
                  <motion.div
                    className="relative w-16 h-16 rounded-lg overflow-hidden shadow-lg flex-shrink-0"
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

                {/* Informações da música */}
                <div className="flex-1 min-w-0">
                  {/* Label "Tocando Agora" */}
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-3 h-3 text-neon-cyan flex-shrink-0" />
                    <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-wider">Tocando Agora</span>
                    <EqualizerAnimation />
                  </div>

                  {/* Título da música */}
                  <h3 className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
                    {musicaAtual.musicaTitulo}
                  </h3>

                  {/* Nome do cliente */}
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{musicaAtual.nomeCliente || 'Anônimo'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. OVERLAY: QR Code (Bottom-Left) - Visível em fullscreen quando disponível */}
          {isFullscreen && qrCodeData && (
            <motion.div
              className="absolute bottom-4 left-4 z-50 glass-heavy border-2 border-neon-purple/40 rounded-xl shadow-2xl overflow-hidden"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', damping: 20, delay: 0.1 }}
            >
              <div className="p-4 text-center">
                {/* Ícone e Label */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="bg-gradient-to-br from-neon-purple to-neon-pink p-1.5 rounded-lg">
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                    Escaneie para adicionar
                  </p>
                </div>

                {/* QR Code */}
                <motion.div
                  className="bg-white rounded-lg p-2 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src={qrCodeData.qrCode}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto"
                    width="128"
                    height="128"
                    loading="eager"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* 3. OVERLAY: Próxima Música (Bottom-Right) - Aparece 10s antes do fim em fullscreen */}
          {isFullscreen && showProximaFullscreen && fila.length > 0 && fila[0] && (
            <motion.div
              className="absolute bottom-4 right-4 z-50 glass-heavy border-2 border-neon-pink/40 rounded-xl shadow-2xl overflow-hidden max-w-xs"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', damping: 20 }}
            >
              <div className="p-4">
                {/* Header com ícone de relógio */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gradient-to-br from-neon-pink to-neon-purple p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-neon-pink uppercase tracking-wide">
                      Próxima Música:
                    </p>
                    <p className="text-[10px] text-gray-400">Em breve...</p>
                  </div>
                </div>

                {/* Título da próxima música */}
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-sm font-bold text-white leading-tight line-clamp-2">
                    {fila[0].musicaTitulo}
                  </p>
                  {fila[0].nomeCliente && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-300">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{fila[0].nomeCliente}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Notificação - Próxima Música (Auto-hide) - Apenas fora de fullscreen */}
        {!isFullscreen && showQueue && fila.length > 0 && fila[0] && (
          <motion.div
            className="absolute top-4 right-4 glass-heavy border border-white/10 rounded-2xl shadow-2xl z-50 p-6 max-w-md"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring', damping: 20 }}
          >
            <div className="flex items-center gap-4">
              {/* Ícone */}
              <div className="bg-gradient-to-br from-neon-cyan to-neon-purple p-3 rounded-xl flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>

              {/* Texto e título da música */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neon-cyan uppercase tracking-wide mb-1">
                  Próxima Música:
                </p>
                <p className="text-lg font-bold text-white truncate">
                  {fila[0].musicaTitulo}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dedicatória - Exibida quando música com dedicatória começa */}
        {showDedicatoria && estadoPlayer?.musicaAtual?.dedicatoria && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="glass-heavy border-2 border-neon-pink rounded-3xl shadow-2xl max-w-3xl p-12 text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ duration: 0.5, type: 'spring', damping: 15 }}
            >
              {/* Ícone de coração */}
              <motion.div
                className="mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="inline-block bg-gradient-to-br from-neon-pink to-neon-purple p-6 rounded-full">
                  <span className="text-6xl">💝</span>
                </div>
              </motion.div>

              {/* Título */}
              <h2 className="text-3xl font-bold text-neon-pink mb-6">
                Dedicatória Especial
              </h2>

              {/* De: */}
              {estadoPlayer.musicaAtual.dedicatoriaDe && (
                <p className="text-xl text-gray-300 mb-4">
                  <span className="text-neon-cyan font-semibold">De:</span>{' '}
                  {estadoPlayer.musicaAtual.dedicatoriaDe}
                </p>
              )}

              {/* Mensagem */}
              <div className="bg-black/30 rounded-2xl p-6 mb-6">
                <p className="text-2xl text-white font-medium leading-relaxed">
                  {estadoPlayer.musicaAtual.dedicatoria}
                </p>
              </div>

              {/* Música */}
              <div className="flex items-center justify-center gap-3 text-gray-400">
                <Music className="w-5 h-5" />
                <p className="text-lg">
                  {estadoPlayer.musicaAtual.musicaTitulo}
                </p>
              </div>

              {/* Barra de progresso */}
              <div className="mt-6">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-pink to-neon-purple"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: tempoDedicatoria, ease: 'linear' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Player de Música Ambiente - Minimizado no canto inferior */}
        {tocandoAmbiente && musicaAmbiente && (
          <motion.div
            className="fixed bottom-4 right-4 glass-heavy border border-neon-cyan/30 rounded-xl shadow-2xl z-40 overflow-hidden"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '320px', height: '200px' }}
          >
            {/* Header do player minimizado */}
            <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 p-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                  <p className="text-xs text-gray-300 font-semibold">Música Ambiente</p>
                </div>
                <p className="text-xs text-gray-400">{musicaAmbiente.titulo}</p>
              </div>
            </div>

            {/* Player do YouTube incorporado */}
            <iframe
              ref={ambientePlayerRef}
              src={`https://www.youtube.com/embed/${musicaAmbiente.youtubeId}?autoplay=1&loop=1&playlist=${musicaAmbiente.youtubeId}&controls=0&showinfo=0&modestbranding=1&rel=0&volume=${musicaAmbiente.volume}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              style={{ border: 'none' }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Panel;
