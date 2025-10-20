/**
 * Domain Entity: GiftCard
 *
 * Representa um gift card com regras de uso e validação
 */

const Money = require('../value-objects/Money');

class GiftCard {
  constructor({
    id,
    codigo,
    valor,
    quantidadeMusicas,
    quantidadeMusicasUsadas,
    dataExpiracao,
    observacao,
    ativo,
    criadoEm,
    atualizadoEm,
  }) {
    // Validações
    if (!codigo) {
      throw new Error('Código do gift card é obrigatório');
    }
    if (quantidadeMusicas <= 0) {
      throw new Error('Quantidade de músicas deve ser positiva');
    }

    // Usar Value Object para valor
    const valorMonetario = valor instanceof Money ? valor : new Money(valor || 0);

    this.id = id;
    this.codigo = codigo;
    this.valor = valorMonetario;
    this.quantidadeMusicas = quantidadeMusicas;
    this.quantidadeMusicasUsadas = quantidadeMusicasUsadas || 0;
    this.dataExpiracao = dataExpiracao || null;
    this.observacao = observacao || null;
    this.ativo = ativo !== undefined ? ativo : true;
    this.criadoEm = criadoEm || new Date();
    this.atualizadoEm = atualizadoEm || new Date();
  }

  // ========== REGRAS DE NEGÓCIO ==========

  /**
   * Usa uma música do gift card
   */
  usarMusica() {
    if (!this.podeSerUsado()) {
      const motivos = [];
      if (!this.ativo) motivos.push('inativo');
      if (this.estaExpirado()) motivos.push('expirado');
      if (!this.temMusicasDisponiveis()) motivos.push('sem músicas disponíveis');
      throw new Error(`Gift card não pode ser usado: ${motivos.join(', ')}`);
    }

    this.quantidadeMusicasUsadas += 1;
    this.atualizadoEm = new Date();

    // Se usou todas as músicas, desativar
    if (this.quantidadeMusicasUsadas >= this.quantidadeMusicas) {
      this.ativo = false;
    }
  }

  /**
   * Desativa o gift card
   */
  desativar() {
    if (!this.ativo) {
      throw new Error('Gift card já está desativado');
    }

    this.ativo = false;
    this.atualizadoEm = new Date();
  }

  /**
   * Reativa o gift card (apenas se não expirado)
   */
  reativar() {
    if (this.ativo) {
      throw new Error('Gift card já está ativo');
    }
    if (this.estaExpirado()) {
      throw new Error('Não pode reativar gift card expirado');
    }
    if (!this.temMusicasDisponiveis()) {
      throw new Error('Não pode reativar gift card sem músicas disponíveis');
    }

    this.ativo = true;
    this.atualizadoEm = new Date();
  }

  /**
   * Verifica se gift card está expirado
   */
  estaExpirado() {
    if (!this.dataExpiracao) {
      return false;
    }
    return new Date() > this.dataExpiracao;
  }

  /**
   * Verifica se tem músicas disponíveis
   */
  temMusicasDisponiveis() {
    return this.quantidadeMusicasUsadas < this.quantidadeMusicas;
  }

  /**
   * Retorna quantidade de músicas restantes
   */
  getMusicasRestantes() {
    return Math.max(0, this.quantidadeMusicas - this.quantidadeMusicasUsadas);
  }

  /**
   * Verifica se pode ser usado
   */
  podeSerUsado() {
    return this.ativo && !this.estaExpirado() && this.temMusicasDisponiveis();
  }

  /**
   * Gera um novo código de gift card
   */
  static gerarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const parte1 = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const parte2 = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return `GIFT-${parte1}-${parte2}`;
  }

  // ========== CONVERSÃO ==========

  /**
   * Converte para formato Prisma (persistência)
   */
  toPrisma() {
    return {
      id: this.id,
      codigo: this.codigo,
      valor: this.valor.amount,
      quantidade_musicas: this.quantidadeMusicas,
      quantidade_musicas_usadas: this.quantidadeMusicasUsadas,
      data_expiracao: this.dataExpiracao,
      observacao: this.observacao,
      ativo: this.ativo,
      criado_em: this.criadoEm,
      atualizado_em: this.atualizadoEm,
    };
  }

  /**
   * Converte para JSON (API response)
   */
  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      valor: this.valor.amount,
      quantidadeMusicas: this.quantidadeMusicas,
      quantidadeMusicasUsadas: this.quantidadeMusicasUsadas,
      musicasRestantes: this.getMusicasRestantes(),
      dataExpiracao: this.dataExpiracao,
      observacao: this.observacao,
      ativo: this.ativo,
      expirado: this.estaExpirado(),
      podeSerUsado: this.podeSerUsado(),
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    };
  }

  /**
   * Cria GiftCard a partir de dados do Prisma
   */
  static fromPrisma(data) {
    return new GiftCard({
      id: data.id,
      codigo: data.codigo,
      valor: data.valor,
      quantidadeMusicas: data.quantidade_musicas,
      quantidadeMusicasUsadas: data.quantidade_musicas_usadas,
      dataExpiracao: data.data_expiracao,
      observacao: data.observacao,
      ativo: data.ativo,
      criadoEm: data.criado_em,
      atualizadoEm: data.atualizado_em,
    });
  }
}

module.exports = GiftCard;
