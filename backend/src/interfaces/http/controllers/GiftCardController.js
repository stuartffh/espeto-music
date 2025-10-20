/**
 * Gift Card Controller (Clean Architecture)
 *
 * Adapter que converte HTTP requests/responses para Use Cases
 * Mantém 100% compatibilidade com API existente
 */

const logger = require('../../../shared/utils/logger');
const { AppError } = require('../../../shared/errors/AppError');

class GiftCardController {
  /**
   * POST /gift-cards
   * Cria novo gift card
   */
  static async criar(req, res, next) {
    try {
      const criarGiftCardUseCase = req.container.resolve('criarGiftCardUseCase');

      const input = {
        valor: req.body.valor,
        quantidadeMusicas: req.body.quantidadeMusicas,
        dataExpiracao: req.body.dataExpiracao,
        observacao: req.body.observacao,
      };

      const resultado = await criarGiftCardUseCase.execute(input);

      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /gift-cards/usar
   * Usa gift card em um pedido
   */
  static async usar(req, res, next) {
    try {
      const usarGiftCardUseCase = req.container.resolve('usarGiftCardUseCase');

      const input = {
        codigo: req.body.codigo,
        pedidoId: req.body.pedidoMusicaId,
        nomeCliente: req.body.nomeCliente,
      };

      const resultado = await usarGiftCardUseCase.execute(input);

      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /gift-cards
   * Lista todos os gift cards
   */
  static async listar(req, res, next) {
    try {
      const giftCardRepository = req.container.resolve('giftCardRepository');

      const filters = {
        ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined,
        expirado: req.query.expirado !== undefined ? req.query.expirado === 'true' : undefined,
        codigo: req.query.codigo,
      };

      const giftCards = await giftCardRepository.findAll(filters);

      res.status(200).json(giftCards.map((gc) => gc.toJSON()));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /gift-cards/:codigo
   * Busca gift card por código
   */
  static async buscarPorCodigo(req, res, next) {
    try {
      const giftCardRepository = req.container.resolve('giftCardRepository');

      const giftCard = await giftCardRepository.findByCodigo(req.params.codigo);

      if (!giftCard) {
        throw new AppError('Gift card não encontrado', 404);
      }

      res.status(200).json(giftCard.toJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /gift-cards/:id/desativar
   * Desativa gift card
   */
  static async desativar(req, res, next) {
    try {
      const giftCardRepository = req.container.resolve('giftCardRepository');

      const giftCard = await giftCardRepository.findById(req.params.id);

      if (!giftCard) {
        throw new AppError('Gift card não encontrado', 404);
      }

      // Usar regra de negócio da entidade
      giftCard.desativar();

      await giftCardRepository.update(giftCard);

      res.status(200).json({
        mensagem: 'Gift card desativado com sucesso',
        giftCard: giftCard.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /gift-cards/:id/reativar
   * Reativa gift card
   */
  static async reativar(req, res, next) {
    try {
      const giftCardRepository = req.container.resolve('giftCardRepository');

      const giftCard = await giftCardRepository.findById(req.params.id);

      if (!giftCard) {
        throw new AppError('Gift card não encontrado', 404);
      }

      // Usar regra de negócio da entidade
      giftCard.reativar();

      await giftCardRepository.update(giftCard);

      res.status(200).json({
        mensagem: 'Gift card reativado com sucesso',
        giftCard: giftCard.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /gift-cards/:id
   * Remove gift card
   */
  static async remover(req, res, next) {
    try {
      const giftCardRepository = req.container.resolve('giftCardRepository');

      const giftCard = await giftCardRepository.findById(req.params.id);

      if (!giftCard) {
        throw new AppError('Gift card não encontrado', 404);
      }

      await giftCardRepository.delete(req.params.id);

      res.status(200).json({
        mensagem: 'Gift card removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GiftCardController;
