const historicoService = require('../services/historicoService');

/**
 * Busca histórico de músicas tocadas
 * GET /api/historico
 */
exports.buscarHistorico = async (req, res) => {
  try {
    const filtros = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      dataInicio: req.query.dataInicio,
      dataFim: req.query.dataFim,
      tipo: req.query.tipo,
      nomeCliente: req.query.nomeCliente,
      musicaTitulo: req.query.musicaTitulo
    };

    const resultado = await historicoService.buscarHistorico(filtros);

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
    const periodo = req.query.periodo || 'hoje'; // hoje, semana, mes

    const estatisticas = await historicoService.buscarEstatisticas(periodo);

    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};