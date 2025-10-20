/**
 * Domain Entity: Pedido
 *
 * Representa um pedido de música com regras de negócio
 */

const Money = require('../value-objects/Money');
const YouTubeId = require('../value-objects/YouTubeId');
const Duration = require('../value-objects/Duration');

class Pedido {
  constructor({
    id,
    musicaTitulo,
    musicaYoutubeId,
    musicaThumbnail,
    musicaDuracao,
    nomeCliente,
    dedicatoria,
    dedicatoriaDe,
    valor,
    statusPagamento,
    statusMusica,
    posicaoFila,
    giftCardId,
    carrinhoId,
    statusModeracaoId,
    tentativasDownload,
    caminhoArquivo,
    criadoEm,
    atualizadoEm,
  }) {
    // Validações básicas
    if (!musicaTitulo || musicaTitulo.trim().length === 0) {
      throw new Error('Título da música é obrigatório');
    }

    if (musicaTitulo.length > 200) {
      throw new Error('Título da música muito longo (máx 200 caracteres)');
    }

    // Usar Value Objects
    const youtubeId = musicaYoutubeId instanceof YouTubeId
      ? musicaYoutubeId
      : new YouTubeId(musicaYoutubeId);

    const valorMonetario = valor instanceof Money
      ? valor
      : new Money(valor);

    const duracao = musicaDuracao
      ? (musicaDuracao instanceof Duration ? musicaDuracao : new Duration(musicaDuracao))
      : null;

    // Propriedades
    this.id = id;
    this.musicaTitulo = musicaTitulo.trim();
    this.musicaYoutubeId = youtubeId;
    this.musicaThumbnail = musicaThumbnail || youtubeId.getThumbnailUrl('mqdefault');
    this.musicaDuracao = duracao;
    this.nomeCliente = nomeCliente?.trim() || null;
    this.dedicatoria = dedicatoria?.trim() || null;
    this.dedicatoriaDe = dedicatoriaDe?.trim() || null;
    this.valor = valorMonetario;
    this.statusPagamento = statusPagamento || 'pendente';
    this.statusMusica = statusMusica || 'pendente';
    this.posicaoFila = posicaoFila || null;
    this.giftCardId = giftCardId || null;
    this.carrinhoId = carrinhoId || null;
    this.statusModeracaoId = statusModeracaoId || null;
    this.tentativasDownload = tentativasDownload || 0;
    this.caminhoArquivo = caminhoArquivo || null;
    this.criadoEm = criadoEm || new Date();
    this.atualizadoEm = atualizadoEm || new Date();
  }

  // ========== REGRAS DE NEGÓCIO ==========

  /**
   * Marca pedido como pago
   */
  marcarComoPago() {
    if (this.statusPagamento === 'pago') {
      throw new Error('Pedido já está pago');
    }
    if (this.statusPagamento === 'cancelado') {
      throw new Error('Não pode pagar pedido cancelado');
    }

    this.statusPagamento = 'pago';
    this.atualizadoEm = new Date();
  }

  /**
   * Cancela pedido
   */
  cancelar() {
    if (this.statusPagamento === 'cancelado') {
      throw new Error('Pedido já está cancelado');
    }
    if (this.statusMusica === 'tocada') {
      throw new Error('Não pode cancelar pedido já tocado');
    }

    this.statusPagamento = 'cancelado';
    this.statusMusica = 'cancelada';
    this.atualizadoEm = new Date();
  }

  /**
   * Adiciona à fila
   */
  adicionarNaFila(posicao) {
    if (this.statusPagamento !== 'pago') {
      throw new Error('Apenas pedidos pagos podem ser adicionados à fila');
    }
    if (this.statusMusica === 'cancelada') {
      throw new Error('Pedido cancelado não pode ser adicionado à fila');
    }

    this.statusMusica = 'na_fila';
    this.posicaoFila = posicao;
    this.atualizadoEm = new Date();
  }

  /**
   * Marca como tocando
   */
  marcarComoTocando() {
    if (this.statusMusica !== 'na_fila') {
      throw new Error('Apenas pedidos na fila podem começar a tocar');
    }

    this.statusMusica = 'tocando';
    this.atualizadoEm = new Date();
  }

  /**
   * Marca como tocada
   */
  marcarComoTocada() {
    if (this.statusMusica !== 'tocando') {
      throw new Error('Apenas pedidos tocando podem ser marcados como tocados');
    }

    this.statusMusica = 'tocada';
    this.posicaoFila = null;
    this.atualizadoEm = new Date();
  }

  /**
   * Registra tentativa de download
   */
  registrarTentativaDownload() {
    this.tentativasDownload += 1;
    this.atualizadoEm = new Date();
  }

  /**
   * Marca download como concluído
   */
  concluirDownload(caminhoArquivo) {
    if (!caminhoArquivo) {
      throw new Error('Caminho do arquivo é obrigatório');
    }

    this.caminhoArquivo = caminhoArquivo;
    this.atualizadoEm = new Date();
  }

  /**
   * Verifica se pedido foi pago com gift card
   */
  isPagoComGiftCard() {
    return this.giftCardId !== null;
  }

  /**
   * Verifica se pedido está em status final
   */
  isStatusFinal() {
    return this.statusMusica === 'tocada' || this.statusMusica === 'cancelada';
  }

  /**
   * Verifica se pode ser reproduzido
   */
  podeSerReproduzido() {
    return (
      this.statusPagamento === 'pago' &&
      this.statusMusica === 'na_fila' &&
      this.caminhoArquivo !== null
    );
  }

  // ========== CONVERSÃO ==========

  /**
   * Converte para formato Prisma (persistência)
   */
  toPrisma() {
    return {
      id: this.id,
      musica_titulo: this.musicaTitulo,
      musica_youtube_id: this.musicaYoutubeId.value,
      musica_thumbnail: this.musicaThumbnail,
      musica_duracao: this.musicaDuracao?.seconds || null,
      nome_cliente: this.nomeCliente,
      dedicatoria: this.dedicatoria,
      dedicatoria_de: this.dedicatoriaDe,
      valor: this.valor.amount,
      status_pagamento: this.statusPagamento,
      status_musica: this.statusMusica,
      posicao_fila: this.posicaoFila,
      gift_card_id: this.giftCardId,
      carrinho_id: this.carrinhoId,
      status_moderacao_id: this.statusModeracaoId,
      tentativas_download: this.tentativasDownload,
      caminho_arquivo: this.caminhoArquivo,
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
      musicaTitulo: this.musicaTitulo,
      musicaYoutubeId: this.musicaYoutubeId.value,
      musicaThumbnail: this.musicaThumbnail,
      musicaDuracao: this.musicaDuracao?.seconds || null,
      nomeCliente: this.nomeCliente,
      dedicatoria: this.dedicatoria,
      dedicatoriaDe: this.dedicatoriaDe,
      valor: this.valor.amount,
      statusPagamento: this.statusPagamento,
      statusMusica: this.statusMusica,
      posicaoFila: this.posicaoFila,
      giftCardId: this.giftCardId,
      carrinhoId: this.carrinhoId,
      statusModeracaoId: this.statusModeracaoId,
      tentativasDownload: this.tentativasDownload,
      caminhoArquivo: this.caminhoArquivo,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    };
  }

  /**
   * Cria Pedido a partir de dados do Prisma
   */
  static fromPrisma(data) {
    return new Pedido({
      id: data.id,
      musicaTitulo: data.musica_titulo,
      musicaYoutubeId: data.musica_youtube_id,
      musicaThumbnail: data.musica_thumbnail,
      musicaDuracao: data.musica_duracao,
      nomeCliente: data.nome_cliente,
      dedicatoria: data.dedicatoria,
      dedicatoriaDe: data.dedicatoria_de,
      valor: data.valor,
      statusPagamento: data.status_pagamento,
      statusMusica: data.status_musica,
      posicaoFila: data.posicao_fila,
      giftCardId: data.gift_card_id,
      carrinhoId: data.carrinho_id,
      statusModeracaoId: data.status_moderacao_id,
      tentativasDownload: data.tentativas_download,
      caminhoArquivo: data.caminho_arquivo,
      criadoEm: data.criado_em,
      atualizadoEm: data.atualizado_em,
    });
  }
}

module.exports = Pedido;
