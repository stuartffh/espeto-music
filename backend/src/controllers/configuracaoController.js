const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/config
 * Lista todas as configurações
 */
async function listar(req, res) {
  try {
    const configs = await prisma.configuracao.findMany({
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
 */
async function buscar(req, res) {
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
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      erro: 'Erro ao buscar configuração',
    });
  }
}

/**
 * PUT /api/config/:chave
 * Atualiza uma configuração
 */
async function atualizar(req, res) {
  try {
    const { chave } = req.params;
    const { valor, descricao = null, tipo = 'text' } = req.body;

    if (valor === undefined) {
      return res.status(400).json({
        erro: 'Valor é obrigatório',
      });
    }

    try {
      const config = await prisma.configuracao.update({
        where: { chave },
        data: {
          valor: String(valor),
          ...(descricao !== null ? { descricao } : {}),
          ...(tipo ? { tipo } : {}),
        },
      });

      return res.json(config);
    } catch (error) {
      // Caso a configuração não exista, criar automaticamente
      if (error.code === 'P2025') {
        const configCriada = await prisma.configuracao.create({
          data: {
            chave,
            valor: String(valor),
            descricao: descricao || undefined,
            tipo: tipo || 'text',
          },
        });

        return res.json(configCriada);
      }

      throw error;
    }
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
 */
async function criar(req, res) {
  try {
    const { chave, valor, descricao, tipo } = req.body;

    if (!chave || valor === undefined) {
      return res.status(400).json({
        erro: 'Chave e valor são obrigatórios',
      });
    }

    const config = await prisma.configuracao.create({
      data: {
        chave,
        valor: String(valor),
        descricao,
        tipo: tipo || 'text',
      },
    });

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
 */
async function remover(req, res) {
  try {
    const { chave } = req.params;

    await prisma.configuracao.delete({
      where: { chave },
    });

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
