/**
 * Use Case: Listar Locações
 *
 * Lista locações com filtros opcionais
 */

class ListarLocacoesUseCase {
  constructor(locacaoRepository) {
    this.locacaoRepository = locacaoRepository;
  }

  async execute(filters = {}) {
    const locacoes = await this.locacaoRepository.findAll(filters);

    // Adicionar status calculado
    return locacoes.map(locacao => ({
      ...locacao.toObject(),
      statusCalculado: this._calcularStatus(locacao),
      diasRestantes: this._calcularDiasRestantes(locacao)
    }));
  }

  _calcularStatus(locacao) {
    if (!locacao.ativo) return 'inativa';
    if (locacao.isExpirada()) return 'expirada';
    if (locacao.isPendente()) return 'pendente';
    if (locacao.isAtiva()) return 'ativa';
    return 'desconhecido';
  }

  _calcularDiasRestantes(locacao) {
    const agora = new Date();
    const fim = new Date(locacao.dataFim);
    const diffTime = fim - agora;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}

module.exports = ListarLocacoesUseCase;
