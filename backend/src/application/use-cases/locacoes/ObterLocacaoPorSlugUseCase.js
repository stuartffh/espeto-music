/**
 * Use Case: Obter Locação por Slug
 *
 * Busca uma locação pelo slug e valida se está ativa
 */

class ObterLocacaoPorSlugUseCase {
  constructor(locacaoRepository) {
    this.locacaoRepository = locacaoRepository;
  }

  async execute(slug, options = {}) {
    const locacao = await this.locacaoRepository.findBySlug(slug);

    if (!locacao) {
      throw new Error('Locação não encontrada');
    }

    // Se pediu apenas ativas, validar
    if (options.apenasAtivas && !locacao.isAtiva()) {
      throw new Error('Locação não está ativa ou está fora do período válido');
    }

    return {
      ...locacao.toObject(),
      isAtiva: locacao.isAtiva(),
      isExpirada: locacao.isExpirada(),
      isPendente: locacao.isPendente(),
      configuracoesParsed: locacao.getConfiguracoes()
    };
  }
}

module.exports = ObterLocacaoPorSlugUseCase;
