const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para gerar código único de gift card
function gerarCodigo() {
  const parte1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const parte2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GIFT-${parte1}-${parte2}`;
}

// Listar todos os gift cards (admin)
exports.listar = async (req, res) => {
  try {
    const gifts = await prisma.giftCard.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        pedidoMusica: {
          select: {
            id: true,
            musicaTitulo: true,
            nomeCliente: true
          }
        }
      }
    });

    res.json(gifts);
  } catch (error) {
    console.error('Erro ao listar gift cards:', error);
    res.status(500).json({ erro: 'Erro ao listar gift cards' });
  }
};

// Criar novo gift card (admin)
exports.criar = async (req, res) => {
  try {
    const { valor, quantidadeMusicas, dataExpiracao, observacao } = req.body;

    if (!quantidadeMusicas || quantidadeMusicas < 1) {
      return res.status(400).json({ erro: 'Quantidade de músicas inválida' });
    }

    const codigo = gerarCodigo();

    const gift = await prisma.giftCard.create({
      data: {
        codigo,
        valor: valor || 0,
        quantidadeMusicas,
        dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        observacao
      }
    });

    res.status(201).json(gift);
  } catch (error) {
    console.error('Erro ao criar gift card:', error);
    res.status(500).json({ erro: 'Erro ao criar gift card' });
  }
};

// Validar gift card (público - para o cliente usar)
exports.validar = async (req, res) => {
  try {
    const { codigo } = req.params;

    const gift = await prisma.giftCard.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!gift) {
      return res.status(404).json({ erro: 'Gift card não encontrado' });
    }

    if (!gift.ativo) {
      return res.status(400).json({ erro: 'Gift card desativado' });
    }

    if (gift.usado) {
      return res.status(400).json({
        erro: 'Gift card já utilizado',
        usadoEm: gift.usadoEm,
        usadoPor: gift.usadoPor
      });
    }

    if (gift.dataExpiracao && new Date(gift.dataExpiracao) < new Date()) {
      return res.status(400).json({ erro: 'Gift card expirado' });
    }

    res.json({
      valido: true,
      quantidadeMusicas: gift.quantidadeMusicas,
      valor: gift.valor
    });
  } catch (error) {
    console.error('Erro ao validar gift card:', error);
    res.status(500).json({ erro: 'Erro ao validar gift card' });
  }
};

// Usar gift card (link com pedido de música)
exports.usar = async (req, res) => {
  try {
    const { codigo, pedidoMusicaId, nomeCliente } = req.body;

    const gift = await prisma.giftCard.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!gift || !gift.ativo || gift.usado) {
      return res.status(400).json({ erro: 'Gift card inválido ou já usado' });
    }

    if (gift.dataExpiracao && new Date(gift.dataExpiracao) < new Date()) {
      return res.status(400).json({ erro: 'Gift card expirado' });
    }

    // Buscar o pedido de música
    const pedido = await prisma.pedidoMusica.findUnique({
      where: { id: pedidoMusicaId }
    });

    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido de música não encontrado' });
    }

    console.log('🎁 [GIFT CARD] Processando pagamento com gift card:', codigo);
    console.log('📥 [GIFT CARD] Aguardando download do vídeo:', pedido.musicaYoutubeId);

    // AGUARDAR o download completar (igual ao modo gratuito)
    const downloadService = require('../services/downloadService');
    try {
      const downloadResult = await downloadService.baixarVideo(pedido.musicaYoutubeId);

      if (downloadResult.cached) {
        console.log(`✅ [GIFT CARD] Vídeo ${pedido.musicaYoutubeId} já estava em cache`);
      } else {
        console.log(`✅ [GIFT CARD] Download completo: ${pedido.musicaYoutubeId}`);
      }
    } catch (error) {
      console.error(`❌ [GIFT CARD] Erro ao baixar vídeo ${pedido.musicaYoutubeId}:`, error.message);
      return res.status(500).json({
        erro: 'Falha ao baixar o vídeo. Tente novamente.',
        details: error.message
      });
    }

    // Download completo! Agora pode processar
    console.log('💰 [GIFT CARD] Processando pedido:', pedido.id);

    // Marcar gift como usado
    const giftAtualizado = await prisma.giftCard.update({
      where: { id: gift.id },
      data: {
        usado: true,
        usadoEm: new Date(),
        usadoPor: nomeCliente,
        pedidoMusicaId
      }
    });

    // Marcar pedido como pago
    const pedidoPago = await prisma.pedidoMusica.update({
      where: { id: pedido.id },
      data: { status: 'pago' }
    });
    console.log('✅ [GIFT CARD] Pedido marcado como pago:', pedidoPago.id);

    // Emitir evento WebSocket para atualizar fila
    const io = req.app.get('io');
    console.log('🔌 [GIFT CARD] WebSocket io disponível?', !!io);

    if (io) {
      const musicaService = require('../services/musicaService');
      const fila = await musicaService.buscarFilaMusicas();
      console.log('📋 [GIFT CARD] Fila atual:', fila.length, 'músicas');
      io.emit('fila:atualizada', fila);

      // Se não houver música tocando no playerService, iniciar
      const playerService = require('../services/playerService');
      const estadoPlayer = playerService.obterEstado();
      console.log('🎮 [GIFT CARD] Estado do player:', {
        temMusicaAtual: !!estadoPlayer.musicaAtual,
        status: estadoPlayer.status
      });

      if (!estadoPlayer.musicaAtual) {
        console.log('▶️ [GIFT CARD] Nenhuma música tocando no player, iniciando automaticamente...');

        // Limpar qualquer música com status "tocando" no banco (dados stale)
        const musicaStale = await musicaService.buscarMusicaAtual();
        if (musicaStale) {
          console.log('🧹 [GIFT CARD] Limpando música stale do banco:', musicaStale.id);
          await prisma.pedidoMusica.update({
            where: { id: musicaStale.id },
            data: { status: 'pago' }
          });
        }

        // Agora marcar a nova música como tocando
        const musicaTocando = await prisma.pedidoMusica.update({
          where: { id: pedidoPago.id },
          data: { status: 'tocando' }
        });
        console.log('🎵 [GIFT CARD] Música marcada como tocando:', musicaTocando.id, musicaTocando.musicaTitulo);

        await playerService.iniciarMusica(musicaTocando);
        console.log('✅ [GIFT CARD] playerService.iniciarMusica() chamado com sucesso');
      } else {
        console.log('⏭️ [GIFT CARD] Já existe música tocando, adicionando à fila');
      }

      io.emit('pedido:pago', { pedidoId: pedidoPago.id });
    }

    res.json({
      sucesso: true,
      gift: giftAtualizado,
      pedido: pedidoPago
    });
  } catch (error) {
    console.error('Erro ao usar gift card:', error);
    res.status(500).json({ erro: 'Erro ao usar gift card' });
  }
};

// Desativar gift card (admin)
exports.desativar = async (req, res) => {
  try {
    const { id } = req.params;

    const gift = await prisma.giftCard.update({
      where: { id },
      data: { ativo: false }
    });

    res.json(gift);
  } catch (error) {
    console.error('Erro ao desativar gift card:', error);
    res.status(500).json({ erro: 'Erro ao desativar gift card' });
  }
};

// Deletar gift card (admin)
exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.giftCard.delete({
      where: { id }
    });

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao deletar gift card:', error);
    res.status(500).json({ erro: 'Erro ao deletar gift card' });
  }
};

// Usar gift card para carrinho (múltiplas músicas)
exports.usarCarrinho = async (req, res) => {
  try {
    const { codigo, nomeCliente, carrinho } = req.body;

    console.log('🎁 [GIFT CARD CARRINHO] Iniciando processamento...');
    console.log('📦 Carrinho:', { quantidadeItens: carrinho?.quantidadeItens, musicas: carrinho?.musicas?.length });

    // Validações básicas
    if (!codigo || !nomeCliente || !carrinho || !carrinho.musicas || carrinho.musicas.length === 0) {
      return res.status(400).json({ erro: 'Dados inválidos para usar gift card no carrinho' });
    }

    // Buscar gift card
    const gift = await prisma.giftCard.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!gift) {
      return res.status(404).json({ erro: 'Gift card não encontrado' });
    }

    if (!gift.ativo) {
      return res.status(400).json({ erro: 'Gift card desativado' });
    }

    if (gift.usado) {
      return res.status(400).json({
        erro: 'Gift card já utilizado',
        usadoEm: gift.usadoEm,
        usadoPor: gift.usadoPor
      });
    }

    if (gift.dataExpiracao && new Date(gift.dataExpiracao) < new Date()) {
      return res.status(400).json({ erro: 'Gift card expirado' });
    }

    console.log('✅ [GIFT CARD CARRINHO] Gift card válido:', {
      codigo: gift.codigo,
      quantidadeMusicas: gift.quantidadeMusicas,
      valor: gift.valor
    });

    // Calcular total do carrinho
    const totalMusicas = carrinho.quantidadeItens;
    const valorTotalCarrinho = carrinho.musicas.reduce((acc, m) => acc + (m.preco || 0), 0);

    console.log('💰 [GIFT CARD CARRINHO] Valores:', {
      totalMusicas,
      valorTotalCarrinho,
      giftQuantidade: gift.quantidadeMusicas,
      giftValor: gift.valor
    });

    // Verificar se o gift card cobre o carrinho
    // Gift card pode ser por QUANTIDADE ou por VALOR
    let coberto = false;
    let tipoCoberto = '';

    if (gift.quantidadeMusicas > 0 && totalMusicas <= gift.quantidadeMusicas) {
      coberto = true;
      tipoCoberto = 'quantidade';
      console.log(`✅ [GIFT CARD CARRINHO] Gift card cobre por QUANTIDADE (${gift.quantidadeMusicas} músicas >= ${totalMusicas} músicas)`);
    } else if (gift.valor > 0 && valorTotalCarrinho <= gift.valor) {
      coberto = true;
      tipoCoberto = 'valor';
      console.log(`✅ [GIFT CARD CARRINHO] Gift card cobre por VALOR (R$ ${gift.valor} >= R$ ${valorTotalCarrinho})`);
    }

    if (!coberto) {
      return res.status(400).json({
        erro: gift.quantidadeMusicas > 0
          ? `Gift card insuficiente. Seu carrinho tem ${totalMusicas} música(s), mas o gift card cobre apenas ${gift.quantidadeMusicas} música(s).`
          : `Gift card insuficiente. Seu carrinho custa R$ ${valorTotalCarrinho.toFixed(2)}, mas o gift card vale apenas R$ ${gift.valor.toFixed(2)}.`
      });
    }

    // Criar pedidos de música para cada item do carrinho
    const pedidosCriados = [];
    const downloadService = require('../services/downloadService');

    console.log('📝 [GIFT CARD CARRINHO] Criando pedidos de música...');

    for (const musica of carrinho.musicas) {
      console.log(`🎵 Criando pedido: ${musica.musicaTitulo} (${musica.musicaYoutubeId})`);

      // Criar pedido
      const pedido = await prisma.pedidoMusica.create({
        data: {
          nomeCliente: nomeCliente.trim(),
          musicaTitulo: musica.musicaTitulo,
          musicaArtista: musica.musicaArtista || 'Artista Desconhecido',
          musicaThumbnail: musica.musicaThumbnail || '',
          musicaYoutubeId: musica.musicaYoutubeId,
          musicaDuracao: musica.musicaDuracao || 0,
          status: 'pago', // Já marcar como pago
          modoGratuito: false,
          metodoPagamento: 'gift_card',
        }
      });

      pedidosCriados.push(pedido);
      console.log(`✅ Pedido criado: ${pedido.id}`);

      // Iniciar download do vídeo (não esperar)
      downloadService.baixarVideo(musica.musicaYoutubeId)
        .then(() => console.log(`✅ [GIFT CARD CARRINHO] Download completo: ${musica.musicaTitulo}`))
        .catch((error) => console.error(`❌ [GIFT CARD CARRINHO] Erro ao baixar ${musica.musicaTitulo}:`, error.message));
    }

    console.log(`✅ [GIFT CARD CARRINHO] ${pedidosCriados.length} pedido(s) criado(s)`);

    // Marcar gift como usado (vincular ao primeiro pedido)
    const giftAtualizado = await prisma.giftCard.update({
      where: { id: gift.id },
      data: {
        usado: true,
        usadoEm: new Date(),
        usadoPor: nomeCliente,
        pedidoMusicaId: pedidosCriados[0].id // Vincular ao primeiro pedido
      }
    });

    console.log('✅ [GIFT CARD CARRINHO] Gift card marcado como usado');

    // Emitir evento WebSocket para atualizar fila
    const io = req.app.get('io');
    if (io) {
      const musicaService = require('../services/musicaService');
      const fila = await musicaService.buscarFilaMusicas();
      console.log('📋 [GIFT CARD CARRINHO] Fila atual:', fila.length, 'músicas');
      io.emit('fila:atualizada', fila);

      // Se não houver música tocando, iniciar automaticamente
      const playerService = require('../services/playerService');
      const estadoPlayer = playerService.obterEstado();

      if (!estadoPlayer.musicaAtual) {
        console.log('▶️ [GIFT CARD CARRINHO] Nenhuma música tocando, iniciando primeira do carrinho...');

        // Marcar primeira música como tocando
        const primeiraMusicaTocando = await prisma.pedidoMusica.update({
          where: { id: pedidosCriados[0].id },
          data: { status: 'tocando' }
        });

        await playerService.iniciarMusica(primeiraMusicaTocando);
        console.log('✅ [GIFT CARD CARRINHO] Primeira música iniciada');
      } else {
        console.log('⏭️ [GIFT CARD CARRINHO] Já existe música tocando, carrinho adicionado à fila');
      }

      // Emitir eventos para cada pedido
      pedidosCriados.forEach(pedido => {
        io.emit('pedido:pago', { pedidoId: pedido.id });
      });
    }

    res.json({
      sucesso: true,
      gift: giftAtualizado,
      pedidos: pedidosCriados,
      tipoCoberto,
      mensagem: `Gift card aplicado com sucesso! ${totalMusicas} música(s) adicionada(s) à fila.`
    });

  } catch (error) {
    console.error('❌ [GIFT CARD CARRINHO] Erro:', error);
    res.status(500).json({ erro: 'Erro ao usar gift card no carrinho' });
  }
};
