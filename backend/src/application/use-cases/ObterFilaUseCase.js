/**
 * Use Case: Obter Fila
 *
 * Retorna estado atual da fila com todos os pedidos
 */

const logger = require('../../shared/utils/logger');

class ObterFilaUseCase {
  constructor(pedidoRepository, filaRepository) {
    this.pedidoRepository = pedidoRepository;
    this.filaRepository = filaRepository;
  }

  async execute() {
    logger.info('Obtendo estado da fila');

    try {
      // Buscar ou criar fila
      const fila = await this.filaRepository.findOrCreate();

      // Buscar todos os pedidos na fila (ordenados por posição)
      const pedidosNaFila = await this.pedidoRepository.findNaFila();

      // Buscar música atual (se houver)
      let musicaAtual = null;
      if (fila.musicaAtualId) {
        musicaAtual = await this.pedidoRepository.findById(fila.musicaAtualId);
      }

      // Buscar próxima música (se houver)
      let proximaMusica = null;
      if (fila.proximaMusicaId) {
        proximaMusica = await this.pedidoRepository.findById(fila.proximaMusicaId);
      }

      logger.info('Fila obtida com sucesso', {
        statusFila: fila.statusAtual,
        quantidadePedidos: pedidosNaFila.length,
      });

      return this._formatOutput(fila, musicaAtual, proximaMusica, pedidosNaFila);
    } catch (error) {
      logger.error('Erro ao obter fila', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  _formatOutput(fila, musicaAtual, proximaMusica, pedidosNaFila) {
    return {
      fila: fila.toJSON(),
      musicaAtual: musicaAtual ? musicaAtual.toJSON() : null,
      proximaMusica: proximaMusica ? proximaMusica.toJSON() : null,
      pedidos: pedidosNaFila.map((p) => p.toJSON()),
      totalPedidos: pedidosNaFila.length,
    };
  }
}

module.exports = ObterFilaUseCase;
