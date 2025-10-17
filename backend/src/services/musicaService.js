const prisma = require('../config/database');
const { buscarDetalhesVideo } = require('../config/youtube');

/**
 * Cria um novo pedido de música
 * Multi-tenant: Requer estabelecimentoId
 */
async function criarPedidoMusica({
  estabelecimentoId, // ← NOVO: Multi-tenant
  nomeCliente,
  musicaTitulo,
  musicaYoutubeId,
  musicaThumbnail,
  musicaDuracao,
  valor,
}) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  // Verificar limite de músicas na fila (por estabelecimento)
  const config = await prisma.configuracao.findFirst({
    where: {
      estabelecimentoId,
      chave: 'MAX_MUSICAS_FILA'
    },
  });

  const maxFila = config ? parseInt(config.valor) : 50;
  const totalNaFila = await prisma.pedidoMusica.count({
    where: {
      estabelecimentoId, // ← Multi-tenant
      status: {
        in: ['pago', 'tocando'],
      },
    },
  });

  if (totalNaFila >= maxFila) {
    throw new Error('Fila de músicas está cheia no momento');
  }

  // Verificar se permite músicas duplicadas
  const configDuplicadas = await prisma.configuracao.findFirst({
    where: {
      estabelecimentoId, // ← Multi-tenant
      chave: 'PERMITIR_MUSICAS_DUPLICADAS'
    },
  });

  const permiteDuplicadas = configDuplicadas ? configDuplicadas.valor === 'true' : false;

  if (!permiteDuplicadas) {
    const musicaDuplicada = await prisma.pedidoMusica.findFirst({
      where: {
        estabelecimentoId, // ← Multi-tenant
        musicaYoutubeId,
        status: {
          in: ['pago', 'tocando'],
        },
      },
    });

    if (musicaDuplicada) {
      throw new Error('Esta música já está na fila');
    }
  }

  // Criar pedido
  const pedido = await prisma.pedidoMusica.create({
    data: {
      estabelecimentoId, // ← Multi-tenant
      nomeCliente,
      musicaTitulo,
      musicaYoutubeId,
      musicaThumbnail,
      musicaDuracao,
      valor,
      status: 'pendente',
    },
  });

  return pedido;
}

/**
 * Busca fila de músicas (pagas e não tocadas)
 * Multi-tenant: Requer estabelecimentoId
 */
async function buscarFilaMusicas(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  return await prisma.pedidoMusica.findMany({
    where: {
      estabelecimentoId, // ← Multi-tenant
      status: {
        in: ['pago', 'tocando'],
      },
    },
    orderBy: [
      { status: 'desc' }, // "tocando" vem primeiro
      { criadoEm: 'asc' },
    ],
  });
}

/**
 * Busca música atual (tocando)
 * Multi-tenant: Requer estabelecimentoId
 */
async function buscarMusicaAtual(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  return await prisma.pedidoMusica.findFirst({
    where: {
      estabelecimentoId, // ← Multi-tenant
      status: 'tocando'
    },
  });
}

/**
 * Marca música como tocando
 * Multi-tenant: Recebe estabelecimentoId
 */
async function tocarMusica(pedidoId, estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  // Verificar se já existe música tocando
  const musicaTocando = await buscarMusicaAtual(estabelecimentoId);

  if (musicaTocando && musicaTocando.id !== pedidoId) {
    throw new Error('Já existe uma música tocando');
  }

  const pedido = await prisma.pedidoMusica.update({
    where: { id: pedidoId },
    data: { status: 'tocando' },
  });

  return pedido;
}

/**
 * Marca música como concluída e toca próxima
 * Multi-tenant: Recebe estabelecimentoId
 */
async function concluirMusica(pedidoId, estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  await prisma.pedidoMusica.update({
    where: { id: pedidoId },
    data: { status: 'concluida' },
  });

  // Buscar próxima música na fila
  const proximaMusica = await prisma.pedidoMusica.findFirst({
    where: {
      estabelecimentoId, // ← Multi-tenant
      status: 'pago',
    },
    orderBy: { criadoEm: 'asc' },
  });

  if (proximaMusica) {
    return await tocarMusica(proximaMusica.id, estabelecimentoId);
  }

  return null;
}

/**
 * Verifica se há músicas na fila aguardando e inicia automaticamente
 * Retorna a música iniciada ou null
 * Multi-tenant: Recebe estabelecimentoId
 */
async function iniciarProximaMusicaSeNecessario(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  // Verificar se já há música tocando
  const musicaTocando = await buscarMusicaAtual(estabelecimentoId);

  if (musicaTocando) {
    return null; // Já há música tocando
  }

  // Buscar primeira música paga na fila
  const proximaMusica = await prisma.pedidoMusica.findFirst({
    where: {
      estabelecimentoId, // ← Multi-tenant
      status: 'pago',
    },
    orderBy: { criadoEm: 'asc' },
  });

  if (proximaMusica) {
    console.log('🎵 Autoplay: Iniciando primeira música da fila:', proximaMusica.musicaTitulo);
    return await tocarMusica(proximaMusica.id, estabelecimentoId);
  }

  return null;
}

/**
 * Pula música atual
 * Multi-tenant: Recebe estabelecimentoId
 */
async function pularMusica(pedidoId, estabelecimentoId) {
  return await concluirMusica(pedidoId, estabelecimentoId);
}

/**
 * Cancela um pedido de música
 */
async function cancelarPedido(pedidoId) {
  const pedido = await prisma.pedidoMusica.findUnique({
    where: { id: pedidoId },
  });

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  if (pedido.status === 'tocando') {
    throw new Error('Não é possível cancelar uma música que está tocando');
  }

  if (pedido.status === 'concluida') {
    throw new Error('Não é possível cancelar uma música já concluída');
  }

  return await prisma.pedidoMusica.update({
    where: { id: pedidoId },
    data: { status: 'cancelada' },
  });
}

/**
 * Busca histórico de músicas
 * Multi-tenant: Recebe estabelecimentoId
 */
async function buscarHistorico(estabelecimentoId, limite = 50) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  return await prisma.pedidoMusica.findMany({
    where: {
      estabelecimentoId, // ← Multi-tenant
      status: {
        in: ['concluida', 'cancelada'],
      },
    },
    orderBy: { atualizadoEm: 'desc' },
    take: limite,
  });
}

/**
 * Busca pedido por ID
 */
async function buscarPedidoPorId(pedidoId) {
  const pedido = await prisma.pedidoMusica.findUnique({
    where: { id: pedidoId },
    include: {
      pagamento: true,
    },
  });

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  return pedido;
}

module.exports = {
  criarPedidoMusica,
  buscarFilaMusicas,
  buscarMusicaAtual,
  tocarMusica,
  concluirMusica,
  pularMusica,
  cancelarPedido,
  buscarHistorico,
  buscarPedidoPorId,
  iniciarProximaMusicaSeNecessario,
};
