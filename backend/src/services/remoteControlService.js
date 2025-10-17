/**
 * Remote Control Service - Controle remoto seguro via WebSocket
 *
 * Features:
 * - Autenticação e validação de comandos
 * - Idempotência (previne comandos duplicados)
 * - Sequenciamento (ordem garantida)
 * - ACK/NACK com estado do player
 * - Heartbeat e reconexão
 * - Backpressure control
 */

const crypto = require('crypto');

class RemoteControlService {
  constructor() {
    this.io = null;
    this.authenticatedClients = new Map(); // socketId -> { role, lastActivity, sessionId }
    this.commandHistory = new Map(); // commandId -> { timestamp, result }
    this.commandQueue = []; // Fila de comandos pendentes
    this.isProcessing = false;
    this.maxQueueSize = 100;
    this.heartbeatInterval = 30000; // 30s
    this.commandTimeout = 5000; // 5s
    this.historyTTL = 60000; // 1 minuto

    // Limpar histórico antigo periodicamente
    setInterval(() => this.cleanupHistory(), this.historyTTL);
  }

  /**
   * Inicializa o serviço com o Socket.IO
   */
  initialize(socketIo) {
    this.io = socketIo;
    console.log('🎮 Remote Control Service inicializado');
  }

  /**
   * Autentica um cliente WebSocket
   */
  async authenticate(socket, credentials) {
    const { token, role } = credentials;

    // Validar token (integrar com sistema de auth)
    if (!token) {
      return { success: false, reason: 'Token ausente' };
    }

    // Verificar se é admin (você pode integrar com JWT aqui)
    if (role !== 'admin' && role !== 'tv') {
      return { success: false, reason: 'Role inválido' };
    }

    // Gerar session ID único
    const sessionId = crypto.randomUUID();

    // Registrar cliente autenticado
    this.authenticatedClients.set(socket.id, {
      role,
      sessionId,
      lastActivity: Date.now(),
      socket
    });

    console.log(`✅ Cliente autenticado: ${socket.id} (${role})`);

    // Iniciar heartbeat
    this.startHeartbeat(socket);

    return {
      success: true,
      sessionId,
      role
    };
  }

  /**
   * Valida se o cliente está autenticado
   */
  isAuthenticated(socketId) {
    return this.authenticatedClients.has(socketId);
  }

  /**
   * Valida permissão para executar comando
   */
  hasPermission(socketId, command) {
    const client = this.authenticatedClients.get(socketId);
    if (!client) return false;

    // Admin pode tudo
    if (client.role === 'admin') return true;

    // TV só pode receber comandos, não enviar controles
    if (client.role === 'tv') {
      const allowedForTV = ['get-state', 'heartbeat'];
      return allowedForTV.includes(command);
    }

    return false;
  }

  /**
   * Valida estrutura do comando
   */
  validateCommand(cmd) {
    const required = ['id', 'type', 'timestamp'];

    for (const field of required) {
      if (!cmd[field]) {
        return { valid: false, reason: `Campo obrigatório ausente: ${field}` };
      }
    }

    // Validar timestamp (não aceitar comandos muito antigos ou do futuro)
    const now = Date.now();
    const cmdTime = cmd.timestamp;
    const maxSkew = 60000; // 1 minuto

    if (Math.abs(now - cmdTime) > maxSkew) {
      return { valid: false, reason: 'Timestamp inválido (clock skew)' };
    }

    // Validar tipo de comando
    const validTypes = [
      'play', 'pause', 'stop', 'seek', 'volume',
      'mute', 'unmute', 'fullscreen', 'get-state',
      'next', 'previous', 'heartbeat'
    ];

    if (!validTypes.includes(cmd.type)) {
      return { valid: false, reason: `Tipo de comando inválido: ${cmd.type}` };
    }

    // Validar parâmetros específicos
    if (cmd.type === 'seek' && typeof cmd.params?.time !== 'number') {
      return { valid: false, reason: 'Parâmetro "time" obrigatório para seek' };
    }

    if (cmd.type === 'volume' && (typeof cmd.params?.level !== 'number' || cmd.params.level < 0 || cmd.params.level > 100)) {
      return { valid: false, reason: 'Parâmetro "level" deve ser 0-100' };
    }

    return { valid: true };
  }

  /**
   * Verifica idempotência (previne comandos duplicados)
   */
  isDuplicate(commandId) {
    return this.commandHistory.has(commandId);
  }

  /**
   * Processa comando com idempotência
   */
  async processCommand(socket, command) {
    const { id: commandId, type, params } = command;

    // Verificar autenticação
    if (!this.isAuthenticated(socket.id)) {
      return this.sendNack(socket, commandId, 'NOT_AUTHENTICATED');
    }

    // Verificar permissão
    if (!this.hasPermission(socket.id, type)) {
      return this.sendNack(socket, commandId, 'PERMISSION_DENIED');
    }

    // Validar comando
    const validation = this.validateCommand(command);
    if (!validation.valid) {
      return this.sendNack(socket, commandId, 'INVALID_COMMAND', validation.reason);
    }

    // Verificar duplicação (idempotência)
    if (this.isDuplicate(commandId)) {
      const cached = this.commandHistory.get(commandId);
      console.log(`♻️  Comando duplicado detectado: ${commandId}`);
      return this.sendAck(socket, commandId, cached.result);
    }

    // Verificar backpressure
    if (this.commandQueue.length >= this.maxQueueSize) {
      return this.sendNack(socket, commandId, 'QUEUE_FULL', `Fila cheia (${this.maxQueueSize})`);
    }

    // Adicionar à fila
    this.commandQueue.push({ socket, command });

    // Processar fila
    this.processQueue();
  }

  /**
   * Processa fila de comandos sequencialmente
   */
  async processQueue() {
    if (this.isProcessing || this.commandQueue.length === 0) return;

    this.isProcessing = true;

    while (this.commandQueue.length > 0) {
      const { socket, command } = this.commandQueue.shift();

      try {
        await this.executeCommand(socket, command);
      } catch (error) {
        console.error('❌ Erro ao executar comando:', error);
        this.sendNack(socket, command.id, 'EXECUTION_ERROR', error.message);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Executa o comando no player
   */
  async executeCommand(socket, command) {
    const { id: commandId, type, params } = command;

    console.log(`🎮 Executando comando: ${type} (${commandId})`);

    // Emitir comando para o player (TV)
    const tvClients = this.getTVClients();

    if (tvClients.length === 0) {
      return this.sendNack(socket, commandId, 'NO_TV_CONNECTED', 'Nenhuma TV conectada');
    }

    // Mapear comando para evento do player
    const playerCommand = this.mapCommandToPlayerEvent(type, params);

    // Emitir para todas as TVs conectadas
    tvClients.forEach(tvClient => {
      tvClient.socket.emit('remote-control', playerCommand);
    });

    // Aguardar resposta do player (com timeout)
    const result = await this.waitForPlayerResponse(commandId, this.commandTimeout);

    // Salvar no histórico (idempotência)
    this.commandHistory.set(commandId, {
      timestamp: Date.now(),
      result
    });

    // Enviar ACK com estado
    return this.sendAck(socket, commandId, result);
  }

  /**
   * Mapeia comando para evento do player
   */
  mapCommandToPlayerEvent(type, params) {
    switch (type) {
      case 'play':
        return { type: 'play' };
      case 'pause':
        return { type: 'pause' };
      case 'stop':
        return { type: 'stop' };
      case 'seek':
        return { type: 'seek', time: params.time };
      case 'volume':
        return { type: 'set-volume', volume: params.level / 100 };
      case 'mute':
        return { type: 'set-muted', muted: true };
      case 'unmute':
        return { type: 'set-muted', muted: false };
      case 'next':
        return { type: 'next' };
      case 'previous':
        return { type: 'previous' };
      default:
        return { type };
    }
  }

  /**
   * Aguarda resposta do player
   */
  waitForPlayerResponse(commandId, timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ status: 'timeout', state: null });
      }, timeout);

      // Listener para resposta do player
      const handler = (data) => {
        if (data.commandId === commandId) {
          clearTimeout(timer);
          this.io.off('player-response', handler);
          resolve({ status: 'success', state: data.state });
        }
      };

      this.io.on('player-response', handler);
    });
  }

  /**
   * Envia ACK (comando executado com sucesso)
   */
  sendAck(socket, commandId, result) {
    const response = {
      type: 'ACK',
      commandId,
      timestamp: Date.now(),
      result: result || { status: 'success' }
    };

    socket.emit('remote-control-response', response);
    console.log(`✅ ACK enviado: ${commandId}`);
  }

  /**
   * Envia NACK (comando rejeitado)
   */
  sendNack(socket, commandId, code, reason) {
    const response = {
      type: 'NACK',
      commandId,
      timestamp: Date.now(),
      error: {
        code,
        reason: reason || code
      }
    };

    socket.emit('remote-control-response', response);
    console.warn(`❌ NACK enviado: ${commandId} - ${code}`);
  }

  /**
   * Retorna clientes TV autenticados
   */
  getTVClients() {
    const tvClients = [];
    for (const [socketId, client] of this.authenticatedClients) {
      if (client.role === 'tv') {
        tvClients.push(client);
      }
    }
    return tvClients;
  }

  /**
   * Inicia heartbeat para manter conexão viva
   */
  startHeartbeat(socket) {
    const interval = setInterval(() => {
      if (!this.authenticatedClients.has(socket.id)) {
        clearInterval(interval);
        return;
      }

      socket.emit('heartbeat', { timestamp: Date.now() });
    }, this.heartbeatInterval);

    // Limpar ao desconectar
    socket.on('disconnect', () => {
      clearInterval(interval);
    });
  }

  /**
   * Atualiza atividade do cliente
   */
  updateActivity(socketId) {
    const client = this.authenticatedClients.get(socketId);
    if (client) {
      client.lastActivity = Date.now();
    }
  }

  /**
   * Remove cliente autenticado
   */
  removeClient(socketId) {
    this.authenticatedClients.delete(socketId);
    console.log(`🔌 Cliente removido: ${socketId}`);
  }

  /**
   * Limpa histórico antigo de comandos
   */
  cleanupHistory() {
    const now = Date.now();
    for (const [commandId, data] of this.commandHistory) {
      if (now - data.timestamp > this.historyTTL) {
        this.commandHistory.delete(commandId);
      }
    }
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats() {
    return {
      authenticatedClients: this.authenticatedClients.size,
      commandQueueSize: this.commandQueue.length,
      commandHistorySize: this.commandHistory.size,
      isProcessing: this.isProcessing,
      tvClients: this.getTVClients().length
    };
  }
}

// Singleton
const remoteControlService = new RemoteControlService();

module.exports = remoteControlService;
