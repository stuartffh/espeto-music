const express = require('express');
const router = express.Router();
const musicaController = require('../controllers/musicaController');

// Busca músicas no YouTube
router.get('/buscar', musicaController.buscar);

// Busca detalhes de um vídeo (query param ou path param)
router.get('/detalhes', musicaController.detalhes);
router.get('/video/:videoId', musicaController.detalhes);

// Admin adiciona música diretamente (requer autenticação)
router.post('/admin-play', musicaController.adminPlay);

// Cria pedido de música
router.post('/', musicaController.criar);

// Busca fila de músicas
router.get('/fila', musicaController.fila);

// Busca música atual
router.get('/atual', musicaController.atual);

// Busca histórico
router.get('/historico', musicaController.historico);

// Busca pedido por ID
router.get('/:id', musicaController.buscarPorId);

// Atualiza pedido (ex: nome do cliente)
router.patch('/pedido/:id', musicaController.atualizarPedido);

// Marca música como tocando
router.post('/:id/tocar', musicaController.tocar);

// Marca música como concluída
router.post('/:id/concluir', musicaController.concluir);

// Pula música
router.post('/:id/pular', musicaController.pular);

// Cancela pedido
router.delete('/:id', musicaController.cancelar);

module.exports = router;
