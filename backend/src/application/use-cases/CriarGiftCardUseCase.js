/**
 * Use Case: Criar Gift Card
 *
 * Cria um novo gift card com código único
 */

const GiftCard = require('../../domain/entities/GiftCard');
const logger = require('../../shared/utils/logger');
const { ValidationError, ConflictError } = require('../../shared/errors/AppError');
const eventBus = require('../../shared/events/EventBus');

class CriarGiftCardUseCase {
  constructor(giftCardRepository) {
    this.giftCardRepository = giftCardRepository;
  }

  async execute(input) {
    logger.info('Criando gift card', { input });

    try {
      // Validar input
      this._validarInput(input);

      // Gerar código único
      const codigo = await this._gerarCodigoUnico();

      // Criar entidade de domínio
      const giftCard = new GiftCard({
        codigo,
        valor: input.valor || 0,
        quantidadeMusicas: input.quantidadeMusicas,
        quantidadeMusicasUsadas: 0,
        dataExpiracao: input.dataExpiracao,
        observacao: input.observacao,
        ativo: true,
      });

      // Persistir
      const giftCardSalvo = await this.giftCardRepository.save(giftCard);

      // Emitir evento
      eventBus.publish('gift_card.criado', {
        giftCardId: giftCardSalvo.id,
        codigo: giftCardSalvo.codigo,
        quantidadeMusicas: giftCardSalvo.quantidadeMusicas,
      });

      logger.info('Gift card criado com sucesso', {
        giftCardId: giftCardSalvo.id,
        codigo: giftCardSalvo.codigo,
      });

      return this._formatOutput(giftCardSalvo);
    } catch (error) {
      logger.error('Erro ao criar gift card', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async _gerarCodigoUnico() {
    let codigo;
    let tentativas = 0;
    const maxTentativas = 10;

    do {
      codigo = GiftCard.gerarCodigo();
      const existe = await this.giftCardRepository.codigoExiste(codigo);

      if (!existe) {
        return codigo;
      }

      tentativas++;
    } while (tentativas < maxTentativas);

    throw new ConflictError('Não foi possível gerar código único para gift card');
  }

  _validarInput(input) {
    if (!input.quantidadeMusicas || input.quantidadeMusicas <= 0) {
      throw new ValidationError('Quantidade de músicas deve ser positiva');
    }
    if (input.valor !== undefined && input.valor < 0) {
      throw new ValidationError('Valor não pode ser negativo');
    }
    if (input.dataExpiracao && new Date(input.dataExpiracao) < new Date()) {
      throw new ValidationError('Data de expiração não pode ser no passado');
    }
  }

  _formatOutput(giftCard) {
    return giftCard.toJSON();
  }
}

module.exports = CriarGiftCardUseCase;
