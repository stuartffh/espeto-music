const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { invalidarCache } = require('../utils/configHelper');

/**
 * GET /api/config
 * Lista todas as configurações
 * MULTI-TENANT: Filtra por estabelecimentoId
 */
async function listar(req, res) {
  try {
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({
        erro: 'Estabelecimento não identificado',
      });
    }

    const configs = await prisma.configuracao.findMany({
      where: { estabelecimentoId }, // ← Multi-tenant
      orderBy: { chave: 'asc' },
    });

    res.json(configs);
  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({
      erro: 'Erro ao listar configurações',
    });
  }
}

/**
 * GET /api/config/:chave
 * Busca uma configuração específica
 * MULTI-TENANT: Filtra por estabelecimentoId
 */
async function buscar(req, res) {
  try {
    const { chave } = req.params;
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({
        erro: 'Estabelecimento não identificado',
      });
    }

    const config = await prisma.configuracao.findFirst({
      where: {
        estabelecimentoId, // ← Multi-tenant
        chave,
      },
    });

    if (!config) {
      return res.status(404).json({
        erro: 'Configuração não encontrada',
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      erro: 'Erro ao buscar configuração',
    });
  }
}

/**
 * PUT /api/config/:chave
 * Atualiza uma configuração
 * MULTI-TENANT: Filtra por estabelecimentoId
 */
async function atualizar(req, res) {
  try {
    const { chave } = req.params;
    const { valor } = req.body;
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({
        erro: 'Estabelecimento não identificado',
      });
    }

    if (valor === undefined) {
      return res.status(400).json({
        erro: 'Valor é obrigatório',
      });
    }

    // Buscar config primeiro para validar que existe e pertence ao estabelecimento
    const configExistente = await prisma.configuracao.findFirst({
      where: {
        estabelecimentoId,
        chave,
      },
    });

    if (!configExistente) {
      return res.status(404).json({
        erro: 'Configuração não encontrada',
      });
    }

    const config = await prisma.configuracao.update({
      where: { id: configExistente.id },
      data: { valor: String(valor) },
    });

    // Invalidar cache da configuração atualizada
    invalidarCache(chave);

    // Emitir evento WebSocket para atualizar configurações em tempo real
    // ← MULTI-TENANT: Emitir apenas para o estabelecimento específico
    const io = req.app.get('io');
    if (io) {
      console.log(`🔄 Emitindo atualização de configuração: ${chave} = ${valor} para estabelecimento ${estabelecimentoId}`);
      io.to(`estabelecimento:${estabelecimentoId}`).emit('config:atualizada', { chave, valor: String(valor) });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      erro: 'Erro ao atualizar configuração',
    });
  }
}

/**
 * POST /api/config
 * Cria uma nova configuração
 * MULTI-TENANT: Associa ao estabelecimentoId
 */
async function criar(req, res) {
  try {
    const { chave, valor, descricao, tipo } = req.body;
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({
        erro: 'Estabelecimento não identificado',
      });
    }

    if (!chave || valor === undefined) {
      return res.status(400).json({
        erro: 'Chave e valor são obrigatórios',
      });
    }

    const config = await prisma.configuracao.create({
      data: {
        estabelecimentoId, // ← Multi-tenant
        chave,
        valor: String(valor),
        descricao,
        tipo: tipo || 'text',
      },
    });

    // Invalidar cache ao criar nova configuração
    invalidarCache(chave);

    res.status(201).json(config);
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({
      erro: 'Erro ao criar configuração',
    });
  }
}

/**
 * DELETE /api/config/:chave
 * Remove uma configuração
 * MULTI-TENANT: Filtra por estabelecimentoId
 */
async function remover(req, res) {
  try {
    const { chave } = req.params;
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({
        erro: 'Estabelecimento não identificado',
      });
    }

    // Buscar config primeiro para validar que existe e pertence ao estabelecimento
    const configExistente = await prisma.configuracao.findFirst({
      where: {
        estabelecimentoId,
        chave,
      },
    });

    if (!configExistente) {
      return res.status(404).json({
        erro: 'Configuração não encontrada',
      });
    }

    await prisma.configuracao.delete({
      where: { id: configExistente.id },
    });

    // Invalidar cache ao remover configuração
    invalidarCache(chave);

    res.json({
      mensagem: 'Configuração removida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover configuração:', error);
    res.status(500).json({
      erro: 'Erro ao remover configuração',
    });
  }
}

module.exports = {
  listar,
  buscar,
  atualizar,
  criar,
  remover,
};
