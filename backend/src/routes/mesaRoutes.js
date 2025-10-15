const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');

// Lista todas as mesas
router.get('/', mesaController.listar);

// Busca mesa por token (QR Code)
router.get('/token/:token', mesaController.buscarPorToken);

// Busca mesa por ID
router.get('/:id', mesaController.buscarPorId);

// Gera QR Code para mesa
router.get('/:id/qrcode', mesaController.gerarQRCode);

// Cria nova mesa
router.post('/', mesaController.criar);

// Atualiza status da mesa
router.patch('/:id/status', mesaController.atualizarStatus);

module.exports = router;
