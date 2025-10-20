/**
 * Entity: Locacao
 *
 * Representa uma locação temporária do sistema para eventos/estabelecimentos.
 * Permite multi-tenancy soft com isolamento de dados e customizações.
 */

class Locacao {
  constructor({
    id,
    slug,
    slugPainelTV,
    nomeCliente,
    nomeEvento,
    emailContato,
    telefoneContato,
    dataInicio,
    dataFim,
    ativo,
    nomeEstabelecimento,
    logoUrl,
    corTema,
    mensagemBoasVindas,
    backgroundImageUrl,
    videoDescansoUrl,
    qrCodeData,
    configuracoes,
    totalPedidos,
    totalArrecadado,
    observacoes,
    criadoEm,
    atualizadoEm
  }) {
    this.id = id;
    this.slug = slug;
    this.slugPainelTV = slugPainelTV;
    this.nomeCliente = nomeCliente;
    this.nomeEvento = nomeEvento;
    this.emailContato = emailContato;
    this.telefoneContato = telefoneContato;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
    this.ativo = ativo !== undefined ? ativo : true;

    // Customizações
    this.nomeEstabelecimento = nomeEstabelecimento;
    this.logoUrl = logoUrl;
    this.corTema = corTema;
    this.mensagemBoasVindas = mensagemBoasVindas;
    this.backgroundImageUrl = backgroundImageUrl;
    this.videoDescansoUrl = videoDescansoUrl;

    // QR Code e configs
    this.qrCodeData = qrCodeData;
    this.configuracoes = configuracoes;

    // Estatísticas
    this.totalPedidos = totalPedidos || 0;
    this.totalArrecadado = totalArrecadado || 0;

    // Metadados
    this.observacoes = observacoes;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  /**
   * Verifica se a locação está ativa e dentro do período válido
   */
  isAtiva() {
    if (!this.ativo) return false;

    const agora = new Date();
    const inicio = new Date(this.dataInicio);
    const fim = new Date(this.dataFim);

    return agora >= inicio && agora <= fim;
  }

  /**
   * Verifica se a locação expirou
   */
  isExpirada() {
    const agora = new Date();
    const fim = new Date(this.dataFim);
    return agora > fim;
  }

  /**
   * Verifica se a locação ainda não começou
   */
  isPendente() {
    const agora = new Date();
    const inicio = new Date(this.dataInicio);
    return agora < inicio;
  }

  /**
   * Obtém as configurações parseadas (JSON)
   */
  getConfiguracoes() {
    if (!this.configuracoes) return {};
    try {
      return JSON.parse(this.configuracoes);
    } catch (e) {
      console.error('Erro ao parsear configurações da locação:', e);
      return {};
    }
  }

  /**
   * Define configurações (converte para JSON)
   */
  setConfiguracoes(configs) {
    this.configuracoes = JSON.stringify(configs);
  }

  /**
   * Incrementa estatísticas
   */
  incrementarPedido(valor) {
    this.totalPedidos++;
    this.totalArrecadado += valor;
  }

  /**
   * Validações
   */
  static validate(data) {
    const errors = [];

    if (!data.slug || data.slug.trim().length === 0) {
      errors.push('Slug é obrigatório');
    }

    if (!data.nomeCliente || data.nomeCliente.trim().length === 0) {
      errors.push('Nome do cliente é obrigatório');
    }

    if (!data.nomeEvento || data.nomeEvento.trim().length === 0) {
      errors.push('Nome do evento é obrigatório');
    }

    if (!data.dataInicio) {
      errors.push('Data de início é obrigatória');
    }

    if (!data.dataFim) {
      errors.push('Data de fim é obrigatória');
    }

    if (data.dataInicio && data.dataFim) {
      const inicio = new Date(data.dataInicio);
      const fim = new Date(data.dataFim);

      if (fim <= inicio) {
        errors.push('Data de fim deve ser posterior à data de início');
      }
    }

    // Validar formato do slug (apenas letras, números e hífens)
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Slug deve conter apenas letras minúsculas, números e hífens');
    }

    return errors;
  }

  /**
   * Converte para objeto simples (para persistência)
   */
  toObject() {
    return {
      id: this.id,
      slug: this.slug,
      slugPainelTV: this.slugPainelTV,
      nomeCliente: this.nomeCliente,
      nomeEvento: this.nomeEvento,
      emailContato: this.emailContato,
      telefoneContato: this.telefoneContato,
      dataInicio: this.dataInicio,
      dataFim: this.dataFim,
      ativo: this.ativo,
      nomeEstabelecimento: this.nomeEstabelecimento,
      logoUrl: this.logoUrl,
      corTema: this.corTema,
      mensagemBoasVindas: this.mensagemBoasVindas,
      backgroundImageUrl: this.backgroundImageUrl,
      videoDescansoUrl: this.videoDescansoUrl,
      qrCodeData: this.qrCodeData,
      configuracoes: this.configuracoes,
      totalPedidos: this.totalPedidos,
      totalArrecadado: this.totalArrecadado,
      observacoes: this.observacoes,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm
    };
  }
}

module.exports = Locacao;
