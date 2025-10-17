const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/giftCardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação de admin
router.use(authMiddleware);

// GET /api/gifts - Listar todos os gift cards
router.get('/', giftCardController.listar);

// POST /api/gifts - Criar novo gift card
router.post('/', giftCardController.criar);

// DELETE /api/gifts/:id - Deletar gift card
router.delete('/:id', giftCardController.deletar);

// PATCH /api/gifts/:id/desativar - Desativar gift card
router.patch('/:id/desativar', giftCardController.desativar);

module.exports = router;
