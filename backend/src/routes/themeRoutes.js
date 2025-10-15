const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/theme - Obter tema ativo (público)
router.get('/', themeController.obterTema);

// GET /api/theme/css - Obter CSS customizado (público)
router.get('/css', themeController.obterCss);

// PUT /api/admin/theme - Atualizar tema (requer autenticação)
router.put('/', authMiddleware, themeController.atualizarTema);

// POST /api/admin/theme/reset - Resetar tema (requer autenticação)
router.post('/reset', authMiddleware, themeController.resetarTema);

module.exports = router;
