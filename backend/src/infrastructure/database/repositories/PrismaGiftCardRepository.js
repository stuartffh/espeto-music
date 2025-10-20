/**
 * Prisma Implementation: GiftCardRepository
 *
 * Implementação concreta usando Prisma ORM
 */

const IGiftCardRepository = require('../../../domain/repositories/IGiftCardRepository');
const GiftCard = require('../../../domain/entities/GiftCard');
const { PrismaClient } = require('@prisma/client');

class PrismaGiftCardRepository extends IGiftCardRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma || new PrismaClient();
  }

  async findById(id) {
    const data = await this.prisma.gift_card.findUnique({
      where: { id },
      include: {
        pedidos_musica: true,
      },
    });

    return data ? GiftCard.fromPrisma(data) : null;
  }

  async findByCodigo(codigo) {
    const data = await this.prisma.gift_card.findUnique({
      where: { codigo },
      include: {
        pedidos_musica: true,
      },
    });

    return data ? GiftCard.fromPrisma(data) : null;
  }

  async findAll(filters = {}) {
    const where = this._buildWhereClause(filters);

    const data = await this.prisma.gift_card.findMany({
      where,
      include: {
        pedidos_musica: true,
      },
      orderBy: { criado_em: 'desc' },
    });

    return data.map((item) => GiftCard.fromPrisma(item));
  }

  async findAtivos() {
    const data = await this.prisma.gift_card.findMany({
      where: {
        ativo: true,
        OR: [{ data_expiracao: null }, { data_expiracao: { gt: new Date() } }],
      },
      include: {
        pedidos_musica: true,
      },
      orderBy: { criado_em: 'desc' },
    });

    return data.map((item) => GiftCard.fromPrisma(item));
  }

  async findExpirados() {
    const data = await this.prisma.gift_card.findMany({
      where: {
        data_expiracao: { lte: new Date() },
      },
      include: {
        pedidos_musica: true,
      },
      orderBy: { data_expiracao: 'desc' },
    });

    return data.map((item) => GiftCard.fromPrisma(item));
  }

  async save(giftCard) {
    const prismaData = giftCard.toPrisma();
    delete prismaData.id; // Remove ID para criação

    const created = await this.prisma.gift_card.create({
      data: prismaData,
      include: {
        pedidos_musica: true,
      },
    });

    return GiftCard.fromPrisma(created);
  }

  async update(giftCard) {
    const prismaData = giftCard.toPrisma();
    const { id, ...dataWithoutId } = prismaData;

    const updated = await this.prisma.gift_card.update({
      where: { id },
      data: dataWithoutId,
      include: {
        pedidos_musica: true,
      },
    });

    return GiftCard.fromPrisma(updated);
  }

  async delete(id) {
    await this.prisma.gift_card.delete({
      where: { id },
    });
    return true;
  }

  async codigoExiste(codigo) {
    const count = await this.prisma.gift_card.count({
      where: { codigo },
    });
    return count > 0;
  }

  async count(filters = {}) {
    const where = this._buildWhereClause(filters);
    return await this.prisma.gift_card.count({ where });
  }

  // ========== HELPER ==========

  _buildWhereClause(filters) {
    const where = {};

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }
    if (filters.expirado === true) {
      where.data_expiracao = { lte: new Date() };
    } else if (filters.expirado === false) {
      where.OR = [{ data_expiracao: null }, { data_expiracao: { gt: new Date() } }];
    }
    if (filters.codigo) {
      where.codigo = { contains: filters.codigo, mode: 'insensitive' };
    }

    return where;
  }
}

module.exports = PrismaGiftCardRepository;
