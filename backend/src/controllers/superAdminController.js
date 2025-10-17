/**
 * Controller do Super Admin
 *
 * Gerencia estabelecimentos, visualiza estatísticas globais
 */

const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Dashboard - Estatísticas globais
 */
async function dashboard(req, res) {
  try {
    const [
      totalEstabelecimentos,
      estabelecimentosAtivos,
      totalTVs,
      tvsOnline,
      totalAdmins,
      totalPedidos,
      totalMusicasHoje
    ] = await Promise.all([
      prisma.estabelecimento.count(),
      prisma.estabelecimento.count({ where: { ativo: true } }),
      prisma.tV.count(),
      prisma.tV.count({ where: { online: true } }),
      prisma.admin.count(),
      prisma.pedidoMusica.count(),
      prisma.pedidoMusica.count({
        where: {
          criadoEm: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    // Estabelecimentos por plano
    const estabelecimentosPorPlano = await prisma.estabelecimento.groupBy({
      by: ['plano'],
      _count: true
    });

    // Top 5 estabelecimentos com mais músicas
    const topEstabelecimentos = await prisma.pedidoMusica.groupBy({
      by: ['estabelecimentoId'],
      _count: true,
      orderBy: {
        _count: {
          estabelecimentoId: 'desc'
        }
      },
      take: 5
    });

    // Buscar nomes dos estabelecimentos
    const estabelecimentosIds = topEstabelecimentos.map(e => e.estabelecimentoId);
    const estabelecimentos = await prisma.estabelecimento.findMany({
      where: { id: { in: estabelecimentosIds } },
      select: { id: true, nome: true, slug: true }
    });

    const topComNomes = topEstabelecimentos.map(top => {
      const est = estabelecimentos.find(e => e.id === top.estabelecimentoId);
      return {
        estabelecimento: est,
        totalMusicas: top._count
      };
    });

    res.json({
      resumo: {
        totalEstabelecimentos,
        estabelecimentosAtivos,
        totalTVs,
        tvsOnline,
        totalAdmins,
        totalPedidos,
        totalMusicasHoje
      },
      estabelecimentosPorPlano: estabelecimentosPorPlano.map(p => ({
        plano: p.plano,
        quantidade: p._count
      })),
      topEstabelecimentos: topComNomes
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Listar todos estabelecimentos
 */
async function listarEstabelecimentos(req, res) {
  try {
    const { ativo, plano, busca, page = 1, limit = 20 } = req.query;

    const where = {};

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    if (plano) {
      where.plano = plano;
    }

    if (busca) {
      where.OR = [
        { nome: { contains: busca } },
        { slug: { contains: busca } },
        { codigo: { contains: busca } },
        { email: { contains: busca } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [estabelecimentos, total] = await Promise.all([
      prisma.estabelecimento.findMany({
        where,
        include: {
          _count: {
            select: {
              tvs: true,
              admins: true,
              pedidosMusica: true
            }
          }
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.estabelecimento.count({ where })
    ]);

    res.json({
      estabelecimentos,
      paginacao: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar estabelecimentos:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Buscar estabelecimento por ID
 */
async function buscarEstabelecimento(req, res) {
  try {
    const { id } = req.params;

    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            id: true,
            username: true,
            nome: true,
            email: true,
            ativo: true,
            ultimoAcesso: true
          }
        },
        tvs: true,
        _count: {
          select: {
            pedidosMusica: true,
            pagamentos: true,
            giftCards: true,
            configuracoes: true
          }
        }
      }
    });

    if (!estabelecimento) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    // Estatísticas adicionais
    const musicasHoje = await prisma.pedidoMusica.count({
      where: {
        estabelecimentoId: id,
        criadoEm: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    res.json({
      ...estabelecimento,
      estatisticas: {
        musicasHoje
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estabelecimento:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Criar novo estabelecimento
 */
async function criarEstabelecimento(req, res) {
  try {
    const {
      nome,
      slug,
      codigo,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      plano = 'basico',
      limiteTVs,
      limiteMusicasMes,
      adminNome,
      adminEmail,
      adminTelefone,
      adminUsername,
      adminPassword,
      observacoes
    } = req.body;

    // Validações
    if (!nome || !slug || !codigo) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, slug, codigo'
      });
    }

    if (!adminNome || !adminUsername || !adminPassword) {
      return res.status(400).json({
        error: 'Dados do admin são obrigatórios: adminNome, adminUsername, adminPassword'
      });
    }

    // Verificar duplicados
    const existente = await prisma.estabelecimento.findFirst({
      where: {
        OR: [
          { slug },
          { codigo }
        ]
      }
    });

    if (existente) {
      return res.status(400).json({
        error: 'Slug ou código já em uso',
        conflito: existente.slug === slug ? 'slug' : 'codigo'
      });
    }

    // Definir limites baseado no plano
    const limites = getLimitesPorPlano(plano);

    // Criar estabelecimento
    const estabelecimento = await prisma.estabelecimento.create({
      data: {
        nome,
        slug,
        codigo,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        plano,
        limiteTVs: limiteTVs || limites.tvs,
        limiteMusicasMes: limiteMusicasMes || limites.musicas,
        adminNome,
        adminEmail: adminEmail || email,
        adminTelefone: adminTelefone || telefone,
        observacoes,
        ativo: true
      }
    });

    // Criar admin do estabelecimento
    const adminHash = await bcrypt.hash(adminPassword, 10);

    await prisma.admin.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        username: adminUsername,
        password: adminHash,
        nome: adminNome,
        email: adminEmail || email,
        ativo: true
      }
    });

    // Criar estado do player
    await prisma.estadoPlayer.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        status: 'stopped',
        tempoAtual: 0,
        volume: 80
      }
    });

    // Criar tema padrão
    await prisma.tema.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        nome: estabelecimento.nome
      }
    });

    console.log(`✅ Estabelecimento criado: ${estabelecimento.nome} (${estabelecimento.slug})`);

    res.status(201).json({
      message: 'Estabelecimento criado com sucesso',
      estabelecimento: {
        id: estabelecimento.id,
        nome: estabelecimento.nome,
        slug: estabelecimento.slug,
        codigo: estabelecimento.codigo
      }
    });
  } catch (error) {
    console.error('Erro ao criar estabelecimento:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Atualizar estabelecimento
 */
async function atualizarEstabelecimento(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;

    // Remover campos que não podem ser atualizados diretamente
    delete dados.id;
    delete dados.criadoEm;
    delete dados.totalMusicasMes;
    delete dados.ultimoResetMes;

    const estabelecimento = await prisma.estabelecimento.update({
      where: { id },
      data: dados
    });

    res.json({
      message: 'Estabelecimento atualizado',
      estabelecimento
    });
  } catch (error) {
    console.error('Erro ao atualizar estabelecimento:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Ativar/Desativar estabelecimento
 */
async function toggleAtivo(req, res) {
  try {
    const { id } = req.params;

    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { id }
    });

    if (!estabelecimento) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    const atualizado = await prisma.estabelecimento.update({
      where: { id },
      data: { ativo: !estabelecimento.ativo }
    });

    res.json({
      message: `Estabelecimento ${atualizado.ativo ? 'ativado' : 'desativado'}`,
      estabelecimento: atualizado
    });
  } catch (error) {
    console.error('Erro ao toggle ativo:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Deletar estabelecimento (soft delete - apenas desativa)
 */
async function deletarEstabelecimento(req, res) {
  try {
    const { id } = req.params;

    await prisma.estabelecimento.update({
      where: { id },
      data: { ativo: false }
    });

    res.json({
      message: 'Estabelecimento desativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar estabelecimento:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reset contador de músicas mensal
 */
async function resetContadorMusicas(req, res) {
  try {
    const { id } = req.params;

    const estabelecimento = await prisma.estabelecimento.update({
      where: { id },
      data: {
        totalMusicasMes: 0,
        ultimoResetMes: new Date()
      }
    });

    res.json({
      message: 'Contador de músicas resetado',
      estabelecimento
    });
  } catch (error) {
    console.error('Erro ao resetar contador:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Login do Super Admin
 */
async function login(req, res) {
  try {
    const { username, senha } = req.body;

    // Validações
    if (!username || !senha) {
      return res.status(400).json({
        erro: 'Username e senha são obrigatórios'
      });
    }

    // Buscar super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { username }
    });

    if (!superAdmin) {
      return res.status(401).json({
        erro: 'Credenciais inválidas'
      });
    }

    // Verificar se está ativo
    if (!superAdmin.ativo) {
      return res.status(403).json({
        erro: 'Conta desativada. Entre em contato com o administrador do sistema.'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, superAdmin.password);

    if (!senhaValida) {
      return res.status(401).json({
        erro: 'Credenciais inválidas'
      });
    }

    // Gerar token JWT (você pode usar jwt.sign se tiver configurado)
    // Por enquanto, vamos usar um token simples
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: superAdmin.id,
        username: superAdmin.username,
        tipo: 'super-admin'
      },
      process.env.JWT_SECRET || 'secret-super-admin-key',
      { expiresIn: '24h' }
    );

    // Retornar dados (sem a senha)
    const { senha: _, ...superAdminSemSenha } = superAdmin;

    res.json({
      token,
      superAdmin: superAdminSemSenha,
      message: 'Login realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
}

/**
 * Definir limites por plano
 */
function getLimitesPorPlano(plano) {
  const planos = {
    basico: { tvs: 2, musicas: 1000 },
    pro: { tvs: 5, musicas: 5000 },
    enterprise: { tvs: 999, musicas: 999999 }
  };

  return planos[plano] || planos.basico;
}

module.exports = {
  login,
  dashboard,
  listarEstabelecimentos,
  buscarEstabelecimento,
  criarEstabelecimento,
  atualizarEstabelecimento,
  toggleAtivo,
  deletarEstabelecimento,
  resetContadorMusicas
};
