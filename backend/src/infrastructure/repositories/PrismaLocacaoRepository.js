/**
 * Repository: PrismaLocacaoRepository
 *
 * Repositório para gerenciar locações usando Prisma ORM
 */

const Locacao = require('../../domain/entities/Locacao');

class PrismaLocacaoRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Criar nova locação
   */
  async create(locacao) {
    const data = locacao.toObject();
    delete data.id; // Deixar Prisma gerar

    const created = await this.prisma.locacoes.create({
      data
    });

    return this._toDomain(created);
  }

  /**
   * Buscar locação por ID
   */
  async findById(id) {
    const locacao = await this.prisma.locacoes.findUnique({
      where: { id }
    });

    return locacao ? this._toDomain(locacao) : null;
  }

  /**
   * Buscar locação por slug
   */
  async findBySlug(slug) {
    const locacao = await this.prisma.locacoes.findUnique({
      where: { slug }
    });

    return locacao ? this._toDomain(locacao) : null;
  }

  /**
   * Buscar locação por slugPainelTV
   */
  async findBySlugPainelTV(slugPainelTV) {
    const locacao = await this.prisma.locacoes.findUnique({
      where: { slugPainelTV }
    });

    return locacao ? this._toDomain(locacao) : null;
  }

  /**
   * Listar todas as locações
   */
  async findAll(filters = {}) {
    const where = {};

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters.status) {
      const agora = new Date();

      if (filters.status === 'ativas') {
        where.ativo = true;
        where.dataInicio = { lte: agora };
        where.dataFim = { gte: agora };
      } else if (filters.status === 'expiradas') {
        where.dataFim = { lt: agora };
      } else if (filters.status === 'pendentes') {
        where.dataInicio = { gt: agora };
      }
    }

    const locacoes = await this.prisma.locacoes.findMany({
      where,
      orderBy: { criadoEm: 'desc' }
    });

    return locacoes.map(l => this._toDomain(l));
  }

  /**
   * Atualizar locação
   */
  async update(id, data) {
    const updated = await this.prisma.locacoes.update({
      where: { id },
      data
    });

    return this._toDomain(updated);
  }

  /**
   * Desativar locação
   */
  async desativar(id) {
    return await this.update(id, { ativo: false });
  }

  /**
   * Reativar locação
   */
  async reativar(id) {
    return await this.update(id, { ativo: true });
  }

  /**
   * Deletar locação (soft delete - apenas desativa)
   */
  async delete(id) {
    await this.desativar(id);
  }

  /**
   * Deletar locação permanentemente (CUIDADO!)
   */
  async hardDelete(id) {
    await this.prisma.locacoes.delete({
      where: { id }
    });
  }

  /**
   * Atualizar estatísticas
   */
  async incrementarPedido(id, valor) {
    await this.prisma.locacoes.update({
      where: { id },
      data: {
        totalPedidos: { increment: 1 },
        totalArrecadado: { increment: valor }
      }
    });
  }

  /**
   * Obter estatísticas da locação
   */
  async getEstatisticas(id) {
    const locacao = await this.findById(id);
    if (!locacao) return null;

    // Buscar dados complementares
    const [totalPedidos, totalArrecadado] = await Promise.all([
      this.prisma.pedidos_musica.count({
        where: { locacaoId: id }
      }),
      this.prisma.pedidos_musica.aggregate({
        where: { locacaoId: id, status: 'pago' },
        _sum: { valor: true }
      })
    ]);

    return {
      locacao,
      totalPedidos,
      totalArrecadado: totalArrecadado._sum.valor || 0,
      periodoDias: Math.ceil((new Date(locacao.dataFim) - new Date(locacao.dataInicio)) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Converter de Prisma para Domain Entity
   */
  _toDomain(prismaLocacao) {
    return new Locacao({
      id: prismaLocacao.id,
      slug: prismaLocacao.slug,
      slugPainelTV: prismaLocacao.slugPainelTV,
      nomeCliente: prismaLocacao.nomeCliente,
      nomeEvento: prismaLocacao.nomeEvento,
      emailContato: prismaLocacao.emailContato,
      telefoneContato: prismaLocacao.telefoneContato,
      dataInicio: prismaLocacao.dataInicio,
      dataFim: prismaLocacao.dataFim,
      ativo: prismaLocacao.ativo,
      nomeEstabelecimento: prismaLocacao.nomeEstabelecimento,
      logoUrl: prismaLocacao.logoUrl,
      corTema: prismaLocacao.corTema,
      mensagemBoasVindas: prismaLocacao.mensagemBoasVindas,
      backgroundImageUrl: prismaLocacao.backgroundImageUrl,
      videoDescansoUrl: prismaLocacao.videoDescansoUrl,
      qrCodeData: prismaLocacao.qrCodeData,
      configuracoes: prismaLocacao.configuracoes,
      totalPedidos: prismaLocacao.totalPedidos,
      totalArrecadado: prismaLocacao.totalArrecadado,
      observacoes: prismaLocacao.observacoes,
      criadoEm: prismaLocacao.criadoEm,
      atualizadoEm: prismaLocacao.atualizadoEm
    });
  }
}

module.exports = PrismaLocacaoRepository;
