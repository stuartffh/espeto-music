const { verificarToken } = require('../services/authService');

/**
 * Middleware para proteger rotas admin
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        erro: 'Token não fornecido',
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        erro: 'Formato de token inválido',
      });
    }

    const token = parts[1];

    // Verificar token
    const admin = await verificarToken(token);

    // Adicionar admin ao request
    req.admin = admin;

    next();
  } catch (error) {
    return res.status(401).json({
      erro: 'Token inválido ou expirado',
    });
  }
}

module.exports = authMiddleware;
