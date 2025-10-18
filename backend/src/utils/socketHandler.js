const musicaService = require('../services/musicaService');
const playerService = require('../services/playerService');
const remoteControlService = require('../services/remoteControlService');

/**
 * 🔌 CONFIGURAÇÃO DE WEBSOCKET
 *
 * Sistema centralizado de eventos WebSocket.
 * Uma única conexão, organizada e eficiente.
 *
 * Eventos disponíveis:
 * - request:estado-inicial - Cliente solicita estado completo ao conectar
 * - request:fila - Cliente solicita atualização da fila
 * - request:musica-atual - Cliente solicita música atual
 * - musica:terminou - TV notifica que música terminou
 * - pedido:pago - Cliente notifica pagamento aprovado
 * - remote-control-auth - Autenticação para controle remoto
 * - remote-control-command - Comando de controle remoto
 *
 * Emissões do servidor:
 * - estado:inicial - Estado completo (fila + música atual)
 * - fila:atualizada - Fila atualizada
 * - fila:vazia - Fila ficou vazia
 * - musica:atual - Música que está tocando
 * - player:iniciar - Iniciar reprodução
 * - player:pausar - Pausar reprodução
 * - player:retomar - Retomar reprodução
 * - player:parar - Parar reprodução
 * - config:atualizada - Configuração alterada
 * - pedido:pago - Confirmação de pagamento
 * - remote-control - Comando para o player
 * - remote-control-response - ACK/NACK de comandos
 * - server:reload-required - Servidor reiniciou, cliente deve recarregar
 */

// Timestamp de quando o servidor iniciou (para detectar reinicializações)
const SERVER_START_TIME = Date.now();

function setupSocketHandlers(io) {
  // Inicializar serviços com io
  playerService.inicializar(io);
  remoteControlService.initialize(io);

  console.log('🔌 [WEBSOCKET] Configurando handlers...');

  io.on('connection', (socket) => {
    console.log(`✅ [WEBSOCKET] Cliente conectado: ${socket.id}`);
    console.log(`📊 [WEBSOCKET] Total de clientes: ${io.engine.clientsCount}`);
    console.log(`🔧 [WEBSOCKET] Transport: ${socket.conn.transport.name}`);

    // 🔄 DETECTAR RECONEXÃO APÓS REINICIALIZAÇÃO
    // Verificar se o cliente está se reconectando (handshake com serverStartTime antigo)
    const clientServerStartTime = socket.handshake.query.serverStartTime;

    if (clientServerStartTime && parseInt(clientServerStartTime) !== SERVER_START_TIME) {
      console.log('🔄 [WEBSOCKET] Cliente reconectou após reinicialização do servidor!');
      console.log(`   Cliente conhecia: ${clientServerStartTime}`);
      console.log(`   Servidor atual: ${SERVER_START_TIME}`);
      console.log(`   🔃 Enviando comando de reload...`);

      // Emitir evento para forçar reload da página
      socket.emit('server:reload-required', {
        oldStartTime: parseInt(clientServerStartTime),
        newStartTime: SERVER_START_TIME,
        message: 'Servidor foi reiniciado, recarregando página...'
      });

      return; // Não processar eventos deste cliente, ele vai recarregar
    }

    // ========== REQUESTS DO CLIENTE ==========

    // Envia estado completo ao conectar
    socket.on('request:estado-inicial', async (data) => {
      try {
        // 🔄 DETECTAR REINICIALIZAÇÃO DO SERVIDOR
        // Se o cliente enviar o serverStartTime anterior e for diferente do atual,
        // significa que o servidor reiniciou
        if (data && data.clientServerStartTime && data.clientServerStartTime !== SERVER_START_TIME) {
          console.log('🔄 [WEBSOCKET] Servidor reiniciou! Cliente precisa recarregar.');
          console.log(`   Cliente conhecia: ${data.clientServerStartTime}`);
          console.log(`   Servidor atual: ${SERVER_START_TIME}`);

          // Emitir evento para forçar reload da página
          socket.emit('server:reload-required', {
            oldStartTime: data.clientServerStartTime,
            newStartTime: SERVER_START_TIME,
            message: 'Servidor foi reiniciado, recarregando página...'
          });

          return; // Não enviar estado inicial, cliente vai recarregar
        }

        const musicaAtual = await musicaService.buscarMusicaAtual();
        const fila = await musicaService.buscarFilaMusicas();

        socket.emit('estado:inicial', {
          musicaAtual,
          fila,
          serverStartTime: SERVER_START_TIME, // Enviar timestamp do servidor
        });
      } catch (error) {
        console.error('Erro ao enviar estado inicial:', error);
        socket.emit('error', { message: 'Erro ao carregar estado inicial' });
      }
    });

    // Cliente solicita atualização da fila
    socket.on('request:fila', async () => {
      try {
        const fila = await musicaService.buscarFilaMusicas();
        socket.emit('fila:atualizada', fila);
      } catch (error) {
        console.error('Erro ao enviar fila:', error);
        socket.emit('error', { message: 'Erro ao carregar fila' });
      }
    });

    // Cliente solicita música atual
    socket.on('request:musica-atual', async () => {
      try {
        const musicaAtual = await musicaService.buscarMusicaAtual();
        socket.emit('musica:atual', musicaAtual);
      } catch (error) {
        console.error('Erro ao enviar música atual:', error);
        socket.emit('error', { message: 'Erro ao carregar música atual' });
      }
    });

    // Painel TV notifica que música terminou
    socket.on('musica:terminou', async (data) => {
      try {
        console.log('🎵 Música terminou:', data);

        // Usar o playerService para gerenciar a transição
        await playerService.musicaTerminou();

        // Atualizar fila para todos os clientes
        const fila = await musicaService.buscarFilaMusicas();
        io.emit('fila:atualizada', fila);
      } catch (error) {
        console.error('Erro ao processar término da música:', error);
        socket.emit('error', { message: 'Erro ao processar término da música' });
      }
    });

    // Cliente pagou música
    socket.on('pedido:pago', async (data) => {
      try {
        console.log('💰 [SOCKET] Pedido pago recebido:', data);

        // Buscar estado atualizado
        const fila = await musicaService.buscarFilaMusicas();

        // Notificar todos os clientes
        io.emit('fila:atualizada', fila);
        console.log('📡 [SOCKET] Fila atualizada emitida');

        // 🎯 GARANTIR AUTOPLAY - Função centralizada e robusta
        console.log('💚 [SOCKET] Garantindo autoplay...');
        try {
          const musicaIniciada = await playerService.garantirAutoplay();

          if (musicaIniciada) {
            console.log('✅ [SOCKET] Autoplay garantido! Música:', musicaIniciada.musicaTitulo);
          } else {
            console.log('ℹ️  [SOCKET] Autoplay não necessário (já está tocando ou fila vazia)');
          }
        } catch (error) {
          console.error('❌ [SOCKET] Erro ao garantir autoplay:', error.message);
        }
      } catch (error) {
        console.error('❌ [SOCKET] Erro ao processar pedido pago:', error);
      }
    });

    // TV envia atualização de tempo do player (YouTube)
    socket.on('player:tempo-sync', (data) => {
      try {
        if (typeof data.tempo === 'number' && data.tempo >= 0) {
          playerService.atualizarTempoAtual(data.tempo);
        }
      } catch (error) {
        console.error('Erro ao sincronizar tempo do player:', error);
      }
    });

    // ========== CONTROLE REMOTO ==========

    // Autenticação para controle remoto
    socket.on('remote-control-auth', async (credentials) => {
      try {
        const result = await remoteControlService.authenticate(socket, credentials);

        if (result.success) {
          socket.emit('remote-control-auth-response', {
            success: true,
            sessionId: result.sessionId,
            role: result.role
          });
        } else {
          socket.emit('remote-control-auth-response', {
            success: false,
            reason: result.reason
          });
        }
      } catch (error) {
        console.error('Erro na autenticação de controle remoto:', error);
        socket.emit('remote-control-auth-response', {
          success: false,
          reason: 'Erro interno'
        });
      }
    });

    // Comando de controle remoto
    socket.on('remote-control-command', async (command) => {
      try {
        remoteControlService.updateActivity(socket.id);
        await remoteControlService.processCommand(socket, command);
      } catch (error) {
        console.error('Erro ao processar comando de controle remoto:', error);
      }
    });

    // Resposta do heartbeat
    socket.on('heartbeat-response', () => {
      remoteControlService.updateActivity(socket.id);
    });

    // Resposta do player para comandos (repassar para o serviço de controle remoto)
    socket.on('player-command-response', (data) => {
      // Emitir globalmente para o remoteControlService capturar
      io.emit('player-response', data);
    });

    // ========== DESCONEXÃO ==========

    socket.on('disconnect', (reason) => {
      console.log(`❌ [WEBSOCKET] Cliente desconectado: ${socket.id}`);
      console.log(`📋 [WEBSOCKET] Razão: ${reason}`);
      console.log(`📊 [WEBSOCKET] Total de clientes: ${io.engine.clientsCount}`);

      // Remover do controle remoto
      remoteControlService.removeClient(socket.id);
    });

    socket.on('error', (error) => {
      console.error(`❌ [WEBSOCKET] Erro no socket ${socket.id}:`, error);
    });
  });

  console.log('✅ [WEBSOCKET] Handlers configurados com sucesso');
  console.log('📋 [WEBSOCKET] Eventos registrados:');
  console.log('   - request:estado-inicial');
  console.log('   - request:fila');
  console.log('   - request:musica-atual');
  console.log('   - musica:terminou');
  console.log('   - pedido:pago');
}

module.exports = { setupSocketHandlers };
