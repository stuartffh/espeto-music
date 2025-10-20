/**
 * Controller: Locações
 *
 * Gerencia locações temporárias do sistema (multi-tenancy)
 */

const prisma = require('../config/database');
const Locacao = require('../domain/entities/Locacao');
const PrismaLocacaoRepository = require('../infrastructure/repositories/PrismaLocacaoRepository');
const CriarLocacaoUseCase = require('../application/use-cases/locacoes/CriarLocacaoUseCase');
const ListarLocacoesUseCase = require('../application/use-cases/locacoes/ListarLocacoesUseCase');
const ObterLocacaoPorSlugUseCase = require('../application/use-cases/locacoes/ObterLocacaoPorSlugUseCase');
const AtualizarLocacaoUseCase = require('../application/use-cases/locacoes/AtualizarLocacaoUseCase');

// Inicializar dependências
const locacaoRepository = new PrismaLocacaoRepository(prisma);
const criarLocacaoUseCase = new CriarLocacaoUseCase(locacaoRepository);
const listarLocacoesUseCase = new ListarLocacoesUseCase(locacaoRepository);
const obterLocacaoPorSlugUseCase = new ObterLocacaoPorSlugUseCase(locacaoRepository);
const atualizarLocacaoUseCase = new AtualizarLocacaoUseCase(locacaoRepository);

/**
 * POST /api/admin/locacoes
 * Criar nova locação
 */
exports.criar = async (req, res) => {
  try {
    const locacao = await criarLocacaoUseCase.execute(req.body);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Locação criada com sucesso',
      locacao: locacao.toObject()
    });
  } catch (error) {
    console.error('Erro ao criar locação:', error);
    res.status(400).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * GET /api/admin/locacoes
 * Listar todas as locações
 */
exports.listar = async (req, res) => {
  try {
    const { status, ativo } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (ativo !== undefined) filters.ativo = ativo === 'true';

    const locacoes = await listarLocacoesUseCase.execute(filters);

    res.json({
      sucesso: true,
      total: locacoes.length,
      locacoes
    });
  } catch (error) {
    console.error('Erro ao listar locações:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * GET /api/admin/locacoes/:id
 * Obter locação por ID
 */
exports.obter = async (req, res) => {
  try {
    const locacao = await locacaoRepository.findById(req.params.id);

    if (!locacao) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Locação não encontrada'
      });
    }

    res.json({
      sucesso: true,
      locacao: {
        ...locacao.toObject(),
        isAtiva: locacao.isAtiva(),
        isExpirada: locacao.isExpirada(),
        isPendente: locacao.isPendente(),
        configuracoesParsed: locacao.getConfiguracoes()
      }
    });
  } catch (error) {
    console.error('Erro ao obter locação:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * GET /api/public/locacao/:slug
 * Obter locação por slug (público - para clientes)
 */
exports.obterPorSlug = async (req, res) => {
  try {
    const locacao = await obterLocacaoPorSlugUseCase.execute(
      req.params.slug,
      { apenasAtivas: true }
    );

    res.json({
      sucesso: true,
      locacao
    });
  } catch (error) {
    console.error('Erro ao obter locação por slug:', error);
    const statusCode = error.message.includes('não encontrada') || error.message.includes('não está ativa') ? 404 : 500;
    res.status(statusCode).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * GET /api/public/painel/:slugPainelTV
 * Obter locação por slugPainelTV (público - para painel TV)
 */
exports.obterPorSlugPainelTV = async (req, res) => {
  try {
    const locacao = await locacaoRepository.findBySlugPainelTV(req.params.slugPainelTV);

    if (!locacao) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Painel não encontrado'
      });
    }

    // Verificar se a locação está ativa
    if (!locacao.ativo || !locacao.isAtiva()) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Esta locação não está ativa no momento'
      });
    }

    res.json({
      sucesso: true,
      locacao: locacao.toObject()
    });
  } catch (error) {
    console.error('Erro ao obter locação por slugPainelTV:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * PUT /api/admin/locacoes/:id
 * Atualizar locação
 */
exports.atualizar = async (req, res) => {
  try {
    const locacao = await atualizarLocacaoUseCase.execute(
      req.params.id,
      req.body
    );

    res.json({
      sucesso: true,
      mensagem: 'Locação atualizada com sucesso',
      locacao: locacao.toObject()
    });
  } catch (error) {
    console.error('Erro ao atualizar locação:', error);
    res.status(400).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * DELETE /api/admin/locacoes/:id
 * Desativar locação
 */
exports.desativar = async (req, res) => {
  try {
    await locacaoRepository.desativar(req.params.id);

    res.json({
      sucesso: true,
      mensagem: 'Locação desativada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desativar locação:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * POST /api/admin/locacoes/:id/reativar
 * Reativar locação
 */
exports.reativar = async (req, res) => {
  try {
    await locacaoRepository.reativar(req.params.id);

    res.json({
      sucesso: true,
      mensagem: 'Locação reativada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao reativar locação:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

/**
 * GET /api/admin/locacoes/:id/estatisticas
 * Obter estatísticas da locação
 */
exports.obterEstatisticas = async (req, res) => {
  try {
    const stats = await locacaoRepository.getEstatisticas(req.params.id);

    if (!stats) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Locação não encontrada'
      });
    }

    res.json({
      sucesso: true,
      estatisticas: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};
