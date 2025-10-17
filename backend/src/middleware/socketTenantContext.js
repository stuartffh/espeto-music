/**
 * Middleware de Tenant Context para WebSocket
 *
 * Detecta estabelecimento em conexões Socket.IO
 */

const prisma = require('../config/database');

/**
 * Autentica TV via código e adiciona ao contexto do socket
 */
async function authenticateTV(socket, tvCode) {
  try {
    const tv = await prisma.tV.findUnique({
      where: { codigo: tvCode },
      include: { estabelecimento: true }
    });

    if (!tv) {
      return {
        success: false,
        error: 'TV não encontrada',
        code: 'TV_NOT_FOUND'
      };
    }

    if (!tv.ativo) {
      return {
        success: false,
        error: 'TV desativada',
        code: 'TV_INACTIVE'
      };
    }

    if (!tv.estabelecimento.ativo) {
      return {
        success: false,
        error: 'Estabelecimento desativado',
        code: 'ESTABELECIMENTO_INACTIVE'
      };
    }

    // Atualizar última conexão
    await prisma.tV.update({
      where: { id: tv.id },
      data: {
        online: true,
        ultimaConexao: new Date(),
        ipUltimaConexao: socket.handshake.address
      }
    });

    // Adicionar ao contexto do socket
    socket.tvId = tv.id;
    socket.tvCode = tv.codigo;
    socket.tvNome = tv.nome;
    socket.estabelecimentoId = tv.estabelecimentoId;
    socket.estabelecimento = tv.estabelecimento;

    // Entrar na room do estabelecimento
    socket.join(`estabelecimento:${tv.estabelecimentoId}`);
    socket.join(`tv:${tv.id}`);

    console.log(`📺 TV autenticada: ${tv.nome} (${tv.codigo}) - Estabelecimento: ${tv.estabelecimento.nome}`);

    return {
      success: true,
      tv: {
        id: tv.id,
        nome: tv.nome,
        codigo: tv.codigo
      },
      estabelecimento: {
        id: tv.estabelecimento.id,
        nome: tv.estabelecimento.nome,
        slug: tv.estabelecimento.slug
      }
    };
  } catch (error) {
    console.error('❌ Erro ao autenticar TV:', error);
    return {
      success: false,
      error: 'Erro ao autenticar TV',
      code: 'AUTH_ERROR'
    };
  }
}

/**
 * Autentica Admin via estabelecimento
 */
async function authenticateAdmin(socket, estabelecimentoSlug) {
  try {
    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { slug: estabelecimentoSlug }
    });

    if (!estabelecimento) {
      return {
        success: false,
        error: 'Estabelecimento não encontrado',
        code: 'ESTABELECIMENTO_NOT_FOUND'
      };
    }

    if (!estabelecimento.ativo) {
      return {
        success: false,
        error: 'Estabelecimento desativado',
        code: 'ESTABELECIMENTO_INACTIVE'
      };
    }

    // Adicionar ao contexto do socket
    socket.estabelecimentoId = estabelecimento.id;
    socket.estabelecimento = estabelecimento;
    socket.role = 'admin';

    // Entrar na room do estabelecimento
    socket.join(`estabelecimento:${estabelecimento.id}`);
    socket.join(`admin:${estabelecimento.id}`);

    console.log(`👤 Admin autenticado - Estabelecimento: ${estabelecimento.nome}`);

    return {
      success: true,
      estabelecimento: {
        id: estabelecimento.id,
        nome: estabelecimento.nome,
        slug: estabelecimento.slug
      }
    };
  } catch (error) {
    console.error('❌ Erro ao autenticar Admin:', error);
    return {
      success: false,
      error: 'Erro ao autenticar Admin',
      code: 'AUTH_ERROR'
    };
  }
}

/**
 * Marca TV como offline ao desconectar
 */
async function markTVOffline(tvId) {
  try {
    await prisma.tV.update({
      where: { id: tvId },
      data: { online: false }
    });
    console.log(`📺 TV marcada como offline: ${tvId}`);
  } catch (error) {
    console.error('❌ Erro ao marcar TV como offline:', error);
  }
}

/**
 * Emite evento apenas para o estabelecimento
 */
function emitToEstabelecimento(io, estabelecimentoId, event, data) {
  io.to(`estabelecimento:${estabelecimentoId}`).emit(event, data);
}

/**
 * Emite evento apenas para as TVs do estabelecimento
 */
function emitToTVs(io, estabelecimentoId, event, data) {
  // Buscar todos os sockets na room do estabelecimento que são TVs
  const room = io.sockets.adapter.rooms.get(`estabelecimento:${estabelecimentoId}`);

  if (room) {
    room.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.tvId) {
        socket.emit(event, data);
      }
    });
  }
}

/**
 * Emite evento apenas para os admins do estabelecimento
 */
function emitToAdmins(io, estabelecimentoId, event, data) {
  io.to(`admin:${estabelecimentoId}`).emit(event, data);
}

module.exports = {
  authenticateTV,
  authenticateAdmin,
  markTVOffline,
  emitToEstabelecimento,
  emitToTVs,
  emitToAdmins
};
