/**
 * Rotas: Locações
 *
 * Endpoints para gerenciar locações temporárias (multi-tenancy)
 */

const express = require('express');
const router = express.Router();
const locacaoController = require('../controllers/locacaoController');
const authMiddleware = require('../middlewares/authMiddleware');

// ===== ROTAS ADMIN (protegidas) =====

/**
 * @route POST /api/admin/locacoes
 * @desc Criar nova locação
 * @access Admin
 */
router.post('/admin/locacoes', authMiddleware, locacaoController.criar);

/**
 * @route GET /api/admin/locacoes
 * @desc Listar todas as locações
 * @access Admin
 */
router.get('/admin/locacoes', authMiddleware, locacaoController.listar);

/**
 * @route GET /api/admin/locacoes/:id
 * @desc Obter locação por ID
 * @access Admin
 */
router.get('/admin/locacoes/:id', authMiddleware, locacaoController.obter);

/**
 * @route PUT /api/admin/locacoes/:id
 * @desc Atualizar locação
 * @access Admin
 */
router.put('/admin/locacoes/:id', authMiddleware, locacaoController.atualizar);

/**
 * @route DELETE /api/admin/locacoes/:id
 * @desc Desativar locação
 * @access Admin
 */
router.delete('/admin/locacoes/:id', authMiddleware, locacaoController.desativar);

/**
 * @route POST /api/admin/locacoes/:id/reativar
 * @desc Reativar locação
 * @access Admin
 */
router.post('/admin/locacoes/:id/reativar', authMiddleware, locacaoController.reativar);

/**
 * @route GET /api/admin/locacoes/:id/estatisticas
 * @desc Obter estatísticas da locação
 * @access Admin
 */
router.get('/admin/locacoes/:id/estatisticas', authMiddleware, locacaoController.obterEstatisticas);

// ===== ROTAS PÚBLICAS =====

/**
 * @route GET /api/public/locacao/:slug
 * @desc Obter informações da locação por slug (para clientes)
 * @access Public
 */
router.get('/public/locacao/:slug', locacaoController.obterPorSlug);

module.exports = router;
