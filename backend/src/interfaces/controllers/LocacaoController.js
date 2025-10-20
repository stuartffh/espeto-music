/**
 * Controller: LocacaoController
 *
 * Endpoints para gerenciar locações temporárias do sistema
 */

class LocacaoController {
  constructor({
    criarLocacaoUseCase,
    listarLocacoesUseCase,
    obterLocacaoPorSlugUseCase,
    atualizarLocacaoUseCase,
    locacaoRepository
  }) {
    this.criarLocacaoUseCase = criarLocacaoUseCase;
    this.listarLocacoesUseCase = listarLocacoesUseCase;
    this.obterLocacaoPorSlugUseCase = obterLocacaoPorSlugUseCase;
    this.atualizarLocacaoUseCase = atualizarLocacaoUseCase;
    this.locacaoRepository = locacaoRepository;
  }

  /**
   * POST /api/admin/locacoes
   * Criar nova locação
   */
  async criar(req, res) {
    try {
      const locacao = await this.criarLocacaoUseCase.execute(req.body);

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
  }

  /**
   * GET /api/admin/locacoes
   * Listar todas as locações
   */
  async listar(req, res) {
    try {
      const { status, ativo } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (ativo !== undefined) filters.ativo = ativo === 'true';

      const locacoes = await this.listarLocacoesUseCase.execute(filters);

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
  }

  /**
   * GET /api/admin/locacoes/:id
   * Obter locação por ID
   */
  async obter(req, res) {
    try {
      const locacao = await this.locacaoRepository.findById(req.params.id);

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
  }

  /**
   * GET /api/public/locacao/:slug
   * Obter locação por slug (público - para clientes)
   */
  async obterPorSlug(req, res) {
    try {
      const locacao = await this.obterLocacaoPorSlugUseCase.execute(
        req.params.slug,
        { apenasAtivas: true }
      );

      res.json({
        sucesso: true,
        locacao
      });
    } catch (error) {
      console.error('Erro ao obter locação por slug:', error);
      res.status(error.message.includes('não encontrada') || error.message.includes('não está ativa') ? 404 : 500).json({
        sucesso: false,
        erro: error.message
      });
    }
  }

  /**
   * PUT /api/admin/locacoes/:id
   * Atualizar locação
   */
  async atualizar(req, res) {
    try {
      const locacao = await this.atualizarLocacaoUseCase.execute(
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
  }

  /**
   * DELETE /api/admin/locacoes/:id
   * Desativar locação
   */
  async desativar(req, res) {
    try {
      await this.locacaoRepository.desativar(req.params.id);

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
  }

  /**
   * POST /api/admin/locacoes/:id/reativar
   * Reativar locação
   */
  async reativar(req, res) {
    try {
      await this.locacaoRepository.reativar(req.params.id);

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
  }

  /**
   * GET /api/admin/locacoes/:id/estatisticas
   * Obter estatísticas da locação
   */
  async obterEstatisticas(req, res) {
    try {
      const stats = await this.locacaoRepository.getEstatisticas(req.params.id);

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
  }
}

module.exports = LocacaoController;
