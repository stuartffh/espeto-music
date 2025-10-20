/**
 * Pedido Controller (Clean Architecture)
 *
 * Adapter que converte HTTP requests/responses para Use Cases
 * Mantém 100% compatibilidade com API existente
 */

const logger = require('../../../shared/utils/logger');
const { AppError } = require('../../../shared/errors/AppError');

class PedidoController {
  /**
   * POST /pedidos
   * Cria novo pedido
   */
  static async criar(req, res, next) {
    try {
      const criarPedidoUseCase = req.container.resolve('criarPedidoUseCase');

      const input = {
        musicaTitulo: req.body.musicaTitulo,
        musicaYoutubeId: req.body.musicaYoutubeId,
        musicaThumbnail: req.body.musicaThumbnail,
        musicaDuracao: req.body.musicaDuracao,
        nomeCliente: req.body.nomeCliente,
        dedicatoria: req.body.dedicatoria,
        dedicatoriaDe: req.body.dedicatoriaDe,
        valor: req.body.valor,
        giftCardId: req.body.giftCardId,
        carrinhoId: req.body.carrinhoId,
      };

      const resultado = await criarPedidoUseCase.execute(input);

      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /pedidos/:id/pagar
   * Processa pagamento de pedido
   */
  static async pagar(req, res, next) {
    try {
      const processarPagamentoPedidoUseCase = req.container.resolve(
        'processarPagamentoPedidoUseCase'
      );

      const input = {
        pedidoId: req.params.id,
      };

      const resultado = await processarPagamentoPedidoUseCase.execute(input);

      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /pedidos
   * Lista todos os pedidos
   */
  static async listar(req, res, next) {
    try {
      const pedidoRepository = req.container.resolve('pedidoRepository');

      const filters = {
        statusPagamento: req.query.statusPagamento,
        statusMusica: req.query.statusMusica,
        nomeCliente: req.query.nomeCliente,
        musicaTitulo: req.query.musicaTitulo,
      };

      const pedidos = await pedidoRepository.findAll(filters);

      res.status(200).json(pedidos.map((p) => p.toJSON()));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /pedidos/:id
   * Busca pedido por ID
   */
  static async buscarPorId(req, res, next) {
    try {
      const pedidoRepository = req.container.resolve('pedidoRepository');

      const pedido = await pedidoRepository.findById(req.params.id);

      if (!pedido) {
        throw new AppError('Pedido não encontrado', 404);
      }

      res.status(200).json(pedido.toJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /pedidos/:id
   * Cancela pedido
   */
  static async cancelar(req, res, next) {
    try {
      const pedidoRepository = req.container.resolve('pedidoRepository');

      const pedido = await pedidoRepository.findById(req.params.id);

      if (!pedido) {
        throw new AppError('Pedido não encontrado', 404);
      }

      // Usar regra de negócio da entidade
      pedido.cancelar();

      await pedidoRepository.update(pedido);

      res.status(200).json({
        mensagem: 'Pedido cancelado com sucesso',
        pedido: pedido.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /fila
   * Retorna estado atual da fila
   */
  static async obterFila(req, res, next) {
    try {
      const obterFilaUseCase = req.container.resolve('obterFilaUseCase');

      const resultado = await obterFilaUseCase.execute();

      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PedidoController;
