/**
 * Use Case: Usar Gift Card
 *
 * Aplica gift card a um pedido, usa uma música e processa pagamento
 */

const logger = require('../../shared/utils/logger');
const { NotFoundError, BusinessError } = require('../../shared/errors/AppError');
const eventBus = require('../../shared/events/EventBus');

class UsarGiftCardUseCase {
  constructor(giftCardRepository, pedidoRepository, filaRepository) {
    this.giftCardRepository = giftCardRepository;
    this.pedidoRepository = pedidoRepository;
    this.filaRepository = filaRepository;
  }

  async execute(input) {
    const { codigo, pedidoId, nomeCliente } = input;

    logger.info('Usando gift card', { codigo, pedidoId });

    try {
      // Buscar gift card
      const giftCard = await this.giftCardRepository.findByCodigo(codigo);
      if (!giftCard) {
        throw new NotFoundError('Gift card');
      }

      // Buscar pedido
      const pedido = await this.pedidoRepository.findById(pedidoId);
      if (!pedido) {
        throw new NotFoundError('Pedido');
      }

      // Validar se gift card pode ser usado (regra de negócio na entidade)
      if (!giftCard.podeSerUsado()) {
        const motivos = [];
        if (!giftCard.ativo) motivos.push('Gift card está inativo');
        if (giftCard.estaExpirado()) motivos.push('Gift card expirado');
        if (!giftCard.temMusicasDisponiveis()) motivos.push('Não há músicas disponíveis');
        throw new BusinessError(motivos.join(', '));
      }

      // Validar se pedido pode receber gift card
      if (pedido.statusPagamento === 'pago') {
        throw new BusinessError('Pedido já está pago');
      }

      // Usar música do gift card (regra de negócio na entidade)
      giftCard.usarMusica();

      // Associar gift card ao pedido
      pedido.giftCardId = giftCard.id;
      if (nomeCliente && !pedido.nomeCliente) {
        pedido.nomeCliente = nomeCliente;
      }

      // Marcar pedido como pago e adicionar à fila
      pedido.marcarComoPago();

      const pedidosNaFila = await this.pedidoRepository.findNaFila();
      const proximaPosicao = pedidosNaFila.length + 1;
      pedido.adicionarNaFila(proximaPosicao);

      // Persistir mudanças
      await this.giftCardRepository.update(giftCard);
      const pedidoAtualizado = await this.pedidoRepository.update(pedido);

      // Emitir eventos
      eventBus.publish('gift_card.usado', {
        giftCardId: giftCard.id,
        pedidoId: pedido.id,
        musicasRestantes: giftCard.getMusicasRestantes(),
      });

      eventBus.publish('pedido.pago', {
        pedidoId: pedido.id,
        posicaoFila: proximaPosicao,
        pagoComGiftCard: true,
      });

      logger.info('Gift card usado com sucesso', {
        codigo,
        pedidoId: pedido.id,
        musicasRestantes: giftCard.getMusicasRestantes(),
      });

      return this._formatOutput(pedidoAtualizado, giftCard, proximaPosicao);
    } catch (error) {
      logger.error('Erro ao usar gift card', {
        codigo,
        pedidoId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  _formatOutput(pedido, giftCard, posicaoFila) {
    return {
      pedido: pedido.toJSON(),
      giftCard: {
        codigo: giftCard.codigo,
        musicasRestantes: giftCard.getMusicasRestantes(),
        ativo: giftCard.ativo,
      },
      posicaoFila,
      mensagem: `Gift card aplicado com sucesso! Músicas restantes: ${giftCard.getMusicasRestantes()}`,
    };
  }
}

module.exports = UsarGiftCardUseCase;
