const prisma = require('../config/database');
const QRCode = require('qrcode');

/**
 * Busca todas as mesas
 */
async function listarMesas() {
  return await prisma.mesa.findMany({
    orderBy: { numero: 'asc' },
    include: {
      _count: {
        select: {
          pedidosMusica: {
            where: {
              status: {
                in: ['pendente', 'pago', 'tocando'],
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Busca mesa por token do QR Code
 */
async function buscarMesaPorToken(token) {
  const mesa = await prisma.mesa.findUnique({
    where: { qrCodeToken: token },
  });

  if (!mesa) {
    throw new Error('Mesa não encontrada');
  }

  if (!mesa.ativa) {
    throw new Error('Mesa inativa');
  }

  return mesa;
}

/**
 * Busca mesa por ID
 */
async function buscarMesaPorId(id) {
  const mesa = await prisma.mesa.findUnique({
    where: { id },
    include: {
      pedidosMusica: {
        where: {
          status: {
            in: ['pendente', 'pago', 'tocando'],
          },
        },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });

  if (!mesa) {
    throw new Error('Mesa não encontrada');
  }

  return mesa;
}

/**
 * Gera QR Code para uma mesa
 */
async function gerarQRCode(mesaId) {
  const mesa = await prisma.mesa.findUnique({
    where: { id: mesaId },
  });

  if (!mesa) {
    throw new Error('Mesa não encontrada');
  }

  const url = `${process.env.BASE_URL}/mesa/${mesa.qrCodeToken}`;
  const qrCode = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
  });

  return {
    url,
    qrCode,
    mesa,
  };
}

/**
 * Cria uma nova mesa
 */
async function criarMesa(numero) {
  const { v4: uuidv4 } = require('uuid');

  const mesaExistente = await prisma.mesa.findUnique({
    where: { numero },
  });

  if (mesaExistente) {
    throw new Error('Já existe uma mesa com este número');
  }

  return await prisma.mesa.create({
    data: {
      numero,
      qrCodeToken: uuidv4(),
      ativa: true,
    },
  });
}

/**
 * Atualiza status de uma mesa
 */
async function atualizarStatusMesa(mesaId, ativa) {
  return await prisma.mesa.update({
    where: { id: mesaId },
    data: { ativa },
  });
}

module.exports = {
  listarMesas,
  buscarMesaPorToken,
  buscarMesaPorId,
  gerarQRCode,
  criarMesa,
  atualizarStatusMesa,
};
