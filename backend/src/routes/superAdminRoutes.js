/**
 * Rotas do Super Admin
 *
 * Todas as rotas começam com /api/super-admin
 * Requerem autenticação de super admin
 */

const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { requireSuperAdmin } = require('../middleware/tenantContext');

// ========== LOGIN (sem autenticação) ==========
router.post('/login', superAdminController.login);

// Aplicar middleware de super admin em TODAS as rotas abaixo
router.use(requireSuperAdmin);

// ========== DASHBOARD ==========
router.get('/dashboard', superAdminController.dashboard);

// ========== ESTABELECIMENTOS ==========
router.get('/estabelecimentos', superAdminController.listarEstabelecimentos);
router.get('/estabelecimentos/:id', superAdminController.buscarEstabelecimento);
router.post('/estabelecimentos', superAdminController.criarEstabelecimento);
router.put('/estabelecimentos/:id', superAdminController.atualizarEstabelecimento);
router.patch('/estabelecimentos/:id/toggle-ativo', superAdminController.toggleAtivo);
router.delete('/estabelecimentos/:id', superAdminController.deletarEstabelecimento);
router.post('/estabelecimentos/:id/reset-contador', superAdminController.resetContadorMusicas);

module.exports = router;
