const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'espeto-music-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * Realiza login do administrador
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<Object>} Token JWT e dados do admin
 */
async function login(username, password) {
  try {
    // Buscar admin pelo username
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new Error('Credenciais inválidas');
    }

    if (!admin.ativo) {
      throw new Error('Usuário inativo');
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(password, admin.password);

    if (!senhaValida) {
      throw new Error('Credenciais inválidas');
    }

    // Atualizar último acesso
    await prisma.admin.update({
      where: { id: admin.id },
      data: { ultimoAcesso: new Date() },
    });

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        nome: admin.nome,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nome: admin.nome,
        ultimoAcesso: admin.ultimoAcesso,
      },
    };
  } catch (error) {
    console.error('Erro no login:', error.message);
    throw error;
  }
}

/**
 * Verifica se um token JWT é válido
 * @param {string} token - Token JWT
 * @returns {Promise<Object>} Dados do admin
 */
async function verificarToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar se admin ainda existe e está ativo
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin || !admin.ativo) {
      throw new Error('Token inválido');
    }

    return {
      id: admin.id,
      username: admin.username,
      nome: admin.nome,
    };
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    throw new Error('Token inválido ou expirado');
  }
}

/**
 * Cria um novo administrador
 * @param {Object} dados - Dados do admin
 * @returns {Promise<Object>} Admin criado
 */
async function criarAdmin({ username, password, nome }) {
  try {
    // Verificar se username já existe
    const existente = await prisma.admin.findUnique({
      where: { username },
    });

    if (existente) {
      throw new Error('Username já existe');
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(password, 10);

    // Criar admin
    const admin = await prisma.admin.create({
      data: {
        username,
        password: senhaHash,
        nome,
        ativo: true,
      },
    });

    return {
      id: admin.id,
      username: admin.username,
      nome: admin.nome,
      ativo: admin.ativo,
    };
  } catch (error) {
    console.error('Erro ao criar admin:', error.message);
    throw error;
  }
}

/**
 * Altera senha do administrador
 * @param {string} adminId - ID do admin
 * @param {string} senhaAtual - Senha atual
 * @param {string} senhaNova - Nova senha
 * @returns {Promise<boolean>} Sucesso
 */
async function alterarSenha(adminId, senhaAtual, senhaNova) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error('Admin não encontrado');
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, admin.password);

    if (!senhaValida) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(senhaNova, 10);

    // Atualizar senha
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: senhaHash },
    });

    return true;
  } catch (error) {
    console.error('Erro ao alterar senha:', error.message);
    throw error;
  }
}

module.exports = {
  login,
  verificarToken,
  criarAdmin,
  alterarSenha,
};
