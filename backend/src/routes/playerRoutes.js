const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas (TV pode acessar)
router.get('/estado', playerController.obterEstado);

// Rota de reset (sem auth para debug)
router.post('/reset', playerController.reset);

// Rotas protegidas (apenas admin)
router.post('/play', authMiddleware, playerController.play);
router.post('/pause', authMiddleware, playerController.pause);
router.post('/stop', authMiddleware, playerController.stop);
router.post('/skip', authMiddleware, playerController.skip);
router.post('/volume', authMiddleware, playerController.volume);

module.exports = router;
