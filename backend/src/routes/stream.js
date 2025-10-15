const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

// Stream de vídeo
router.get('/video/:youtubeId', streamController.streamVideo);

// Progresso de download
router.get('/progress/:youtubeId', streamController.getDownloadProgress);

// Iniciar download
router.post('/download', streamController.iniciarDownload);

// Deletar vídeo do cache
router.delete('/video/:youtubeId', streamController.deletarVideo);

// Informações do cache
router.get('/cache/info', streamController.getCacheInfo);

// Limpar cache
router.post('/cache/clean', streamController.limparCache);

module.exports = router;
