const musicaService = require('../services/musicaService');
const playerService = require('../services/playerService');
const remoteControlService = require('../services/remoteControlService');
const { authenticateTV, authenticateAdmin, emitToEstabelecimento } = require('../middleware/socketTenantContext');

/**
 * 🔌 CONFIGURAÇÃO DE WEBSOCKET MULTI-TENANT
 *
 * Sistema centralizado de eventos WebSocket com isolamento por estabelecimento.
 * Cada TV/Admin/Cliente se conecta a uma room específica do seu estabelecimento.
 *
 * Autenticação:
 * - tv-authenticate - TV autentica com código único
 * - admin-authenticate - Admin autentica com slug do estabelecimento
 *
 * Eventos disponíveis (requerem autenticação):
 * - request:estado-inicial - Cliente solicita estado completo ao conectar
 * - request:fila - Cliente solicita atualização da fila
 * - request:musica-atual - Cliente solicita música atual
 * - musica:terminou - TV notifica que música terminou
 * - pedido:pago - Cliente notifica pagamento aprovado
 * - player:tempo-sync - TV envia atualização de tempo do player
 * - remote-control-auth - Autenticação para controle remoto
 * - remote-control-command - Comando de controle remoto
 *
 * Emissões do servidor (isoladas por room):
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
 */
function setupSocketHandlers(io) {
  // Inicializar serviços com io
  playerService.inicializar(io);
  remoteControlService.initialize(io);

  console.log('🔌 [WEBSOCKET] Configurando handlers multi-tenant...');

  io.on('connection', (socket) => {
    console.log(`✅ [WEBSOCKET] Cliente conectado: ${socket.id}`);
    console.log(`📊 [WEBSOCKET] Total de clientes: ${io.engine.clientsCount}`);
    console.log(`🔧 [WEBSOCKET] Transport: ${socket.conn.transport.name}`);

    // ========== AUTENTICAÇÃO MULTI-TENANT ==========

    // TV autentica com código único
    socket.on('tv-authenticate', async (data) => {
      try {
        const { tvCode } = data;
        await authenticateTV(socket, tvCode);
        console.log(`📺 [WEBSOCKET] TV autenticada: ${tvCode} → estabelecimento ${socket.estabelecimentoId}`);
      } catch (error) {
        console.error('❌ [WEBSOCKET] Erro ao autenticar TV:', error);
        socket.emit('auth-failed', { error: error.message });
      }
    });

    // Admin autentica com slug do estabelecimento
    socket.on('admin-authenticate', async (data) => {
      try {
        const { estabelecimentoSlug } = data;
        await authenticateAdmin(socket, estabelecimentoSlug);
        console.log(`👤 [WEBSOCKET] Admin autenticado: ${estabelecimentoSlug} → estabelecimento ${socket.estabelecimentoId}`);
      } catch (error) {
        console.error('❌ [WEBSOCKET] Erro ao autenticar Admin:', error);
        socket.emit('auth-failed', { error: error.message });
      }
    });

    // ========== REQUESTS DO CLIENTE (MULTI-TENANT) ==========

    // Envia estado completo ao conectar
    socket.on('request:estado-inicial', async () => {
      try {
        const estabelecimentoId = socket.estabelecimentoId;
        if (!estabelecimentoId) {
          return socket.emit('error', { message: 'Autenticação necessária' });
        }

        const musicaAtual = await musicaService.buscarMusicaAtual(estabelecimentoId);
        const fila = await musicaService.buscarFilaMusicas(estabelecimentoId);

        socket.emit('estado:inicial', {
          musicaAtual,
          fila,
        });
      } catch (error) {
        console.error('Erro ao enviar estado inicial:', error);
        socket.emit('error', { message: 'Erro ao carregar estado inicial' });
      }
    });

    // Cliente solicita atualização da fila
    socket.on('request:fila', async () => {
      try {
        const estabelecimentoId = socket.estabelecimentoId;
        if (!estabelecimentoId) {
          return socket.emit('error', { message: 'Autenticação necessária' });
        }

        const fila = await musicaService.buscarFilaMusicas(estabelecimentoId);
        socket.emit('fila:atualizada', fila);
      } catch (error) {
        console.error('Erro ao enviar fila:', error);
        socket.emit('error', { message: 'Erro ao carregar fila' });
      }
    });

    // Cliente solicita música atual
    socket.on('request:musica-atual', async () => {
      try {
        const estabelecimentoId = socket.estabelecimentoId;
        if (!estabelecimentoId) {
          return socket.emit('error', { message: 'Autenticação necessária' });
        }

        const musicaAtual = await musicaService.buscarMusicaAtual(estabelecimentoId);
        socket.emit('musica:atual', musicaAtual);
      } catch (error) {
        console.error('Erro ao enviar música atual:', error);
        socket.emit('error', { message: 'Erro ao carregar música atual' });
      }
    });

    // Painel TV notifica que música terminou
    socket.on('musica:terminou', async (data) => {
      try {
        const estabelecimentoId = socket.estabelecimentoId;
        if (!estabelecimentoId) {
          return socket.emit('error', { message: 'Autenticação necessária' });
        }

        console.log('🎵 Música terminou no estabelecimento:', estabelecimentoId);

        // Usar o playerService para gerenciar a transição
        await playerService.musicaTerminou(estabelecimentoId);

        // Atualizar fila para clientes DESTE estabelecimento
        const fila = await musicaService.buscarFilaMusicas(estabelecimentoId);
        emitToEstabelecimento(io, estabelecimentoId, 'fila:atualizada', fila);
      } catch (error) {
        console.error('Erro ao processar término da música:', error);
        socket.emit('error', { message: 'Erro ao processar término da música' });
      }
    });

    // Cliente pagou música
    socket.on('pedido:pago', async (data) => {
      try {
        const estabelecimentoId = socket.estabelecimentoId;
        if (!estabelecimentoId) {
          return socket.emit('error', { message: 'Autenticação necessária' });
        }

        console.log('💰 [SOCKET] Pedido pago recebido no estabelecimento:', estabelecimentoId);

        // Buscar estado atualizado
        const fila = await musicaService.buscarFilaMusicas(estabelecimentoId);

        // Notificar clientes DESTE estabelecimento
        emitToEstabelecimento(io, estabelecimentoId, 'fila:atualizada', fila);
        console.log('📡 [SOCKET] Fila atualizada emitida');

        // 🎯 GARANTIR AUTOPLAY - Função centralizada e robusta
        console.log('💚 [SOCKET] Garantindo autoplay...');
        try {
          const musicaIniciada = await playerService.garantirAutoplay(estabelecimentoId);

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
        const estabelecimentoId = socket.estabelecimentoId;
        if (!estabelecimentoId) {
          return;
        }

        if (typeof data.tempo === 'number' && data.tempo >= 0) {
          playerService.atualizarTempoAtual(data.tempo, estabelecimentoId);
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
