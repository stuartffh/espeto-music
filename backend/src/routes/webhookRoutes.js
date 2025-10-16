const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

/**
 * Rotas de Webhooks
 * Recebem notificações de sistemas externos (Mercado Pago, etc)
 * Não requerem autenticação
 */

// Webhook do Mercado Pago
// Aceita POST (notificações) e GET (validação/teste)
router.post('/mercadopago', pagamentoController.webhook);
router.get('/mercadopago', pagamentoController.webhook);

module.exports = router;
