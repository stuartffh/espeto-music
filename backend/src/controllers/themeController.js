const themeService = require('../services/themeService');

/**
 * GET /api/theme
 * Obter tema ativo
 */
async function obterTema(req, res) {
  try {
    const tema = await themeService.obterTemaAtivo();
    res.json(tema);
  } catch (error) {
    console.error('Erro ao obter tema:', error);
    res.status(500).json({ erro: error.message });
  }
}

/**
 * GET /api/theme/css
 * Obter CSS customizado baseado no tema
 */
async function obterCss(req, res) {
  try {
    const tema = await themeService.obterTemaAtivo();
    const css = themeService.gerarCssCustomizado(tema);

    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    console.error('Erro ao gerar CSS:', error);
    res.status(500).send('/* Erro ao gerar CSS */');
  }
}

/**
 * PUT /api/admin/theme
 * Atualizar tema (requer autenticação de admin)
 */
async function atualizarTema(req, res) {
  try {
    const dados = req.body;

    // Validação básica
    if (dados.corPrimaria && !/^#[0-9A-F]{6}$/i.test(dados.corPrimaria)) {
      return res.status(400).json({ erro: 'Cor primária inválida. Use formato hexadecimal (#RRGGBB)' });
    }

    const tema = await themeService.atualizarTema(dados);
    res.json(tema);
  } catch (error) {
    console.error('Erro ao atualizar tema:', error);
    res.status(500).json({ erro: error.message });
  }
}

/**
 * POST /api/admin/theme/reset
 * Resetar tema para valores padrão (requer autenticação de admin)
 */
async function resetarTema(req, res) {
  try {
    const tema = await themeService.resetarTema();
    res.json(tema);
  } catch (error) {
    console.error('Erro ao resetar tema:', error);
    res.status(500).json({ erro: error.message });
  }
}

module.exports = {
  obterTema,
  obterCss,
  atualizarTema,
  resetarTema
};
