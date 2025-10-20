/**
 * Rotas: Locações
 *
 * Endpoints para gerenciar locações temporárias (multi-tenancy)
 */

const express = require('express');
const router = express.Router();

module.exports = (container) => {
  const locacaoController = container.resolve('locacaoController');
  const authMiddleware = container.resolve('authMiddleware');

  // ===== ROTAS ADMIN (protegidas) =====

  /**
   * @route POST /api/admin/locacoes
   * @desc Criar nova locação
   * @access Admin
   */
  router.post(
    '/admin/locacoes',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.criar(req, res)
  );

  /**
   * @route GET /api/admin/locacoes
   * @desc Listar todas as locações
   * @access Admin
   */
  router.get(
    '/admin/locacoes',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.listar(req, res)
  );

  /**
   * @route GET /api/admin/locacoes/:id
   * @desc Obter locação por ID
   * @access Admin
   */
  router.get(
    '/admin/locacoes/:id',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.obter(req, res)
  );

  /**
   * @route PUT /api/admin/locacoes/:id
   * @desc Atualizar locação
   * @access Admin
   */
  router.put(
    '/admin/locacoes/:id',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.atualizar(req, res)
  );

  /**
   * @route DELETE /api/admin/locacoes/:id
   * @desc Desativar locação
   * @access Admin
   */
  router.delete(
    '/admin/locacoes/:id',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.desativar(req, res)
  );

  /**
   * @route POST /api/admin/locacoes/:id/reativar
   * @desc Reativar locação
   * @access Admin
   */
  router.post(
    '/admin/locacoes/:id/reativar',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.reativar(req, res)
  );

  /**
   * @route GET /api/admin/locacoes/:id/estatisticas
   * @desc Obter estatísticas da locação
   * @access Admin
   */
  router.get(
    '/admin/locacoes/:id/estatisticas',
    authMiddleware.verificarToken.bind(authMiddleware),
    (req, res) => locacaoController.obterEstatisticas(req, res)
  );

  // ===== ROTAS PÚBLICAS =====

  /**
   * @route GET /api/public/locacao/:slug
   * @desc Obter informações da locação por slug (para clientes)
   * @access Public
   */
  router.get(
    '/public/locacao/:slug',
    (req, res) => locacaoController.obterPorSlug(req, res)
  );

  return router;
};
