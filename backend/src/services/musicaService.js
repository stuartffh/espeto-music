const prisma = require('../config/database');
const { buscarDetalhesVideo } = require('../config/youtube');

/**
 * Cria um novo pedido de música
 */
async function criarPedidoMusica({
  nomeCliente,
  musicaTitulo,
  musicaYoutubeId,
  musicaThumbnail,
  musicaDuracao,
  valor,
  prioridade = false,
  dedicatoria = null,
  dedicatoriaDe = null,
}) {

  // Verificar limite de músicas na fila
  const config = await prisma.configuracoes.findUnique({
    where: { chave: 'MAX_MUSICAS_FILA' },
  });

  const maxFila = config ? parseInt(config.valor) : 50;
  const totalNaFila = await prisma.pedidos_musica.count({
    where: {
      status: {
        in: ['pago', 'tocando'],
      },
    },
  });

  if (totalNaFila >= maxFila) {
    throw new Error('Fila de músicas está cheia no momento');
  }

  // Verificar se permite músicas duplicadas
  const configDuplicadas = await prisma.configuracoes.findUnique({
    where: { chave: 'PERMITIR_MUSICAS_DUPLICADAS' },
  });

  const permiteDuplicadas = configDuplicadas ? configDuplicadas.valor === 'true' : false;

  if (!permiteDuplicadas) {
    const musicaDuplicada = await prisma.pedidos_musica.findFirst({
      where: {
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
  const pedido = await prisma.pedidos_musica.create({
    data: {
      nomeCliente,
      musicaTitulo,
      musicaYoutubeId,
      musicaThumbnail,
      musicaDuracao,
      valor,
      status: 'pendente',
      prioridade,
      dedicatoria,
      dedicatoriaDe,
    },
  });

  return pedido;
}

/**
 * Busca fila de músicas (pagas e não tocadas)
 * Ordenação: música tocando > prioritárias > normais (por ordem de chegada)
 */
async function buscarFilaMusicas() {
  // Retorna apenas músicas PAGAS (próximas a tocar)
  // Não inclui a música que está tocando (status: 'tocando')
  return await prisma.pedidos_musica.findMany({
    where: {
      status: 'pago',
    },
    orderBy: [
      { prioridade: 'desc' },  // músicas prioritárias antes
      { criadoEm: 'asc' },     // depois por ordem de chegada
    ],
  });
}

/**
 * Busca música atual (tocando)
 */
async function buscarMusicaAtual() {
  return await prisma.pedidos_musica.findFirst({
    where: { status: 'tocando' },
  });
}

/**
 * Marca música como tocando
 */
async function tocarMusica(pedidoId) {
  // Verificar se já existe música tocando
  const musicaTocando = await buscarMusicaAtual();

  if (musicaTocando && musicaTocando.id !== pedidoId) {
    throw new Error('Já existe uma música tocando');
  }

  const pedido = await prisma.pedidos_musica.update({
    where: { id: pedidoId },
    data: { status: 'tocando' },
  });

  return pedido;
}

/**
 * Marca música como concluída e toca próxima
 */
async function concluirMusica(pedidoId) {
  await prisma.pedidos_musica.update({
    where: { id: pedidoId },
    data: { status: 'concluida' },
  });

  // Buscar próxima música na fila
  const proximaMusica = await prisma.pedidos_musica.findFirst({
    where: {
      status: 'pago',
    },
    orderBy: { criadoEm: 'asc' },
  });

  if (proximaMusica) {
    return await tocarMusica(proximaMusica.id);
  }

  return null;
}

/**
 * Verifica se há músicas na fila aguardando e inicia automaticamente
 * Retorna a música iniciada ou null
 */
async function iniciarProximaMusicaSeNecessario() {
  // Verificar se já há música tocando
  const musicaTocando = await buscarMusicaAtual();

  if (musicaTocando) {
    return null; // Já há música tocando
  }

  // Buscar primeira música paga na fila
  const proximaMusica = await prisma.pedidos_musica.findFirst({
    where: {
      status: 'pago',
    },
    orderBy: { criadoEm: 'asc' },
  });

  if (proximaMusica) {
    console.log('🎵 Autoplay: Iniciando primeira música da fila:', proximaMusica.musicaTitulo);
    return await tocarMusica(proximaMusica.id);
  }

  return null;
}

/**
 * Pula música atual
 */
async function pularMusica(pedidoId) {
  return await concluirMusica(pedidoId);
}

/**
 * Cancela um pedido de música
 */
async function cancelarPedido(pedidoId) {
  const pedido = await prisma.pedidos_musica.findUnique({
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

  return await prisma.pedidos_musica.update({
    where: { id: pedidoId },
    data: { status: 'cancelada' },
  });
}

/**
 * Busca histórico de músicas
 */
async function buscarHistorico(limite = 50) {
  return await prisma.pedidos_musica.findMany({
    where: {
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
  const pedido = await prisma.pedidos_musica.findUnique({
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
