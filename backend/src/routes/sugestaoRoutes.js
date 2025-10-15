const express = require('express');
const router = express.Router();
const sugestaoController = require('../controllers/sugestaoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
router.get('/:categoria', sugestaoController.buscarPorCategoria);
router.get('/populares/termos', sugestaoController.buscarPopulares);

// Rotas protegidas (requerem autenticação admin)
router.post('/atualizar', authMiddleware, sugestaoController.atualizarTrending);

module.exports = router;
