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

    // Gerar slugPainelTV automaticamente (slug + timestamp para garantir unicidade)
    const timestamp = Date.now().toString().slice(-6);
    const slugPainelTV = `painel-${data.slug}-${timestamp}`;

    // Verificar se slugPainelTV já existe (improvável, mas garantir)
    const existentePainel = await this.locacaoRepository.findBySlugPainelTV(slugPainelTV);
    if (existentePainel) {
      throw new Error('Erro ao gerar slug do painel. Tente novamente.');
    }

    const baseUrl = process.env.BASE_URL || 'https://espeto.zapchatbr.com';

    // QR Code aponta para o PAINEL TV (que contém o slug do cliente embedded)
    const qrCodeData = `${baseUrl}/painel/${slugPainelTV}`;

    // Criar locação
    const locacao = new Locacao({
      ...data,
      slugPainelTV,
      qrCodeData,
      totalPedidos: 0,
      totalArrecadado: 0
    });

    return await this.locacaoRepository.create(locacao);
  }
}

module.exports = CriarLocacaoUseCase;
