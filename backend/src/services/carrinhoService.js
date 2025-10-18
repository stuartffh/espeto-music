const prisma = require('../config/database');

/**
 * Service de Carrinho
 *
 * Gerencia o carrinho de compras do cliente
 * - Adicionar/remover músicas
 * - Calcular valor total
 * - Validar limite de 3 músicas
 * - Expiração automática após 30 minutos
 */

/**
 * Busca ou cria carrinho para uma sessão
 */
async function buscarOuCriarCarrinho(sessionId) {
  const agora = new Date();

  // Buscar carrinho existente e não expirado
  let carrinho = await prisma.carrinhos.findFirst({
    where: {
      sessionId,
      expiraEm: {
        gt: agora,
      },
    },
  });

  // Se não existe ou expirou, criar novo
  if (!carrinho) {
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    carrinho = await prisma.carrinhos.create({
      data: {
        sessionId,
        musicasTitulos: JSON.stringify([]),
        musicasIds: JSON.stringify([]),
        musicasThumbs: JSON.stringify([]),
        musicasDuracoes: JSON.stringify([]),
        valorTotal: 0,
        quantidadeItens: 0,
        expiraEm,
      },
    });

    console.log(`🛒 Novo carrinho criado: ${carrinho.id}`);
  }

  return carrinho;
}

/**
 * Adiciona música ao carrinho
 */
async function adicionarMusica(sessionId, musica) {
  const { titulo, youtubeId, thumbnail, duracao, valor } = musica;

  const carrinho = await buscarOuCriarCarrinho(sessionId);

  // Parsear arrays
  const titulos = JSON.parse(carrinho.musicasTitulos);
  const ids = JSON.parse(carrinho.musicasIds);
  const thumbs = JSON.parse(carrinho.musicasThumbs);
  const duracoes = JSON.parse(carrinho.musicasDuracoes);

  // Validar limite de 3 músicas
  if (titulos.length >= 3) {
    throw new Error('Limite de 3 músicas no carrinho atingido');
  }

  // Validar se música já está no carrinho
  if (ids.includes(youtubeId)) {
    throw new Error('Esta música já está no carrinho');
  }

  // Adicionar música
  titulos.push(titulo);
  ids.push(youtubeId);
  thumbs.push(thumbnail || '');
  duracoes.push(duracao || 0);

  const novoValorTotal = carrinho.valorTotal + valor;
  const novaQuantidade = titulos.length;

  // Atualizar carrinho
  const carrinhoAtualizado = await prisma.carrinhos.update({
    where: { id: carrinho.id },
    data: {
      musicasTitulos: JSON.stringify(titulos),
      musicasIds: JSON.stringify(ids),
      musicasThumbs: JSON.stringify(thumbs),
      musicasDuracoes: JSON.stringify(duracoes),
      valorTotal: novoValorTotal,
      quantidadeItens: novaQuantidade,
      // Renovar expiração
      expiraEm: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  console.log(`✅ Música adicionada ao carrinho: ${titulo}`);
  console.log(`🛒 Total de itens: ${novaQuantidade}`);
  console.log(`💰 Valor total: R$ ${novoValorTotal.toFixed(2)}`);

  return formatarCarrinho(carrinhoAtualizado);
}

/**
 * Remove música do carrinho
 */
async function removerMusica(sessionId, youtubeId) {
  const carrinho = await buscarOuCriarCarrinho(sessionId);

  // Parsear arrays
  const titulos = JSON.parse(carrinho.musicasTitulos);
  const ids = JSON.parse(carrinho.musicasIds);
  const thumbs = JSON.parse(carrinho.musicasThumbs);
  const duracoes = JSON.parse(carrinho.musicasDuracoes);

  // Encontrar índice da música
  const indice = ids.indexOf(youtubeId);

  if (indice === -1) {
    throw new Error('Música não encontrada no carrinho');
  }

  // Buscar valor unitário da música
  const configuracao = await prisma.configuracoes.findUnique({
    where: { chave: 'PRECO_MUSICA' },
  });
  const valorUnitario = parseFloat(configuracao?.valor || 5.0);

  // Remover música
  titulos.splice(indice, 1);
  ids.splice(indice, 1);
  thumbs.splice(indice, 1);
  duracoes.splice(indice, 1);

  const novoValorTotal = Math.max(0, carrinho.valorTotal - valorUnitario);
  const novaQuantidade = titulos.length;

  // Atualizar carrinho
  const carrinhoAtualizado = await prisma.carrinhos.update({
    where: { id: carrinho.id },
    data: {
      musicasTitulos: JSON.stringify(titulos),
      musicasIds: JSON.stringify(ids),
      musicasThumbs: JSON.stringify(thumbs),
      musicasDuracoes: JSON.stringify(duracoes),
      valorTotal: novoValorTotal,
      quantidadeItens: novaQuantidade,
    },
  });

  console.log(`🗑️  Música removida do carrinho`);
  console.log(`🛒 Total de itens: ${novaQuantidade}`);
  console.log(`💰 Valor total: R$ ${novoValorTotal.toFixed(2)}`);

  return formatarCarrinho(carrinhoAtualizado);
}

/**
 * Lista o carrinho atual
 */
async function listarCarrinho(sessionId) {
  const carrinho = await buscarOuCriarCarrinho(sessionId);
  return formatarCarrinho(carrinho);
}

/**
 * Limpa o carrinho
 */
async function limparCarrinho(sessionId) {
  const carrinho = await buscarOuCriarCarrinho(sessionId);

  const carrinhoLimpo = await prisma.carrinhos.update({
    where: { id: carrinho.id },
    data: {
      musicasTitulos: JSON.stringify([]),
      musicasIds: JSON.stringify([]),
      musicasThumbs: JSON.stringify([]),
      musicasDuracoes: JSON.stringify([]),
      valorTotal: 0,
      quantidadeItens: 0,
    },
  });

  console.log(`🗑️  Carrinho limpo: ${sessionId}`);

  return formatarCarrinho(carrinhoLimpo);
}

/**
 * Define nome do cliente no carrinho
 */
async function definirNomeCliente(sessionId, nomeCliente) {
  const carrinho = await buscarOuCriarCarrinho(sessionId);

  const carrinhoAtualizado = await prisma.carrinhos.update({
    where: { id: carrinho.id },
    data: { nomeCliente },
  });

  return formatarCarrinho(carrinhoAtualizado);
}

/**
 * Formata carrinho para resposta da API
 */
function formatarCarrinho(carrinho) {
  const titulos = JSON.parse(carrinho.musicasTitulos);
  const ids = JSON.parse(carrinho.musicasIds);
  const thumbs = JSON.parse(carrinho.musicasThumbs);
  const duracoes = JSON.parse(carrinho.musicasDuracoes);

  const musicas = titulos.map((titulo, index) => ({
    titulo,
    youtubeId: ids[index],
    thumbnail: thumbs[index],
    duracao: duracoes[index],
  }));

  return {
    id: carrinho.id,
    sessionId: carrinho.sessionId,
    nomeCliente: carrinho.nomeCliente,
    musicas,
    valorTotal: carrinho.valorTotal,
    quantidadeItens: carrinho.quantidadeItens,
    expiraEm: carrinho.expiraEm,
  };
}

/**
 * Remove carrinhos expirados (executar periodicamente)
 */
async function limparCarrinhosExpirados() {
  const agora = new Date();

  const resultado = await prisma.carrinhos.deleteMany({
    where: {
      expiraEm: {
        lt: agora,
      },
    },
  });

  if (resultado.count > 0) {
    console.log(`🗑️  ${resultado.count} carrinhos expirados removidos`);
  }

  return resultado.count;
}

module.exports = {
  buscarOuCriarCarrinho,
  adicionarMusica,
  removerMusica,
  listarCarrinho,
  limparCarrinho,
  definirNomeCliente,
  limparCarrinhosExpirados,
};
