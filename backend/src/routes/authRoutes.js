const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas (requerem autenticação)
router.post('/verificar', authMiddleware, authController.verificar);
router.post('/alterar-senha', authMiddleware, authController.alterarSenha);

module.exports = router;
