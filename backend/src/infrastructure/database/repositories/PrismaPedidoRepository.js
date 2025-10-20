/**
 * Prisma Implementation: PedidoRepository
 *
 * Implementação concreta usando Prisma ORM
 */

const IPedidoRepository = require('../../../domain/repositories/IPedidoRepository');
const Pedido = require('../../../domain/entities/Pedido');
const { PrismaClient } = require('@prisma/client');

class PrismaPedidoRepository extends IPedidoRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma || new PrismaClient();
  }

  async findById(id) {
    const data = await this.prisma.pedidos_musica.findUnique({
      where: { id },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
    });

    return data ? Pedido.fromPrisma(data) : null;
  }

  async findAll(filters = {}) {
    const where = this._buildWhereClause(filters);

    const data = await this.prisma.pedidos_musica.findMany({
      where,
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
      orderBy: [{ posicao_fila: 'asc' }, { criado_em: 'desc' }],
    });

    return data.map((item) => Pedido.fromPrisma(item));
  }

  async findByStatusPagamento(status) {
    const data = await this.prisma.pedidos_musica.findMany({
      where: { status_pagamento: status },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
      orderBy: { criado_em: 'desc' },
    });

    return data.map((item) => Pedido.fromPrisma(item));
  }

  async findByStatusMusica(status) {
    const data = await this.prisma.pedidos_musica.findMany({
      where: { status_musica: status },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
      orderBy: { posicao_fila: 'asc' },
    });

    return data.map((item) => Pedido.fromPrisma(item));
  }

  async findNaFila() {
    const data = await this.prisma.pedidos_musica.findMany({
      where: {
        status_musica: 'na_fila',
        status_pagamento: 'pago',
      },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
      orderBy: { posicao_fila: 'asc' },
    });

    return data.map((item) => Pedido.fromPrisma(item));
  }

  async findProximoNaFila() {
    const data = await this.prisma.pedidos_musica.findFirst({
      where: {
        status_musica: 'na_fila',
        status_pagamento: 'pago',
      },
      orderBy: { posicao_fila: 'asc' },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
    });

    return data ? Pedido.fromPrisma(data) : null;
  }

  async findByGiftCard(giftCardId) {
    const data = await this.prisma.pedidos_musica.findMany({
      where: { gift_card_id: giftCardId },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
      orderBy: { criado_em: 'desc' },
    });

    return data.map((item) => Pedido.fromPrisma(item));
  }

  async findByCarrinho(carrinhoId) {
    const data = await this.prisma.pedidos_musica.findMany({
      where: { carrinho_id: carrinhoId },
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
      orderBy: { criado_em: 'asc' },
    });

    return data.map((item) => Pedido.fromPrisma(item));
  }

  async save(pedido) {
    const prismaData = pedido.toPrisma();
    delete prismaData.id; // Remove ID para criação

    const created = await this.prisma.pedidos_musica.create({
      data: prismaData,
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
    });

    return Pedido.fromPrisma(created);
  }

  async update(pedido) {
    const prismaData = pedido.toPrisma();
    const { id, ...dataWithoutId } = prismaData;

    const updated = await this.prisma.pedidos_musica.update({
      where: { id },
      data: dataWithoutId,
      include: {
        gift_card: true,
        carrinho: true,
        status_moderacao: true,
      },
    });

    return Pedido.fromPrisma(updated);
  }

  async delete(id) {
    await this.prisma.pedidos_musica.delete({
      where: { id },
    });
    return true;
  }

  async count(filters = {}) {
    const where = this._buildWhereClause(filters);
    return await this.prisma.pedidos_musica.count({ where });
  }

  async reordenarFila(reordenacao) {
    // Executa múltiplas atualizações em transação
    await this.prisma.$transaction(
      reordenacao.map(({ id, posicao }) =>
        this.prisma.pedidos_musica.update({
          where: { id },
          data: { posicao_fila: posicao },
        })
      )
    );
    return true;
  }

  // ========== HELPER ==========

  _buildWhereClause(filters) {
    const where = {};

    if (filters.statusPagamento) {
      where.status_pagamento = filters.statusPagamento;
    }
    if (filters.statusMusica) {
      where.status_musica = filters.statusMusica;
    }
    if (filters.giftCardId) {
      where.gift_card_id = filters.giftCardId;
    }
    if (filters.carrinhoId) {
      where.carrinho_id = filters.carrinhoId;
    }
    if (filters.nomeCliente) {
      where.nome_cliente = { contains: filters.nomeCliente, mode: 'insensitive' };
    }
    if (filters.musicaTitulo) {
      where.musica_titulo = { contains: filters.musicaTitulo, mode: 'insensitive' };
    }

    return where;
  }
}

module.exports = PrismaPedidoRepository;
