const express = require('express');
const router = express.Router();
const moderacaoController = require('../controllers/moderacaoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação de admin
router.use(authMiddleware);

// GET /api/admin/moderacao/palavras - Lista palavras proibidas
router.get('/palavras', moderacaoController.listarPalavras);

// POST /api/admin/moderacao/palavras - Adiciona nova palavra
router.post('/palavras', moderacaoController.adicionarPalavra);

// PUT /api/admin/moderacao/palavras/:id - Atualiza palavra
router.put('/palavras/:id', moderacaoController.atualizarPalavra);

// DELETE /api/admin/moderacao/palavras/:id - Deleta palavra
router.delete('/palavras/:id', moderacaoController.deletarPalavra);

// POST /api/admin/moderacao/palavras/:id/toggle - Ativa/desativa palavra
router.post('/palavras/:id/toggle', moderacaoController.togglePalavra);

// GET /api/admin/moderacao/estatisticas - Estatísticas de moderação
router.get('/estatisticas', moderacaoController.estatisticas);

// POST /api/admin/moderacao/testar - Testa texto contra moderação
router.post('/testar', moderacaoController.testarTexto);

module.exports = router;
