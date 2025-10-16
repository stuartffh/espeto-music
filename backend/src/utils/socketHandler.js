const musicaService = require('../services/musicaService');
const playerService = require('../services/playerService');

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
 */
function setupSocketHandlers(io) {
  // Inicializar playerService com io
  playerService.inicializar(io);

  console.log('🔌 [WEBSOCKET] Configurando handlers...');

  io.on('connection', (socket) => {
    console.log(`✅ [WEBSOCKET] Cliente conectado: ${socket.id}`);
    console.log(`📊 [WEBSOCKET] Total de clientes: ${io.engine.clientsCount}`);
    console.log(`🔧 [WEBSOCKET] Transport: ${socket.conn.transport.name}`);

    // ========== REQUESTS DO CLIENTE ==========

    // Envia estado completo ao conectar
    socket.on('request:estado-inicial', async () => {
      try {
        const musicaAtual = await musicaService.buscarMusicaAtual();
        const fila = await musicaService.buscarFilaMusicas();

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
        console.log('💰 Pedido pago:', data);

        // Buscar estado atualizado
        const fila = await musicaService.buscarFilaMusicas();

        // Notificar todos os clientes
        io.emit('fila:atualizada', fila);

        // Se não houver música tocando, iniciar esta usando o playerService
        const estadoPlayer = playerService.obterEstado();
        if (!estadoPlayer.musicaAtual) {
          const pedido = await musicaService.tocarMusica(data.pedidoId);
          playerService.iniciarMusica(pedido);
        }
      } catch (error) {
        console.error('Erro ao processar pedido pago:', error);
      }
    });

    // ========== DESCONEXÃO ==========

    socket.on('disconnect', (reason) => {
      console.log(`❌ [WEBSOCKET] Cliente desconectado: ${socket.id}`);
      console.log(`📋 [WEBSOCKET] Razão: ${reason}`);
      console.log(`📊 [WEBSOCKET] Total de clientes: ${io.engine.clientsCount}`);
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
