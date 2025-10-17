const musicaService = require('../services/musicaService');
const playerService = require('../services/playerService');

/**
 * Configura os handlers do Socket.io
 */
function setupSocketHandlers(io) {
  // Inicializar playerService com io
  playerService.inicializar(io);

  io.on('connection', (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);

    // Envia estado atual ao conectar
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

        // Verificar se precisa iniciar música automaticamente
        const musicaIniciada = await musicaService.iniciarProximaMusicaSeNecessario();

        if (musicaIniciada) {
          console.log('🎵 Autoplay: Música iniciada automaticamente via socket');
          await playerService.iniciarMusica(musicaIniciada);
        }
      } catch (error) {
        console.error('Erro ao processar pedido pago:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket handlers configurados');
}

module.exports = { setupSocketHandlers };
