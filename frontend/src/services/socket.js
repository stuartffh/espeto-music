import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

/**
 * 🔌 SOCKET SINGLETON - Única Instância Global
 *
 * Este é o único socket usado em toda a aplicação.
 * Garante que não haja múltiplas conexões duplicadas.
 *
 * Configurações:
 * - autoConnect: true (conecta automaticamente ao criar)
 * - reconnection: true (reconecta automaticamente se cair)
 * - reconnectionDelay: 1000ms (aguarda 1s antes de tentar reconectar)
 * - reconnectionAttempts: Infinity (tenta reconectar indefinidamente)
 * - transports: ['websocket', 'polling'] (usa websocket primeiro, fallback para polling)
 *
 * Eventos Globais:
 * - connect: Conectado com sucesso
 * - disconnect: Desconectado
 * - connect_error: Erro na conexão
 * - reconnect: Reconectado após queda
 * - reconnect_attempt: Tentativa de reconexão
 */

// Singleton: criar apenas uma vez
let socketInstance = null;

function createSocket() {
  if (socketInstance) {
    console.log('♻️  Reutilizando socket existente');
    return socketInstance;
  }

  console.log('🔌 Criando nova instância de socket...');
  console.log('📡 Socket URL:', SOCKET_URL);

  socketInstance = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    transports: ['websocket', 'polling'], // Websocket primeiro, depois polling
    upgrade: true,
    rememberUpgrade: true,
    // Não armazenar sessão (sempre conexão limpa)
    withCredentials: false,
  });

  // ========== EVENTOS GLOBAIS DO SOCKET ==========

  socketInstance.on('connect', () => {
    console.log('✅ [SOCKET] Conectado ao WebSocket');
    console.log('🆔 [SOCKET] Socket ID:', socketInstance.id);
    console.log('🚀 [SOCKET] Transport:', socketInstance.io.engine.transport.name);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('❌ [SOCKET] Desconectado do WebSocket');
    console.log('📋 [SOCKET] Razão:', reason);
  });

  socketInstance.on('connect_error', (error) => {
    console.error('❌ [SOCKET] Erro na conexão WebSocket:', error.message);
  });

  socketInstance.on('reconnect', (attemptNumber) => {
    console.log(`🔄 [SOCKET] Reconectado após ${attemptNumber} tentativa(s)`);
    console.log('🆔 [SOCKET] Novo Socket ID:', socketInstance.id);
  });

  socketInstance.on('reconnect_attempt', (attemptNumber) => {
    console.log(`⏳ [SOCKET] Tentativa de reconexão #${attemptNumber}...`);
  });

  socketInstance.on('reconnect_error', (error) => {
    console.error('❌ [SOCKET] Erro ao tentar reconectar:', error.message);
  });

  socketInstance.on('reconnect_failed', () => {
    console.error('❌ [SOCKET] Falha total ao reconectar após todas as tentativas');
  });

  // ========== EVENTOS GERAIS DA APLICAÇÃO ==========

  // Erro genérico do servidor
  socketInstance.on('error', (data) => {
    console.error('❌ [SOCKET] Erro do servidor:', data);
  });

  // Ping/Pong para manter conexão viva
  socketInstance.on('ping', () => {
    console.log('🏓 [SOCKET] Ping recebido');
  });

  socketInstance.on('pong', (latency) => {
    console.log(`🏓 [SOCKET] Pong - Latência: ${latency}ms`);
  });

  console.log('✅ [SOCKET] Instância criada com sucesso');

  return socketInstance;
}

// Criar e exportar socket singleton
export const socket = createSocket();

// Função helper para garantir que estamos usando o singleton
export const getSocket = () => {
  if (!socketInstance) {
    return createSocket();
  }
  return socketInstance;
};

// Função para desconectar completamente (útil para limpeza)
export const disconnectSocket = () => {
  if (socketInstance) {
    console.log('🔌 [SOCKET] Desconectando socket...');
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// Função para reconectar manualmente
export const reconnectSocket = () => {
  if (socketInstance && !socketInstance.connected) {
    console.log('🔄 [SOCKET] Tentando reconectar...');
    socketInstance.connect();
  }
};

/**
 * MULTI-TENANT: Autenticar TV com código único
 * @param {string} tvCode - Código único da TV
 * @returns {Promise} Resolve quando autenticação for bem-sucedida
 */
export const authenticateTV = (tvCode) => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();

    if (!tvCode) {
      reject(new Error('Código da TV é obrigatório'));
      return;
    }

    console.log('📺 [SOCKET] Autenticando TV com código:', tvCode);

    // Escutar resposta de autenticação
    const onAuthSuccess = () => {
      console.log('✅ [SOCKET] TV autenticada com sucesso');
      socket.off('auth-failed', onAuthFailed);
      resolve();
    };

    const onAuthFailed = (data) => {
      console.error('❌ [SOCKET] Falha na autenticação da TV:', data.error);
      socket.off('auth-success', onAuthSuccess);
      reject(new Error(data.error || 'Falha na autenticação'));
    };

    // Registrar listeners temporários
    socket.once('auth-success', onAuthSuccess);
    socket.once('auth-failed', onAuthFailed);

    // Emitir evento de autenticação
    socket.emit('tv-authenticate', { tvCode });
  });
};

/**
 * MULTI-TENANT: Autenticar Admin com slug do estabelecimento
 * @param {string} estabelecimentoSlug - Slug do estabelecimento
 * @returns {Promise} Resolve quando autenticação for bem-sucedida
 */
export const authenticateAdmin = (estabelecimentoSlug) => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();

    if (!estabelecimentoSlug) {
      reject(new Error('Slug do estabelecimento é obrigatório'));
      return;
    }

    console.log('👤 [SOCKET] Autenticando Admin para estabelecimento:', estabelecimentoSlug);

    // Escutar resposta de autenticação
    const onAuthSuccess = () => {
      console.log('✅ [SOCKET] Admin autenticado com sucesso');
      socket.off('auth-failed', onAuthFailed);
      resolve();
    };

    const onAuthFailed = (data) => {
      console.error('❌ [SOCKET] Falha na autenticação do Admin:', data.error);
      socket.off('auth-success', onAuthSuccess);
      reject(new Error(data.error || 'Falha na autenticação'));
    };

    // Registrar listeners temporários
    socket.once('auth-success', onAuthSuccess);
    socket.once('auth-failed', onAuthFailed);

    // Emitir evento de autenticação
    socket.emit('admin-authenticate', { estabelecimentoSlug });
  });
};

/**
 * MULTI-TENANT: Cliente se junta à room do estabelecimento
 * @param {string} slug - Slug do estabelecimento
 */
export const joinEstabelecimento = (slug) => {
  const socket = getSocket();

  if (!slug) {
    console.warn('⚠️ [SOCKET] Slug não fornecido para joinEstabelecimento');
    return;
  }

  console.log('🏢 [SOCKET] Cliente entrando na room do estabelecimento:', slug);
  socket.emit('client-join', { estabelecimentoSlug: slug });
};

// Log de status
console.log('🔌 [SOCKET] Módulo carregado');

export default socket;
