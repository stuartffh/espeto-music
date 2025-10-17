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
 * @param {string} estabelecimentoId - ID do estabelecimento (requerido em multi-tenant)
 * @returns {Promise<Object>} Token JWT e dados do admin
 */
async function login(username, password, estabelecimentoId = null) {
  try {
    // MULTI-TENANT: Buscar admin pelo username E estabelecimentoId
    // Nota: username NÃO é unique globalmente, apenas dentro do estabelecimento
    let admin;

    if (estabelecimentoId) {
      // Se fornecido estabelecimentoId, buscar direto
      admin = await prisma.admin.findFirst({
        where: {
          username,
          estabelecimentoId
        },
        include: {
          estabelecimento: true
        }
      });
    } else {
      // Fallback: buscar por username (pode retornar múltiplos em sistema multi-tenant)
      const admins = await prisma.admin.findMany({
        where: { username },
        include: {
          estabelecimento: true
        }
      });

      if (admins.length === 0) {
        throw new Error('Credenciais inválidas');
      }

      if (admins.length > 1) {
        throw new Error('Múltiplos estabelecimentos encontrados. Informe o slug do estabelecimento na URL.');
      }

      admin = admins[0];
    }

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
        estabelecimentoId: admin.estabelecimentoId,
        tipo: 'admin'
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
        estabelecimentoId: admin.estabelecimentoId,
        estabelecimento: {
          id: admin.estabelecimento.id,
          nome: admin.estabelecimento.nome,
          slug: admin.estabelecimento.slug,
          codigo: admin.estabelecimento.codigo
        }
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
      include: {
        estabelecimento: true // MULTI-TENANT: Incluir dados do estabelecimento
      }
    });

    if (!admin || !admin.ativo) {
      throw new Error('Token inválido');
    }

    return {
      id: admin.id,
      username: admin.username,
      nome: admin.nome,
      ultimoAcesso: admin.ultimoAcesso,
      estabelecimentoId: admin.estabelecimentoId,
      estabelecimento: {
        id: admin.estabelecimento.id,
        nome: admin.estabelecimento.nome,
        slug: admin.estabelecimento.slug,
        codigo: admin.estabelecimento.codigo
      }
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
