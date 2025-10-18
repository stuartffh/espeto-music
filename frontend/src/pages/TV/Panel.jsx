import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, Clock, Wifi, WifiOff } from 'lucide-react';
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
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQueue, setShowQueue] = useState(false); // Controle de visibilidade da próxima música
  const [musicaAmbiente, setMusicaAmbiente] = useState(null); // Música ambiente quando fila vazia
  const [tocandoAmbiente, setTocandoAmbiente] = useState(false); // Flag se está tocando música ambiente
  const [showDedicatoria, setShowDedicatoria] = useState(false); // Controle de visibilidade da dedicatória
  const [tempoDedicatoria, setTempoDedicatoria] = useState(10); // Tempo de exibição da dedicatória

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const videoDescansoRef = useRef(null);
  const queueTimerRef = useRef(null); // Timer para auto-hide da fila
  const ambientePlayerRef = useRef(null); // Ref para o player de música ambiente
  const dedicatoriaTimerRef = useRef(null); // Timer para auto-hide da dedicatória

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
      console.log('▶️ Backend: Iniciar música', data.musica.musicaTitulo);
      setEstadoPlayer(data.estado);
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

  // Função para alternar fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement &&
          !document.webkitFullscreenElement &&
          !document.mozFullScreenElement &&
          !document.msFullscreenElement) {
        // Entrar em fullscreen
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          container.msRequestFullscreen();
        }
        console.log('🖥️ Entrando em fullscreen');
      } else {
        // Sair de fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        console.log('🖥️ Saindo de fullscreen');
      }
    } catch (err) {
      console.error('Erro ao alternar fullscreen:', err);
    }
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
        case 'toggle-fullscreen':
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
        case 'player-time-update':
          // Receber update de tempo do YouTube player
          if (event.data.time !== undefined) {
            // Atualizar estado local
            setCurrentTime(event.data.time);

            // Atualizar duração se disponível
            if (event.data.duration !== undefined && event.data.duration > 0) {
              setDuration(event.data.duration);
            }

            // Enviar para o backend via WebSocket (mais eficiente que HTTP)
            // Throttle de 2s para não sobrecarregar
            if (!window.lastTimeSyncSent || Date.now() - window.lastTimeSyncSent > 2000) {
              socket.emit('player:tempo-sync', { tempo: event.data.time });
              window.lastTimeSyncSent = Date.now();
            }
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

    // Enviar YouTube ID diretamente para o player decidir como tocar
    // O player pode usar YouTube embed (sem download) ou stream local (com download)
    console.log('🎵 Enviando música para o player:', musica.musicaTitulo);
    console.log('🆔 YouTube ID:', musica.musicaYoutubeId);

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

  // Controlar música ambiente - tocar quando não há fila e parar quando houver músicas
  useEffect(() => {
    const deveMostrarAmbiente = musicaAmbiente &&
                                fila.length === 0 &&
                                (!estadoPlayer || estadoPlayer.status === 'stopped');

    if (deveMostrarAmbiente && !tocandoAmbiente) {
      console.log('🎵 Iniciando música ambiente:', musicaAmbiente.titulo);
      setTocandoAmbiente(true);
    } else if (!deveMostrarAmbiente && tocandoAmbiente) {
      console.log('⏹️ Parando música ambiente - música na fila ou tocando');
      setTocandoAmbiente(false);
    }
  }, [musicaAmbiente, fila.length, estadoPlayer?.status, tocandoAmbiente]);

  const musicaAtual = estadoPlayer?.musicaAtual;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg text-white overflow-hidden"
    >
      {/* Header Superior - Informações */}
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
                {configs.LOGO_URL ? (
                  <img src={configs.LOGO_URL} alt="Logo" className="h-14 object-contain" />
                ) : (
                  <Music className="w-10 h-10 text-neon-purple" />
                )}
                <div>
                  <h2 className="text-2xl font-bold gradient-text">
                    {configs.NOME_ESTABELECIMENTO || 'Espeto Music'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {configs.SLOGAN_ESTABELECIMENTO || 'Seu pedido, sua música!'}
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

      {/* Área Principal: Player + Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
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
                  filter: 'blur(10px)',
                  transform: 'scale(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-black/70" />
            </>
          )}

          {musicaAtual ? (
            <div className="relative w-full h-full p-6">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
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

        {/* Notificação - Próxima Música (Auto-hide) */}
        {showQueue && fila.length > 0 && fila[0] && (
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
