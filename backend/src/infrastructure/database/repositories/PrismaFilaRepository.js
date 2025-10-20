/**
 * Prisma Implementation: FilaRepository
 *
 * Implementação concreta usando Prisma ORM
 */

const IFilaRepository = require('../../../domain/repositories/IFilaRepository');
const Fila = require('../../../domain/entities/Fila');
const { PrismaClient } = require('@prisma/client');

class PrismaFilaRepository extends IFilaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma || new PrismaClient();
  }

  async findById(id) {
    const data = await this.prisma.fila.findUnique({
      where: { id },
      include: {
        musica_atual: true,
        proxima_musica: true,
      },
    });

    return data ? Fila.fromPrisma(data) : null;
  }

  async findAtual() {
    // Como temos apenas uma fila no sistema, buscar a primeira
    const data = await this.prisma.fila.findFirst({
      include: {
        musica_atual: true,
        proxima_musica: true,
      },
    });

    return data ? Fila.fromPrisma(data) : null;
  }

  async save(fila) {
    const prismaData = fila.toPrisma();
    delete prismaData.id; // Remove ID para criação

    const created = await this.prisma.fila.create({
      data: prismaData,
      include: {
        musica_atual: true,
        proxima_musica: true,
      },
    });

    return Fila.fromPrisma(created);
  }

  async update(fila) {
    const prismaData = fila.toPrisma();
    const { id, ...dataWithoutId } = prismaData;

    const updated = await this.prisma.fila.update({
      where: { id },
      data: dataWithoutId,
      include: {
        musica_atual: true,
        proxima_musica: true,
      },
    });

    return Fila.fromPrisma(updated);
  }

  async findOrCreate() {
    // Buscar fila existente
    let fila = await this.findAtual();

    // Se não existe, criar nova
    if (!fila) {
      const novaFila = Fila.criar();
      fila = await this.save(novaFila);
    }

    return fila;
  }
}

module.exports = PrismaFilaRepository;
