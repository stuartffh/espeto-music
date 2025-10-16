const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');

/**
 * Rotas do Carrinho de Compras
 *
 * Todas as rotas são públicas (sem autenticação)
 * Identificação por sessionId (baseado em IP)
 */

// GET /api/carrinho - Lista o carrinho atual
router.get('/', carrinhoController.listar);

// POST /api/carrinho - Adiciona música ao carrinho
router.post('/', carrinhoController.adicionar);

// DELETE /api/carrinho/:youtubeId - Remove música específica
router.delete('/:youtubeId', carrinhoController.remover);

// DELETE /api/carrinho - Limpa todo o carrinho
router.delete('/', carrinhoController.limpar);

// PATCH /api/carrinho/nome - Define nome do cliente
router.patch('/nome', carrinhoController.definirNome);

module.exports = router;
