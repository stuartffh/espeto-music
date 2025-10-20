/**
 * Use Case: Processar Pagamento do Pedido
 *
 * Marca pedido como pago e adiciona à fila
 */

const logger = require('../../shared/utils/logger');
const { NotFoundError, BusinessError } = require('../../shared/errors/AppError');
const eventBus = require('../../shared/events/EventBus');

class ProcessarPagamentoPedidoUseCase {
  constructor(pedidoRepository, filaRepository) {
    this.pedidoRepository = pedidoRepository;
    this.filaRepository = filaRepository;
  }

  async execute(input) {
    const { pedidoId } = input;

    logger.info('Processando pagamento de pedido', { pedidoId });

    try {
      // Buscar pedido
      const pedido = await this.pedidoRepository.findById(pedidoId);
      if (!pedido) {
        throw new NotFoundError('Pedido');
      }

      // Validar se pode ser pago
      if (pedido.statusPagamento === 'pago') {
        throw new BusinessError('Pedido já está pago');
      }

      // Marcar como pago (regra de negócio na entidade)
      pedido.marcarComoPago();

      // Calcular posição na fila
      const pedidosNaFila = await this.pedidoRepository.findNaFila();
      const proximaPosicao = pedidosNaFila.length + 1;

      // Adicionar à fila (regra de negócio na entidade)
      pedido.adicionarNaFila(proximaPosicao);

      // Persistir mudanças
      const pedidoAtualizado = await this.pedidoRepository.update(pedido);

      // Emitir eventos
      eventBus.publish('pedido.pago', {
        pedidoId: pedido.id,
        posicaoFila: proximaPosicao,
      });

      eventBus.publish('fila.atualizada', {
        novaPosicao: proximaPosicao,
        pedidoId: pedido.id,
      });

      logger.info('Pagamento processado com sucesso', {
        pedidoId: pedido.id,
        posicaoFila: proximaPosicao,
      });

      return this._formatOutput(pedidoAtualizado, proximaPosicao);
    } catch (error) {
      logger.error('Erro ao processar pagamento', {
        pedidoId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  _formatOutput(pedido, posicaoFila) {
    return {
      ...pedido.toJSON(),
      mensagem: `Pedido pago com sucesso! Posição na fila: ${posicaoFila}`,
    };
  }
}

module.exports = ProcessarPagamentoPedidoUseCase;
