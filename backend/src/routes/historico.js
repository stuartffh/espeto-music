const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');

// Buscar histórico com filtros e paginação
router.get('/', historicoController.buscarHistorico);

// Buscar estatísticas
router.get('/estatisticas', historicoController.buscarEstatisticas);

module.exports = router;
