const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/public/config
 * Lista todas as configurações (acesso público para frontend cliente/TV)
 */
router.get('/config', async (req, res) => {
  try {
    const configs = await prisma.configuracao.findMany({
      orderBy: { chave: 'asc' },
    });

    res.json(configs);
  } catch (error) {
    console.error('Erro ao listar configurações públicas:', error);
    res.status(500).json({
      erro: 'Erro ao listar configurações',
    });
  }
});

/**
 * GET /api/public/config/:chave
 * Busca uma configuração específica (acesso público)
 */
router.get('/config/:chave', async (req, res) => {
  try {
    const { chave } = req.params;

    const config = await prisma.configuracao.findUnique({
      where: { chave },
    });

    if (!config) {
      return res.status(404).json({
        erro: 'Configuração não encontrada',
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração pública:', error);
    res.status(500).json({
      erro: 'Erro ao buscar configuração',
    });
  }
});

module.exports = router;
