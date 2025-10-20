/**
 * Use Case: Atualizar Locação
 *
 * Atualiza dados de uma locação existente
 */

const Locacao = require('../../../domain/entities/Locacao');

class AtualizarLocacaoUseCase {
  constructor(locacaoRepository) {
    this.locacaoRepository = locacaoRepository;
  }

  async execute(id, data) {
    const locacao = await this.locacaoRepository.findById(id);

    if (!locacao) {
      throw new Error('Locação não encontrada');
    }

    // Se está alterando slug, verificar se novo slug já existe
    if (data.slug && data.slug !== locacao.slug) {
      const existente = await this.locacaoRepository.findBySlug(data.slug);
      if (existente) {
        throw new Error('Já existe uma locação com este slug');
      }

      // Atualizar QR Code data se slug mudou
      data.qrCodeData = `${process.env.BASE_URL || 'https://espeto.zapchatbr.com'}/l/${data.slug}`;
    }

    // Validar dados parcialmente
    const dadosCompletos = { ...locacao.toObject(), ...data };
    const errors = Locacao.validate(dadosCompletos);
    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join(', ')}`);
    }

    return await this.locacaoRepository.update(id, data);
  }
}

module.exports = AtualizarLocacaoUseCase;
