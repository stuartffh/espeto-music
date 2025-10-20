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
  locacaoId = null, // ID da locação (null = global)
}) {

  // Verificar limite de músicas na fila DA MESMA LOCAÇÃO
  const config = await prisma.configuracoes.findUnique({
    where: { chave: 'MAX_MUSICAS_FILA' },
  });

  const maxFila = config ? parseInt(config.valor) : 50;
  const totalNaFila = await prisma.pedidos_musica.count({
    where: {
      status: {
        in: ['pago', 'tocando'],
      },
      locacaoId: locacaoId, // Contar apenas da mesma locação
    },
  });

  if (totalNaFila >= maxFila) {
    throw new Error('Fila de músicas está cheia no momento');
  }

  // Verificar se permite músicas duplicadas NA MESMA LOCAÇÃO
  const configDuplicadas = await prisma.configuracoes.findUnique({
    where: { chave: 'PERMITIR_MUSICAS_DUPLICADAS' },
  });

  const permiteDuplicadas = configDuplicadas ? configDuplicadas.valor === 'true' : false;

  if (!permiteDuplicadas) {
    const musicaDuplicada = await prisma.pedidos_musica.findFirst({
      where: {
        musicaYoutubeId,
        locacaoId: locacaoId, // Verificar duplicação apenas na mesma locação
        status: {
          in: ['pago', 'tocando'],
        },
      },
    });

    if (musicaDuplicada) {
      throw new Error('Esta música já está na fila');
    }
  }

  // Criar pedido COM locacaoId
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
      locacaoId, // Armazenar a locação
    },
  });

  return pedido;
}

/**
 * Busca fila de músicas (pagas e não tocadas)
 * Ordenação: música tocando > prioritárias > normais (por ordem de chegada)
 * @param {string|null} locacaoId - ID da locação (null = global)
 */
async function buscarFilaMusicas(locacaoId = null) {
  // Retorna apenas músicas PAGAS (próximas a tocar)
  // Não inclui a música que está tocando (status: 'tocando')
  return await prisma.pedidos_musica.findMany({
    where: {
      status: 'pago',
      locacaoId: locacaoId, // null = músicas globais, específico = locação
    },
    orderBy: [
      { prioridade: 'desc' },  // músicas prioritárias antes
      { criadoEm: 'asc' },     // depois por ordem de chegada
    ],
  });
}

/**
 * Busca música atual (tocando)
 * @param {string|null} locacaoId - ID da locação (null = global)
 */
async function buscarMusicaAtual(locacaoId = null) {
  return await prisma.pedidos_musica.findFirst({
    where: {
      status: 'tocando',
      locacaoId: locacaoId, // null = músicas globais, específico = locação
    },
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
 * @param {string} pedidoId - ID do pedido
 * @param {string|null} locacaoId - ID da locação (null = global)
 */
async function concluirMusica(pedidoId, locacaoId = null) {
  await prisma.pedidos_musica.update({
    where: { id: pedidoId },
    data: { status: 'concluida' },
  });

  // Buscar próxima música na fila DA MESMA LOCAÇÃO
  const proximaMusica = await prisma.pedidos_musica.findFirst({
    where: {
      status: 'pago',
      locacaoId: locacaoId, // null = músicas globais, específico = locação
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
 * @param {string|null} locacaoId - ID da locação (null = global)
 */
async function iniciarProximaMusicaSeNecessario(locacaoId = null) {
  // Verificar se já há música tocando NA MESMA LOCAÇÃO
  const musicaTocando = await buscarMusicaAtual(locacaoId);

  if (musicaTocando) {
    return null; // Já há música tocando
  }

  // Buscar primeira música paga na fila DA MESMA LOCAÇÃO
  const proximaMusica = await prisma.pedidos_musica.findFirst({
    where: {
      status: 'pago',
      locacaoId: locacaoId, // null = músicas globais, específico = locação
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
