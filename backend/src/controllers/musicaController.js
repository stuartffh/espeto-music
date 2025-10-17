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

    // Buscar configuração de filtro de busca
    const prisma = require('../config/database');
    const configFiltro = await prisma.configuracao.findUnique({
      where: { chave: 'SEARCH_FILTER_KEYWORD' }
    });

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

    const videos = await buscarVideos(queryFinal, parseInt(maxResults) || 10);

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
    });

    if (!validacao.aprovado) {
      console.log('\n🚫 ═══════════════════════════════════════════════════════');
      console.log('   PEDIDO REJEITADO PELA MODERAÇÃO');
      console.log('   ═══════════════════════════════════════════════════════');
      console.log(`📋 Nome Cliente: "${nomeCliente}"`);
      console.log(`🎵 Título Música: "${musicaTitulo}"`);
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
    const [configPreco, configModoGratuito, configTempoMaximo] = await Promise.all([
      prisma.configuracao.findUnique({ where: { chave: 'PRECO_MUSICA' } }),
      prisma.configuracao.findUnique({ where: { chave: 'modo_gratuito' } }),
      prisma.configuracao.findUnique({ where: { chave: 'TEMPO_MAXIMO_MUSICA' } }),
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

    const valor = configPreco ? parseFloat(configPreco.valor) : 5.0;
    const modoGratuito = configModoGratuito ? configModoGratuito.valor === 'true' : true;

    const pedido = await musicaService.criarPedidoMusica({
      nomeCliente,
      musicaTitulo,
      musicaYoutubeId,
      musicaThumbnail,
      musicaDuracao,
      valor,
    });

    // Se modo gratuito, aguardar download completar ANTES de processar
    if (modoGratuito) {
      console.log('📥 [MODO GRATUITO] Aguardando download do vídeo:', musicaYoutubeId);

      try {
        // AGUARDAR o download completar
        const downloadResult = await downloadService.baixarVideo(musicaYoutubeId);

        if (downloadResult.cached) {
          console.log(`✅ [MODO GRATUITO] Vídeo ${musicaYoutubeId} já estava em cache`);
        } else {
          console.log(`✅ [MODO GRATUITO] Download completo: ${musicaYoutubeId}`);
        }
      } catch (error) {
        console.error(`❌ [MODO GRATUITO] Erro ao baixar vídeo ${musicaYoutubeId}:`, error.message);
        return res.status(500).json({
          error: 'Falha ao baixar o vídeo. Tente novamente.',
          details: error.message
        });
      }

      // Download completo! Agora pode processar
      console.log('💰 [MODO GRATUITO] Processando pedido:', pedido.id);
      const playerService = require('../services/playerService');

      const pedidoPago = await prisma.pedidoMusica.update({
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
};
