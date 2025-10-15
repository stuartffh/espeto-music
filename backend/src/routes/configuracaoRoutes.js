const express = require('express');
const router = express.Router();
const configuracaoController = require('../controllers/configuracaoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas de configuração requerem autenticação
router.use(authMiddleware);

router.get('/', configuracaoController.listar);
router.get('/:chave', configuracaoController.buscar);
router.put('/:chave', configuracaoController.atualizar);
router.post('/', configuracaoController.criar);
router.delete('/:chave', configuracaoController.remover);

module.exports = router;
