const musicaService = require('../services/musicaService');
const { buscarVideos, buscarDetalhesVideo } = require('../config/youtube');
const { registrarBusca } = require('../services/trendingService');
const downloadService = require('../services/downloadService');
const moderationService = require('../services/moderationService');

/**
 * Busca vídeos no YouTube
 */
async function buscar(req, res) {
  try {
    const { q, maxResults } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Parâmetro de busca é obrigatório' });
    }

    // Buscar configurações
    const prisma = require('../config/database');
    const [configFiltro, configTempoMaximo] = await Promise.all([
      prisma.configuracoes.findUnique({ where: { chave: 'SEARCH_FILTER_KEYWORD' } }),
      prisma.configuracoes.findUnique({ where: { chave: 'TEMPO_MAXIMO_MUSICA' } })
    ]);

    // Aplicar filtro automático se configurado
    let queryFinal = q;
    if (configFiltro && configFiltro.valor && configFiltro.valor.trim()) {
      const keyword = configFiltro.valor.trim();
      // Adicionar keyword apenas se não estiver já presente na busca
      if (!q.toLowerCase().includes(keyword.toLowerCase())) {
        queryFinal = `${q} ${keyword}`;
        console.log(`🔍 Filtro aplicado: "${q}" → "${queryFinal}"`);
      }
    }

    // Calcular duração máxima em segundos
    const tempoMaximoMinutos = configTempoMaximo ? parseInt(configTempoMaximo.valor) : 10;
    const maxDuration = tempoMaximoMinutos * 60; // Converter para segundos

    const videos = await buscarVideos(queryFinal, parseInt(maxResults) || 10, maxDuration);

    // Registrar busca no histórico (async, não bloquear resposta)
    registrarBusca(q, null, videos.length).catch(err =>
      console.error('Erro ao registrar busca:', err)
    );

    res.json(videos);
  } catch (error) {
    console.error('Erro ao buscar músicas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Busca detalhes de um vídeo específico
 */
async function detalhes(req, res) {
  try {
    const { videoId } = req.params;
    const video = await buscarDetalhesVideo(videoId);
    res.json(video);
  } catch (error) {
    console.error('Erro ao buscar detalhes do vídeo:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Cria um novo pedido de música
 */
async function criar(req, res) {
  try {
    const {
      nomeCliente,
      musicaTitulo,
      musicaYoutubeId,
      musicaThumbnail,
      musicaDuracao,
      prioridade,
      dedicatoria,
      dedicatoriaDe,
    } = req.body;

    // Validações
    if (!musicaTitulo || !musicaYoutubeId) {
      return res.status(400).json({
        error: 'Título e ID do YouTube são obrigatórios',
      });
    }

    // Validar conteúdo através do sistema de moderação
    const validacao = await moderationService.validarPedido({
      nomeCliente,
      musicaTitulo,
      dedicatoria,
      dedicatoriaDe,
    });

    if (!validacao.aprovado) {
      console.log('\n🚫 ═══════════════════════════════════════════════════════');
      console.log('   PEDIDO REJEITADO PELA MODERAÇÃO');
      console.log('   ═══════════════════════════════════════════════════════');
      console.log(`📋 Nome Cliente: "${nomeCliente}"`);
      console.log(`🎵 Título Música: "${musicaTitulo}"`);
      console.log(`💝 Dedicatória: "${dedicatoria || 'N/A'}"`);
      console.log(`❌ Motivo: ${validacao.motivo}`);
      console.log(`📍 Campo bloqueado: ${validacao.campo}`);
      console.log(`🔍 Palavras detectadas: ${validacao.palavrasEncontradas.map(p => `${p.palavra} (${p.severidade})`).join(', ')}`);
      console.log('═══════════════════════════════════════════════════════\n');

      return res.status(400).json({
        error: validacao.motivo,
      });
    }

    // Buscar configurações
    const prisma = require('../config/database');
    const [configPreco, configModoGratuito, configTempoMaximo, configPrecoNormal, configPrecoPrioritaria] = await Promise.all([
      prisma.configuracoes.findUnique({ where: { chave: 'PRECO_MUSICA' } }),
      prisma.configuracoes.findUnique({ where: { chave: 'modo_gratuito' } }),
      prisma.configuracoes.findUnique({ where: { chave: 'TEMPO_MAXIMO_MUSICA' } }),
      prisma.configuracoes.findUnique({ where: { chave: 'PRECO_MUSICA_NORMAL' } }),
      prisma.configuracoes.findUnique({ where: { chave: 'PRECO_MUSICA_PRIORITARIA' } }),
    ]);

    // Validar duração da música
    // TEMPO_MAXIMO_MUSICA está em minutos, converter para segundos
    const tempoMaximoMinutos = configTempoMaximo ? parseInt(configTempoMaximo.valor) : 8;
    const tempoMaximoSegundos = tempoMaximoMinutos * 60;
    if (musicaDuracao && musicaDuracao > tempoMaximoSegundos) {
      return res.status(400).json({
        error: `Música muito longa! O tempo máximo permitido é de ${tempoMaximoMinutos} minutos.`,
      });
    }

    const modoGratuito = configModoGratuito ? configModoGratuito.valor === 'true' : true;

    // Determinar o valor baseado na prioridade (apenas em modo pago)
    let valor;
    if (modoGratuito) {
      valor = 0; // Modo gratuito não tem valor
    } else if (prioridade) {
      valor = configPrecoPrioritaria ? parseFloat(configPrecoPrioritaria.valor) : 10.0;
    } else {
      valor = configPrecoNormal ? parseFloat(configPrecoNormal.valor) : 5.0;
    }

    const pedido = await musicaService.criarPedidoMusica({
      nomeCliente,
      musicaTitulo,
      musicaYoutubeId,
      musicaThumbnail,
      musicaDuracao,
      valor,
      prioridade: prioridade || false,
      dedicatoria: dedicatoria || null,
      dedicatoriaDe: dedicatoriaDe || null,
    });

    // Se modo gratuito, processar imediatamente (sem necessidade de download)
    // Música toca direto do YouTube via iframe/player (igual modo pago)
    if (modoGratuito) {
      console.log('💚 [MODO GRATUITO] Processando pedido gratuito (sem download):', pedido.id);
      const playerService = require('../services/playerService');

      const pedidoPago = await prisma.pedidos_musica.update({
        where: { id: pedido.id },
        data: { status: 'pago' },
      });
      console.log('✅ [MODO GRATUITO] Pedido marcado como pago:', pedidoPago.id);

      // Emitir evento WebSocket para atualizar fila
      const io = req.app.get('io');
      console.log('🔌 [MODO GRATUITO] WebSocket io disponível?', !!io);

      if (io) {
        const fila = await musicaService.buscarFilaMusicas();
        console.log('📋 [MODO GRATUITO] Fila atual:', fila.length, 'músicas');
        io.emit('fila:atualizada', fila);
      }

      // 🎯 GARANTIR AUTOPLAY - Função centralizada e robusta
      console.log('💚 [MODO GRATUITO] Garantindo autoplay...');
      try {
        const musicaIniciada = await playerService.garantirAutoplay();

        if (musicaIniciada) {
          console.log('✅ [MODO GRATUITO] Autoplay garantido! Música:', musicaIniciada.musicaTitulo);
        } else {
          console.log('ℹ️  [MODO GRATUITO] Autoplay não necessário (já está tocando ou fila vazia)');
        }
      } catch (error) {
        console.error('❌ [MODO GRATUITO] Erro ao garantir autoplay:', error.message);
      }

      if (io) {
        io.emit('pedido:pago', { pedidoId: pedidoPago.id });
      }

      return res.status(201).json(pedidoPago);
    }

    // Modo não-gratuito: iniciar download em background
    console.log('📥 [MODO PAGO] Iniciando download em background:', musicaYoutubeId);
    downloadService.baixarVideo(musicaYoutubeId)
      .then(result => {
        if (result.cached) {
          console.log(`✅ [MODO PAGO] Vídeo ${musicaYoutubeId} já estava em cache`);
        } else {
          console.log(`✅ [MODO PAGO] Download completo: ${musicaYoutubeId}`);
        }
      })
      .catch(error => {
        console.error(`❌ [MODO PAGO] Erro ao baixar vídeo ${musicaYoutubeId}:`, error.message);
      });

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro ao criar pedido de música:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Busca fila de músicas
 */
async function fila(req, res) {
  try {
    const musicas = await musicaService.buscarFilaMusicas();
    res.json(musicas);
  } catch (error) {
    console.error('Erro ao buscar fila de músicas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Busca música atual
 */
async function atual(req, res) {
  try {
    const musica = await musicaService.buscarMusicaAtual();
    res.json(musica);
  } catch (error) {
    console.error('Erro ao buscar música atual:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Marca música como tocando
 */
async function tocar(req, res) {
  try {
    const { id } = req.params;
    const musica = await musicaService.tocarMusica(id);

    // Emitir evento via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('musica:tocando', musica);
    }

    res.json(musica);
  } catch (error) {
    console.error('Erro ao tocar música:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Marca música como concluída
 */
async function concluir(req, res) {
  try {
    const { id } = req.params;
    const proximaMusica = await musicaService.concluirMusica(id);

    // Emitir eventos via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('musica:concluida', { id });

      if (proximaMusica) {
        io.emit('musica:tocando', proximaMusica);
      } else {
        io.emit('fila:vazia');
      }
    }

    res.json({ success: true, proximaMusica });
  } catch (error) {
    console.error('Erro ao concluir música:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Pula música atual
 */
async function pular(req, res) {
  try {
    const { id } = req.params;
    const proximaMusica = await musicaService.pularMusica(id);

    // Emitir eventos via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('musica:pulada', { id });

      if (proximaMusica) {
        io.emit('musica:tocando', proximaMusica);
      } else {
        io.emit('fila:vazia');
      }
    }

    res.json({ success: true, proximaMusica });
  } catch (error) {
    console.error('Erro ao pular música:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Cancela pedido de música
 */
async function cancelar(req, res) {
  try {
    const { id } = req.params;
    const pedido = await musicaService.cancelarPedido(id);

    // Emitir evento via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('pedido:cancelado', pedido);
    }

    res.json(pedido);
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Busca histórico de músicas
 */
async function historico(req, res) {
  try {
    const { limite } = req.query;
    const musicas = await musicaService.buscarHistorico(parseInt(limite) || 50);
    res.json(musicas);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Busca pedido por ID
 */
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const pedido = await musicaService.buscarPedidoPorId(id);
    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Atualiza um pedido (ex: nome do cliente no modo gratuito)
 */
async function atualizarPedido(req, res) {
  try {
    const { id } = req.params;
    const { nomeCliente } = req.body;

    if (!nomeCliente || !nomeCliente.trim()) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }

    const prisma = require('../config/database');

    // Verificar se o pedido existe
    const pedido = await prisma.pedidos_musica.findUnique({
      where: { id }
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Atualizar o nome do cliente
    const pedidoAtualizado = await prisma.pedidos_musica.update({
      where: { id },
      data: { nomeCliente: nomeCliente.trim() }
    });

    console.log(`✅ Pedido ${id} atualizado com nome: ${nomeCliente.trim()}`);

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  buscar,
  detalhes,
  criar,
  fila,
  atual,
  tocar,
  concluir,
  pular,
  cancelar,
  historico,
  buscarPorId,
  atualizarPedido,
};
