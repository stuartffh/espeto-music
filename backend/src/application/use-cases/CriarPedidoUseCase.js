/**
 * Use Case: Criar Pedido
 *
 * Orquestra a criação de um novo pedido de música
 */

const Pedido = require('../../domain/entities/Pedido');
const logger = require('../../shared/utils/logger');
const { ValidationError } = require('../../shared/errors/AppError');
const eventBus = require('../../shared/events/EventBus');

class CriarPedidoUseCase {
  constructor(pedidoRepository) {
    this.pedidoRepository = pedidoRepository;
  }

  async execute(input) {
    logger.info('Iniciando criação de pedido', { input });

    try {
      // Validar input
      this._validarInput(input);

      // Criar entidade de domínio
      const pedido = new Pedido({
        musicaTitulo: input.musicaTitulo,
        musicaYoutubeId: input.musicaYoutubeId,
        musicaThumbnail: input.musicaThumbnail,
        musicaDuracao: input.musicaDuracao,
        nomeCliente: input.nomeCliente,
        dedicatoria: input.dedicatoria,
        dedicatoriaDe: input.dedicatoriaDe,
        valor: input.valor,
        statusPagamento: 'pendente',
        statusMusica: 'pendente',
        giftCardId: input.giftCardId,
        carrinhoId: input.carrinhoId,
      });

      // Persistir
      const pedidoSalvo = await this.pedidoRepository.save(pedido);

      // Emitir evento
      eventBus.publish('pedido.criado', {
        pedidoId: pedidoSalvo.id,
        musicaTitulo: pedidoSalvo.musicaTitulo,
        valor: pedidoSalvo.valor.amount,
      });

      logger.info('Pedido criado com sucesso', { pedidoId: pedidoSalvo.id });

      return this._formatOutput(pedidoSalvo);
    } catch (error) {
      logger.error('Erro ao criar pedido', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  _validarInput(input) {
    if (!input.musicaTitulo) {
      throw new ValidationError('Título da música é obrigatório');
    }
    if (!input.musicaYoutubeId) {
      throw new ValidationError('ID do YouTube é obrigatório');
    }
    if (!input.valor || input.valor <= 0) {
      throw new ValidationError('Valor deve ser positivo');
    }
  }

  _formatOutput(pedido) {
    return pedido.toJSON();
  }
}

module.exports = CriarPedidoUseCase;
