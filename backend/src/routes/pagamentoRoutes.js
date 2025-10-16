const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

// Cria pagamento PIX direto
router.post('/pix', pagamentoController.criarPix);

// Cria pagamento (preferência antiga)
router.post('/', pagamentoController.criar);

// Webhook do Mercado Pago (aceita POST e GET)
router.post('/webhook/mercadopago', pagamentoController.webhook);
router.get('/webhook/mercadopago', pagamentoController.webhook);

// Busca pagamento por ID
router.get('/:id', pagamentoController.buscarPorId);

// Verifica status do pagamento
router.get('/:id/status', pagamentoController.verificarStatus);

module.exports = router;
