const trendingService = require('../services/trendingService');

/**
 * GET /api/sugestoes/:categoria
 * Busca sugestões por categoria
 */
async function buscarPorCategoria(req, res) {
  try {
    const { categoria } = req.params;
    const sugestoes = await trendingService.buscarSugestoesPorCategoria(categoria);

    res.json(sugestoes);
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    res.status(500).json({
      erro: 'Erro ao buscar sugestões',
    });
  }
}

/**
 * POST /api/sugestoes/atualizar
 * Atualiza sugestões trending (requer autenticação admin)
 */
async function atualizarTrending(req, res) {
  try {
    const resultado = await trendingService.atualizarTodasSugestoes();

    res.json({
      mensagem: 'Sugestões atualizadas com sucesso!',
      ...resultado,
    });
  } catch (error) {
    console.error('Erro ao atualizar sugestões:', error);
    res.status(500).json({
      erro: 'Erro ao atualizar sugestões',
    });
  }
}

/**
 * GET /api/sugestoes/populares
 * Busca termos mais populares
 */
async function buscarPopulares(req, res) {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const termos = await trendingService.buscarTermosPopulares(limite);

    res.json(termos);
  } catch (error) {
    console.error('Erro ao buscar populares:', error);
    res.status(500).json({
      erro: 'Erro ao buscar termos populares',
    });
  }
}

module.exports = {
  buscarPorCategoria,
  atualizarTrending,
  buscarPopulares,
};
