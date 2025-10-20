/**
 * Use Case: Criar Locação
 *
 * Cria uma nova locação temporária do sistema com customizações
 */

const Locacao = require('../../../domain/entities/Locacao');

class CriarLocacaoUseCase {
  constructor(locacaoRepository) {
    this.locacaoRepository = locacaoRepository;
  }

  async execute(data) {
    // Validar dados
    const errors = Locacao.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join(', ')}`);
    }

    // Verificar se slug já existe
    const existente = await this.locacaoRepository.findBySlug(data.slug);
    if (existente) {
      throw new Error('Já existe uma locação com este slug');
    }

    // Gerar QR Code data (URL da locação)
    const qrCodeData = `${process.env.BASE_URL || 'https://espeto.zapchatbr.com'}/l/${data.slug}`;

    // Criar locação
    const locacao = new Locacao({
      ...data,
      qrCodeData,
      totalPedidos: 0,
      totalArrecadado: 0
    });

    return await this.locacaoRepository.create(locacao);
  }
}

module.exports = CriarLocacaoUseCase;
