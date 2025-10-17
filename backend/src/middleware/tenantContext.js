/**
 * Middleware de Tenant Context (Multi-Tenancy)
 *
 * Detecta o estabelecimento a partir de:
 * 1. Slug na URL (/admin/:slug, /:slug/cliente)
 * 2. Código na URL (/:codigo/cliente)
 * 3. Header x-tenant-code (para APIs)
 * 4. Query param ?tenant=slug
 *
 * Adiciona ao req:
 * - req.estabelecimentoId
 * - req.estabelecimento (objeto completo)
 * - req.isSuperAdmin (se é super admin)
 */

const prisma = require('../config/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'espeto-music-secret-key-change-in-production';

/**
 * Middleware principal - detecta e valida o estabelecimento
 */
async function tenantContext(req, res, next) {
  try {
    // 1. Super Admin não precisa de tenant
    if (req.path.startsWith('/api/super-admin')) {
      // Validar token JWT do Super Admin (exceto na rota de login)
      if (!req.path.includes('/login')) {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return res.status(401).json({
            error: 'Token não fornecido',
            message: 'Autenticação necessária'
          });
        }

        try {
          const decoded = jwt.verify(token, JWT_SECRET);

          // Verificar se é super admin
          if (decoded.tipo !== 'super-admin') {
            return res.status(403).json({
              error: 'Acesso negado',
              message: 'Esta rota é exclusiva para Super Administradores'
            });
          }

          // Buscar super admin no banco
          const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: decoded.id }
          });

          if (!superAdmin || !superAdmin.ativo) {
            return res.status(403).json({
              error: 'Acesso negado',
              message: 'Super Admin inativo ou não encontrado'
            });
          }

          req.superAdmin = superAdmin;
          req.isSuperAdmin = true;
        } catch (error) {
          return res.status(401).json({
            error: 'Token inválido',
            message: error.message
          });
        }
      } else {
        // Rota de login do super admin
        req.isSuperAdmin = true;
      }

      return next();
    }

    // 2. Tentar extrair identificador do estabelecimento
    let tenantIdentifier = extractTenantIdentifier(req);

    // 2.1. Se não encontrou tenant na URL/header, tentar extrair do JWT token
    if (!tenantIdentifier && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        // Se token tem estabelecimentoId, usar ele
        if (decoded.estabelecimentoId) {
          console.log('🔑 [TENANT] Estabelecimento extraído do JWT:', decoded.estabelecimentoId);
          req.estabelecimentoId = decoded.estabelecimentoId;

          // Buscar estabelecimento pelo ID
          const estabelecimento = await prisma.estabelecimento.findUnique({
            where: { id: decoded.estabelecimentoId }
          });

          if (estabelecimento && estabelecimento.ativo) {
            req.estabelecimento = estabelecimento;
            req.isSuperAdmin = false;
            console.log(`🏢 Tenant Context (do JWT): ${estabelecimento.nome} (${estabelecimento.slug})`);
            return next();
          }
        }
      } catch (error) {
        // Token inválido ou não tem estabelecimentoId - continua para verificar rotas públicas
        console.log('⚠️  [TENANT] Não foi possível extrair estabelecimento do JWT');
      }
    }

    if (!tenantIdentifier) {
      // Rotas públicas que não precisam de tenant
      const publicRoutes = [
        '/api/health',
        '/api/auth/super-admin/login',
        '/webhook',
      ];

      const isPublic = publicRoutes.some(route => req.path.startsWith(route));

      if (isPublic) {
        return next();
      }

      return res.status(400).json({
        error: 'Estabelecimento não identificado',
        message: 'Informe o slug ou código do estabelecimento na URL'
      });
    }

    // 3. Buscar estabelecimento no banco
    const estabelecimento = await findEstabelecimento(tenantIdentifier);

    if (!estabelecimento) {
      return res.status(404).json({
        error: 'Estabelecimento não encontrado',
        tenantIdentifier
      });
    }

    // 4. Validar se está ativo
    if (!estabelecimento.ativo) {
      return res.status(403).json({
        error: 'Estabelecimento desativado',
        message: 'Este estabelecimento foi desativado. Entre em contato com o suporte.'
      });
    }

    // 5. Verificar expiração do plano
    if (estabelecimento.dataExpiracao && estabelecimento.dataExpiracao < new Date()) {
      return res.status(403).json({
        error: 'Plano expirado',
        message: 'O plano deste estabelecimento expirou. Renove para continuar usando o sistema.',
        dataExpiracao: estabelecimento.dataExpiracao
      });
    }

    // 6. Adicionar ao contexto da requisição
    req.estabelecimentoId = estabelecimento.id;
    req.estabelecimento = estabelecimento;
    req.isSuperAdmin = false;

    // Log para debug (remover em produção)
    console.log(`🏢 Tenant Context: ${estabelecimento.nome} (${estabelecimento.slug})`);

    next();
  } catch (error) {
    console.error('❌ Erro no tenantContext middleware:', error);
    res.status(500).json({
      error: 'Erro ao identificar estabelecimento',
      message: error.message
    });
  }
}

/**
 * Extrai identificador do estabelecimento da requisição
 */
function extractTenantIdentifier(req) {
  // 1. Slug na URL do admin (/api/admin/:slug/...)
  if (req.params.slug) {
    return { type: 'slug', value: req.params.slug };
  }

  // 2. Código na URL (/api/:codigo/cliente ou /api/tv/:codigo)
  if (req.params.codigo) {
    return { type: 'codigo', value: req.params.codigo };
  }

  // 3. TV Code para autenticação
  if (req.params.tvCode) {
    return { type: 'tvCode', value: req.params.tvCode };
  }

  // 4. Header x-tenant-code (para APIs mobile/externas)
  const headerTenant = req.headers['x-tenant-code'] || req.headers['x-tenant-slug'];
  if (headerTenant) {
    return { type: 'header', value: headerTenant };
  }

  // 5. Query param ?tenant=slug
  if (req.query.tenant) {
    return { type: 'query', value: req.query.tenant };
  }

  return null;
}

/**
 * Busca estabelecimento por slug, código ou TV code
 */
async function findEstabelecimento(identifier) {
  if (!identifier) return null;

  const { type, value } = identifier;

  try {
    switch (type) {
      case 'slug':
        return await prisma.estabelecimento.findUnique({
          where: { slug: value }
        });

      case 'codigo':
        return await prisma.estabelecimento.findUnique({
          where: { codigo: value }
        });

      case 'tvCode':
        // Buscar estabelecimento pela TV
        const tv = await prisma.tV.findUnique({
          where: { codigo: value },
          include: { estabelecimento: true }
        });
        return tv?.estabelecimento || null;

      case 'header':
      case 'query':
        // Tentar por slug primeiro, depois por código
        const bySlug = await prisma.estabelecimento.findUnique({
          where: { slug: value }
        });

        if (bySlug) return bySlug;

        return await prisma.estabelecimento.findUnique({
          where: { codigo: value }
        });

      default:
        return null;
    }
  } catch (error) {
    console.error('Erro ao buscar estabelecimento:', error);
    return null;
  }
}

/**
 * Middleware para verificar limites do plano
 */
async function checkPlanLimits(req, res, next) {
  if (req.isSuperAdmin) {
    return next();
  }

  if (!req.estabelecimento) {
    return res.status(400).json({
      error: 'Estabelecimento não identificado'
    });
  }

  const estabelecimento = req.estabelecimento;

  // Verificar limite de músicas por mês
  if (estabelecimento.totalMusicasMes >= estabelecimento.limiteMusicasMes) {
    return res.status(403).json({
      error: 'Limite de músicas atingido',
      message: `Você atingiu o limite de ${estabelecimento.limiteMusicasMes} músicas por mês do plano ${estabelecimento.plano}.`,
      limite: estabelecimento.limiteMusicasMes,
      usado: estabelecimento.totalMusicasMes
    });
  }

  next();
}

/**
 * Middleware para garantir que apenas super admin acessa
 */
function requireSuperAdmin(req, res, next) {
  if (!req.isSuperAdmin) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta rota é exclusiva para Super Administradores'
    });
  }
  next();
}

/**
 * Middleware para garantir que está em um contexto de estabelecimento
 */
function requireTenant(req, res, next) {
  if (!req.estabelecimentoId) {
    return res.status(400).json({
      error: 'Estabelecimento não identificado',
      message: 'Esta rota requer um contexto de estabelecimento'
    });
  }
  next();
}

module.exports = {
  tenantContext,
  checkPlanLimits,
  requireSuperAdmin,
  requireTenant,
  extractTenantIdentifier,
  findEstabelecimento
};
