const moderationService = require('../services/moderationService');

/**
 * Lista todas as palavras proibidas
 */
async function listarPalavras(req, res) {
  try {
    const { categoria, severidade, ativo } = req.query;

    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (severidade) filtros.severidade = severidade;
    if (ativo !== undefined) filtros.ativo = ativo === 'true';

    const palavras = await moderationService.listarPalavrasProibidas(filtros);
    res.json(palavras);
  } catch (error) {
    console.error('Erro ao listar palavras proibidas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Adiciona nova palavra proibida
 */
async function adicionarPalavra(req, res) {
  try {
    const { palavra, categoria, severidade } = req.body;

    if (!palavra) {
      return res.status(400).json({ error: 'Palavra é obrigatória' });
    }

    const novaPalavra = await moderationService.adicionarPalavraProibida({
      palavra,
      categoria: categoria || 'AMBOS',
      severidade: severidade || 'MEDIA',
    });

    res.status(201).json(novaPalavra);
  } catch (error) {
    console.error('Erro ao adicionar palavra proibida:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Atualiza palavra proibida existente
 */
async function atualizarPalavra(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;

    const palavra = await moderationService.atualizarPalavraProibida(id, dados);
    res.json(palavra);
  } catch (error) {
    console.error('Erro ao atualizar palavra proibida:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Deleta palavra proibida
 */
async function deletarPalavra(req, res) {
  try {
    const { id } = req.params;

    await moderationService.deletarPalavraProibida(id);
    res.json({ success: true, message: 'Palavra proibida deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar palavra proibida:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Ativa/desativa palavra proibida
 */
async function togglePalavra(req, res) {
  try {
    const { id } = req.params;

    const palavra = await moderationService.togglePalavraProibida(id);
    res.json(palavra);
  } catch (error) {
    console.error('Erro ao toggle palavra proibida:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Busca estatísticas de moderação
 */
async function estatisticas(req, res) {
  try {
    const prisma = require('../config/database');

    const [total, porSeveridade, porCategoria, ativos] = await Promise.all([
      prisma.palavras_proibidas.count(),
      prisma.$queryRaw`
        SELECT severidade, COUNT(*) as total
        FROM palavras_proibidas
        GROUP BY severidade
      `,
      prisma.$queryRaw`
        SELECT categoria, COUNT(*) as total
        FROM palavras_proibidas
        GROUP BY categoria
      `,
      prisma.palavras_proibidas.count({ where: { ativo: true } }),
    ]);

    res.json({
      total,
      ativos,
      inativos: total - ativos,
      porSeveridade,
      porCategoria,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Testa texto contra palavras proibidas
 */
async function testarTexto(req, res) {
  try {
    const { texto, categoria } = req.body;

    if (!texto) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    const resultado = await moderationService.verificarTexto(
      texto,
      categoria || 'AMBOS'
    );

    res.json({
      texto,
      categoria,
      encontradas: resultado.encontradas,
      severidadeMaxima: resultado.severidadeMaxima,
      bloqueado: resultado.encontradas.length > 0,
    });
  } catch (error) {
    console.error('Erro ao testar texto:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listarPalavras,
  adicionarPalavra,
  atualizarPalavra,
  deletarPalavra,
  togglePalavra,
  estatisticas,
  testarTexto,
};
