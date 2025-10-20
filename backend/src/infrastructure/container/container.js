/**
 * Dependency Injection Container
 *
 * Gerencia todas as dependências da aplicação
 * Usa Awilix para injeção de dependências
 */

const { createContainer, asClass, asValue, InjectionMode } = require('awilix');
const { PrismaClient } = require('@prisma/client');

// Repositories
const PrismaPedidoRepository = require('../database/repositories/PrismaPedidoRepository');
const PrismaFilaRepository = require('../database/repositories/PrismaFilaRepository');
const PrismaGiftCardRepository = require('../database/repositories/PrismaGiftCardRepository');

// Use Cases
const CriarPedidoUseCase = require('../../application/use-cases/CriarPedidoUseCase');
const ProcessarPagamentoPedidoUseCase = require('../../application/use-cases/ProcessarPagamentoPedidoUseCase');
const ObterFilaUseCase = require('../../application/use-cases/ObterFilaUseCase');
const UsarGiftCardUseCase = require('../../application/use-cases/UsarGiftCardUseCase');
const CriarGiftCardUseCase = require('../../application/use-cases/CriarGiftCardUseCase');

/**
 * Cria e configura o container de dependências
 */
function setupContainer() {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  // Prisma Client (singleton)
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  container.register({
    // Database
    prisma: asValue(prisma),

    // Repositories (scoped - nova instância por requisição, mas compartilhada dentro da requisição)
    pedidoRepository: asClass(PrismaPedidoRepository).scoped(),
    filaRepository: asClass(PrismaFilaRepository).scoped(),
    giftCardRepository: asClass(PrismaGiftCardRepository).scoped(),

    // Use Cases (scoped)
    criarPedidoUseCase: asClass(CriarPedidoUseCase).scoped(),
    processarPagamentoPedidoUseCase: asClass(ProcessarPagamentoPedidoUseCase).scoped(),
    obterFilaUseCase: asClass(ObterFilaUseCase).scoped(),
    usarGiftCardUseCase: asClass(UsarGiftCardUseCase).scoped(),
    criarGiftCardUseCase: asClass(CriarGiftCardUseCase).scoped(),
  });

  return container;
}

/**
 * Middleware para injetar container no request
 */
function containerMiddleware(container) {
  return (req, res, next) => {
    // Criar scope para esta requisição
    req.container = container.createScope();

    // Cleanup após resposta
    res.on('finish', () => {
      req.container.dispose();
    });

    next();
  };
}

module.exports = {
  setupContainer,
  containerMiddleware,
};
