const historicoService = require('../services/historicoService');

/**
 * Busca histórico de músicas tocadas
 * GET /api/historico
 */
exports.buscarHistorico = async (req, res) => {
  try {
    // Buscar primeiro estabelecimento (multi-tenant seria por auth)
    const prisma = require('../config/database');
    const estabelecimento = await prisma.estabelecimentos.findFirst();

    if (!estabelecimento) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    const filtros = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      dataInicio: req.query.dataInicio,
      dataFim: req.query.dataFim,
      tipo: req.query.tipo,
      nomeCliente: req.query.nomeCliente,
      musicaTitulo: req.query.musicaTitulo
    };

    const resultado = await historicoService.buscarHistorico(estabelecimento.id, filtros);

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
};

/**
 * Busca estatísticas do histórico
 * GET /api/historico/estatisticas
 */
exports.buscarEstatisticas = async (req, res) => {
  try {
    const prisma = require('../config/database');
    const estabelecimento = await prisma.estabelecimentos.findFirst();

    if (!estabelecimento) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    const periodo = req.query.periodo || 'hoje'; // hoje, semana, mes

    const estatisticas = await historicoService.buscarEstatisticas(estabelecimento.id, periodo);

    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
