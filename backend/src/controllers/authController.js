const authService = require('../services/authService');

/**
 * POST /api/auth/login
 * Realiza login do administrador
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        erro: 'Username e senha são obrigatórios',
      });
    }

    const resultado = await authService.login(username, password);

    res.json(resultado);
  } catch (error) {
    res.status(401).json({
      erro: error.message,
    });
  }
}

/**
 * POST /api/auth/verificar
 * Verifica se o token é válido
 */
async function verificar(req, res) {
  try {
    // Se chegou aqui, o middleware já verificou o token
    res.json({
      admin: req.admin,
    });
  } catch (error) {
    res.status(401).json({
      erro: 'Token inválido',
    });
  }
}

/**
 * POST /api/auth/alterar-senha
 * Altera senha do administrador
 */
async function alterarSenha(req, res) {
  try {
    const { senhaAtual, senhaNova } = req.body;

    if (!senhaAtual || !senhaNova) {
      return res.status(400).json({
        erro: 'Senha atual e nova senha são obrigatórias',
      });
    }

    if (senhaNova.length < 6) {
      return res.status(400).json({
        erro: 'Nova senha deve ter no mínimo 6 caracteres',
      });
    }

    await authService.alterarSenha(req.admin.id, senhaAtual, senhaNova);

    res.json({
      mensagem: 'Senha alterada com sucesso',
    });
  } catch (error) {
    res.status(400).json({
      erro: error.message,
    });
  }
}

module.exports = {
  login,
  verificar,
  alterarSenha,
};
