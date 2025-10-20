/**
 * Domain Entity: Fila
 *
 * Representa a fila de músicas com regras de ordenação
 */

const Duration = require('../value-objects/Duration');

class Fila {
  constructor({ id, statusAtual, musicaAtualId, proximaMusicaId, criadoEm, atualizadoEm }) {
    this.id = id;
    this.statusAtual = statusAtual || 'parada';
    this.musicaAtualId = musicaAtualId || null;
    this.proximaMusicaId = proximaMusicaId || null;
    this.criadoEm = criadoEm || new Date();
    this.atualizadoEm = atualizadoEm || new Date();
  }

  // ========== REGRAS DE NEGÓCIO ==========

  /**
   * Inicia a fila
   */
  iniciar(primeiraMusicaId) {
    if (!primeiraMusicaId) {
      throw new Error('Primeira música é obrigatória para iniciar a fila');
    }

    this.statusAtual = 'tocando';
    this.musicaAtualId = primeiraMusicaId;
    this.atualizadoEm = new Date();
  }

  /**
   * Pausa a fila
   */
  pausar() {
    if (this.statusAtual === 'parada') {
      throw new Error('Fila já está parada');
    }

    this.statusAtual = 'pausada';
    this.atualizadoEm = new Date();
  }

  /**
   * Resume a fila
   */
  resumir() {
    if (this.statusAtual !== 'pausada') {
      throw new Error('Apenas fila pausada pode ser resumida');
    }

    this.statusAtual = 'tocando';
    this.atualizadoEm = new Date();
  }

  /**
   * Para a fila
   */
  parar() {
    this.statusAtual = 'parada';
    this.musicaAtualId = null;
    this.proximaMusicaId = null;
    this.atualizadoEm = new Date();
  }

  /**
   * Avança para próxima música
   */
  avancar(proximaMusicaId) {
    if (!this.musicaAtualId) {
      throw new Error('Não há música atual para avançar');
    }

    this.musicaAtualId = proximaMusicaId;
    this.proximaMusicaId = null;
    this.statusAtual = proximaMusicaId ? 'tocando' : 'parada';
    this.atualizadoEm = new Date();
  }

  /**
   * Define próxima música
   */
  definirProxima(musicaId) {
    this.proximaMusicaId = musicaId;
    this.atualizadoEm = new Date();
  }

  /**
   * Pula música atual
   */
  pular(novaMusicaId) {
    this.musicaAtualId = novaMusicaId;
    this.proximaMusicaId = null;
    this.statusAtual = novaMusicaId ? 'tocando' : 'parada';
    this.atualizadoEm = new Date();
  }

  /**
   * Verifica se fila está ativa
   */
  isAtiva() {
    return this.statusAtual === 'tocando' || this.statusAtual === 'pausada';
  }

  /**
   * Verifica se fila está tocando
   */
  isTocando() {
    return this.statusAtual === 'tocando';
  }

  /**
   * Verifica se há música atual
   */
  temMusicaAtual() {
    return this.musicaAtualId !== null;
  }

  // ========== CONVERSÃO ==========

  /**
   * Converte para formato Prisma (persistência)
   */
  toPrisma() {
    return {
      id: this.id,
      status_atual: this.statusAtual,
      musica_atual_id: this.musicaAtualId,
      proxima_musica_id: this.proximaMusicaId,
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
      statusAtual: this.statusAtual,
      musicaAtualId: this.musicaAtualId,
      proximaMusicaId: this.proximaMusicaId,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    };
  }

  /**
   * Cria Fila a partir de dados do Prisma
   */
  static fromPrisma(data) {
    return new Fila({
      id: data.id,
      statusAtual: data.status_atual,
      musicaAtualId: data.musica_atual_id,
      proximaMusicaId: data.proxima_musica_id,
      criadoEm: data.criado_em,
      atualizadoEm: data.atualizado_em,
    });
  }

  /**
   * Cria nova fila vazia
   */
  static criar() {
    return new Fila({
      id: undefined, // Será gerado pelo banco
      statusAtual: 'parada',
      musicaAtualId: null,
      proximaMusicaId: null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
  }
}

module.exports = Fila;
