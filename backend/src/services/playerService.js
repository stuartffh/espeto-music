/**
 * Player Service - Controle centralizado do player com backup em banco de dados
 *
 * Features:
 * - Estado global sincronizado com banco de dados
 * - Recuperação automática após crash
 * - Auto-correção de inconsistências
 * - Backup contínuo do tempo de reprodução
 * - MULTI-TENANT: Um estado independente por estabelecimento
 */

const prisma = require('../config/database');

// ========================================
// MULTI-TENANT: Map de estados por estabelecimento
// ========================================
// Estrutura: Map<estabelecimentoId, EstadoPlayer>
const estadosMemoria = new Map();

// Estrutura de intervalos por estabelecimento
const intervalosSync = new Map();
const intervalosBackup = new Map();
const intervalosAutoplay = new Map();

let io = null;

/**
 * Obtém ou cria estado em memória para um estabelecimento
 */
function obterEstadoMemoria(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  if (!estadosMemoria.has(estabelecimentoId)) {
    estadosMemoria.set(estabelecimentoId, {
      musicaAtual: null,
      status: 'stopped',
      tempoAtual: 0,
      volume: 80,
      ultimaAtualizacao: Date.now(),
    });
  }

  return estadosMemoria.get(estabelecimentoId);
}

/**
 * Inicializa o player service e recupera estado do banco
 * MULTI-TENANT: Recupera estados de TODOS os estabelecimentos ativos
 */
async function inicializar(socketIo) {
  io = socketIo;

  console.log('🎮 Player Service: Inicializando (Multi-Tenant)...');

  // Recuperar estados de todos os estabelecimentos
  await recuperarTodosEstados();

  console.log('✅ Player Service inicializado');
}

/**
 * Recupera estados de TODOS os estabelecimentos ativos
 */
async function recuperarTodosEstados() {
  try {
    console.log('🔄 Recuperando estados de todos os estabelecimentos...');

    // Buscar todos os estabelecimentos ativos
    const estabelecimentos = await prisma.estabelecimento.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    });

    console.log(`📍 Encontrados ${estabelecimentos.length} estabelecimentos ativos`);

    // Recuperar estado de cada um
    for (const estab of estabelecimentos) {
      await recuperarEstado(estab.id);
    }

  } catch (error) {
    console.error('❌ Erro ao recuperar estados:', error);
  }
}

/**
 * Recupera o estado salvo no banco para um estabelecimento específico
 * MULTI-TENANT: Agora recebe estabelecimentoId
 */
async function recuperarEstado(estabelecimentoId) {
  try {
    console.log(`🔄 Recuperando estado do estabelecimento ${estabelecimentoId}...`);

    // Buscar estado salvo
    let estadoSalvo = await prisma.estadoPlayer.findUnique({
      where: { estabelecimentoId }
    });

    // Se não existe, criar registro inicial
    if (!estadoSalvo) {
      console.log('📝 Criando registro inicial de estado...');
      estadoSalvo = await prisma.estadoPlayer.create({
        data: {
          estabelecimentoId,
          status: 'stopped',
          tempoAtual: 0,
          volume: 80,
        }
      });
    }

    const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

    // Se tinha música tocando, recuperar
    if (estadoSalvo.musicaAtualId) {
      const musicaAtual = await prisma.pedidoMusica.findUnique({
        where: { id: estadoSalvo.musicaAtualId }
      });

      if (musicaAtual && musicaAtual.status === 'tocando') {
        console.log('🎵 Recuperando música:', musicaAtual.musicaTitulo);
        console.log('⏱️  Tempo salvo:', Math.floor(estadoSalvo.tempoAtual), 'segundos');

        estadoMemoria.musicaAtual = musicaAtual;
        estadoMemoria.status = estadoSalvo.status;
        estadoMemoria.tempoAtual = estadoSalvo.tempoAtual;
        estadoMemoria.volume = estadoSalvo.volume;
        estadoMemoria.ultimaAtualizacao = Date.now();

        // Se estava tocando, retomar
        if (estadoSalvo.status === 'playing') {
          console.log('▶️ Retomando reprodução automaticamente...');
          iniciarSincronizacao(estabelecimentoId);
          iniciarBackup(estabelecimentoId);
          iniciarVerificadorAutoplay(estabelecimentoId);

          // Emitir evento para TVs do estabelecimento retomarem
          if (io) {
            io.to(`estabelecimento:${estabelecimentoId}`).emit('player:iniciar', {
              musica: musicaAtual,
              estado: estadoMemoria,
            });
          }
        }
      } else {
        console.log('⚠️  Música salva não encontrada ou inconsistente, limpando estado...');
        await limparEstado(estabelecimentoId);
      }
    } else {
      console.log('ℹ️  Nenhuma música em reprodução');
      estadoMemoria.volume = estadoSalvo.volume;
      // Iniciar autoplay mesmo sem música tocando
      iniciarVerificadorAutoplay(estabelecimentoId);
    }

  } catch (error) {
    console.error('❌ Erro ao recuperar estado:', error);
  }
}

/**
 * Salva o estado atual no banco de dados
 * MULTI-TENANT: Salva estado de um estabelecimento específico
 */
async function salvarEstado(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  try {
    const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

    await prisma.estadoPlayer.upsert({
      where: { estabelecimentoId },
      update: {
        musicaAtualId: estadoMemoria.musicaAtual?.id || null,
        status: estadoMemoria.status,
        tempoAtual: estadoMemoria.tempoAtual,
        volume: estadoMemoria.volume,
        ultimaAtualizacao: new Date(),
      },
      create: {
        estabelecimentoId,
        musicaAtualId: estadoMemoria.musicaAtual?.id || null,
        status: estadoMemoria.status,
        tempoAtual: estadoMemoria.tempoAtual,
        volume: estadoMemoria.volume,
      }
    });
  } catch (error) {
    console.error('❌ Erro ao salvar estado:', error);
  }
}

/**
 * Limpa o estado do banco
 * MULTI-TENANT: Limpa estado de um estabelecimento específico
 */
async function limparEstado(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  await prisma.estadoPlayer.update({
    where: { estabelecimentoId },
    data: {
      musicaAtualId: null,
      status: 'stopped',
      tempoAtual: 0,
    }
  });

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);
  estadoMemoria.musicaAtual = null;
  estadoMemoria.status = 'stopped';
  estadoMemoria.tempoAtual = 0;
}

/**
 * Inicia backup periódico do estado (a cada 3 segundos)
 * MULTI-TENANT: Um intervalo por estabelecimento
 */
function iniciarBackup(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  pararBackup(estabelecimentoId);

  const interval = setInterval(async () => {
    await salvarEstado(estabelecimentoId);
  }, 3000); // Backup a cada 3 segundos

  intervalosBackup.set(estabelecimentoId, interval);
}

/**
 * Para backup periódico
 * MULTI-TENANT: Para backup de um estabelecimento específico
 */
function pararBackup(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const interval = intervalosBackup.get(estabelecimentoId);
  if (interval) {
    clearInterval(interval);
    intervalosBackup.delete(estabelecimentoId);
  }
}

/**
 * Inicia uma nova música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function iniciarMusica(musica, estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  console.log('▶️ Player: Iniciando música', musica.musicaTitulo, 'no estabelecimento', estabelecimentoId);

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);
  const volumeAtual = estadoMemoria.volume;

  estadoMemoria.musicaAtual = musica;
  estadoMemoria.status = 'playing';
  estadoMemoria.tempoAtual = 0;
  estadoMemoria.volume = volumeAtual;
  estadoMemoria.ultimaAtualizacao = Date.now();

  // Salvar no banco imediatamente
  await salvarEstado(estabelecimentoId);

  // Iniciar sincronização e backup
  iniciarSincronizacao(estabelecimentoId);
  iniciarBackup(estabelecimentoId);

  // Emitir evento WebSocket apenas para estabelecimento específico
  if (io) {
    io.to(`estabelecimento:${estabelecimentoId}`).emit('player:iniciar', {
      musica,
      estado: estadoMemoria,
    });
  }

  return { ...estadoMemoria };
}

/**
 * Pausa a música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function pausar(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

  if (estadoMemoria.status === 'playing') {
    console.log('⏸️ Player: Pausando no estabelecimento', estabelecimentoId);
    estadoMemoria.status = 'paused';
    estadoMemoria.ultimaAtualizacao = Date.now();

    await salvarEstado(estabelecimentoId);
    pararSincronizacao(estabelecimentoId);
    // Manter backup para salvar estado pausado

    if (io) {
      io.to(`estabelecimento:${estabelecimentoId}`).emit('player:pausar', { estado: estadoMemoria });
    }
  }
  return { ...estadoMemoria };
}

/**
 * Retoma a música pausada
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function retomar(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

  if (estadoMemoria.status === 'paused') {
    console.log('▶️ Player: Retomando no estabelecimento', estabelecimentoId);
    estadoMemoria.status = 'playing';
    estadoMemoria.ultimaAtualizacao = Date.now();

    await salvarEstado(estabelecimentoId);
    iniciarSincronizacao(estabelecimentoId);

    if (io) {
      io.to(`estabelecimento:${estabelecimentoId}`).emit('player:retomar', { estado: estadoMemoria });
    }
  }
  return { ...estadoMemoria };
}

/**
 * Para completamente
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function parar(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  console.log('⏹️ Player: Parando no estabelecimento', estabelecimentoId);

  pararSincronizacao(estabelecimentoId);
  pararBackup(estabelecimentoId);

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);
  const volumeAtual = estadoMemoria.volume;

  estadoMemoria.musicaAtual = null;
  estadoMemoria.status = 'stopped';
  estadoMemoria.tempoAtual = 0;
  estadoMemoria.volume = volumeAtual;
  estadoMemoria.ultimaAtualizacao = Date.now();

  await salvarEstado(estabelecimentoId);

  if (io) {
    io.to(`estabelecimento:${estabelecimentoId}`).emit('player:parar', { estado: estadoMemoria });
  }

  return { ...estadoMemoria };
}

/**
 * Pula para a próxima música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function pularMusica(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  console.log('⏭️ Player: Pulando música no estabelecimento', estabelecimentoId);

  const musicaService = require('./musicaService');
  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

  if (estadoMemoria.musicaAtual) {
    const proximaMusica = await musicaService.pularMusica(estadoMemoria.musicaAtual.id, estabelecimentoId);

    pararSincronizacao(estabelecimentoId);
    pararBackup(estabelecimentoId);

    if (proximaMusica) {
      return await iniciarMusica(proximaMusica, estabelecimentoId);
    } else {
      return await parar(estabelecimentoId);
    }
  }

  return { ...estadoMemoria };
}

/**
 * Chamado quando a música termina naturalmente
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function musicaTerminou(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  console.log('🎵 Player: Música terminou no estabelecimento', estabelecimentoId);

  const musicaService = require('./musicaService');
  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

  if (estadoMemoria.musicaAtual) {
    const proximaMusica = await musicaService.concluirMusica(estadoMemoria.musicaAtual.id, estabelecimentoId);

    pararSincronizacao(estabelecimentoId);
    pararBackup(estabelecimentoId);

    if (proximaMusica) {
      return await iniciarMusica(proximaMusica, estabelecimentoId);
    } else {
      return await parar(estabelecimentoId);
    }
  }

  return { ...estadoMemoria };
}

/**
 * Ajusta o volume
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function ajustarVolume(nivel, estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  console.log('🔊 Player: Volume ajustado para', nivel, 'no estabelecimento', estabelecimentoId);

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);
  estadoMemoria.volume = nivel;

  await salvarEstado(estabelecimentoId);

  if (io) {
    io.to(`estabelecimento:${estabelecimentoId}`).emit('player:volume', { volume: nivel });
  }

  return { ...estadoMemoria };
}

/**
 * Busca para um tempo específico
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function buscarTempo(tempo, estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  console.log('⏩ Player: Buscando para', tempo, 'segundos no estabelecimento', estabelecimentoId);

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);
  estadoMemoria.tempoAtual = tempo;
  estadoMemoria.ultimaAtualizacao = Date.now();

  await salvarEstado(estabelecimentoId);

  if (io) {
    io.to(`estabelecimento:${estabelecimentoId}`).emit('player:buscar', { tempo });
  }

  return { ...estadoMemoria };
}

/**
 * Retorna o estado atual
 * MULTI-TENANT: Requer estabelecimentoId
 */
function obterEstado(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);
  return { ...estadoMemoria };
}

/**
 * Sincronização de tempo (a cada segundo)
 * MULTI-TENANT: Um intervalo por estabelecimento
 */
function iniciarSincronizacao(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  pararSincronizacao(estabelecimentoId);

  const interval = setInterval(() => {
    const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

    if (estadoMemoria.status === 'playing') {
      const agora = Date.now();
      const deltaSegundos = (agora - estadoMemoria.ultimaAtualizacao) / 1000;
      estadoMemoria.tempoAtual += deltaSegundos;
      estadoMemoria.ultimaAtualizacao = agora;

      // Emitir sync a cada 5 segundos
      if (Math.floor(estadoMemoria.tempoAtual) % 5 === 0) {
        if (io) {
          io.to(`estabelecimento:${estabelecimentoId}`).emit('player:sync', {
            tempo: estadoMemoria.tempoAtual,
            status: estadoMemoria.status,
          });
        }
      }
    }
  }, 1000);

  intervalosSync.set(estabelecimentoId, interval);
}

/**
 * Para sincronização
 * MULTI-TENANT: Para sincronização de um estabelecimento específico
 */
function pararSincronizacao(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const interval = intervalosSync.get(estabelecimentoId);
  if (interval) {
    clearInterval(interval);
    intervalosSync.delete(estabelecimentoId);
  }
}

/**
 * Inicia verificador periódico de autoplay
 * Verifica a cada 10 segundos se há músicas na fila e player parado
 * MULTI-TENANT: Um intervalo por estabelecimento
 */
function iniciarVerificadorAutoplay(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  pararVerificadorAutoplay(estabelecimentoId);

  console.log('🔄 Iniciando verificador de autoplay para estabelecimento', estabelecimentoId);

  const interval = setInterval(async () => {
    try {
      // 🎯 Usar função centralizada de autoplay
      await garantirAutoplay(estabelecimentoId);
    } catch (error) {
      console.error('❌ Erro no verificador de autoplay:', error);
    }
  }, 10000); // A cada 10 segundos

  intervalosAutoplay.set(estabelecimentoId, interval);
}

/**
 * Para verificador de autoplay
 * MULTI-TENANT: Para autoplay de um estabelecimento específico
 */
function pararVerificadorAutoplay(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const interval = intervalosAutoplay.get(estabelecimentoId);
  if (interval) {
    clearInterval(interval);
    intervalosAutoplay.delete(estabelecimentoId);
  }
}

/**
 * 🎯 GARANTIR AUTOPLAY - Função centralizada e robusta
 *
 * Esta função SEMPRE garante que uma música seja iniciada se:
 * 1. Não há música tocando atualmente
 * 2. Existe música "pago" aguardando na fila
 *
 * Deve ser chamada em TODOS os pontos onde músicas podem entrar na fila:
 * - Após criar pedido em modo gratuito
 * - Após webhook aprovar pagamento
 * - Após socket receber evento de pagamento
 * - No verificador periódico
 *
 * MULTI-TENANT: Requer estabelecimentoId
 * @returns {Promise<Object|null>} Música iniciada ou null
 */
async function garantirAutoplay(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  try {
    console.log('\n🎯 ═══════════════════════════════════════════════════════');
    console.log(`   GARANTIR AUTOPLAY - Estabelecimento ${estabelecimentoId}`);
    console.log('   ═══════════════════════════════════════════════════════');

    const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

    // 1. Verificar estado atual do player em memória
    console.log('1️⃣ Verificando estado do player em memória...');
    console.log(`   - Status: ${estadoMemoria.status}`);
    console.log(`   - Música atual: ${estadoMemoria.musicaAtual?.musicaTitulo || 'Nenhuma'}`);
    console.log(`   - ID: ${estadoMemoria.musicaAtual?.id || 'N/A'}`);

    if (estadoMemoria.musicaAtual && estadoMemoria.status === 'playing') {
      console.log('✅ Já existe música tocando, não precisa iniciar nova');
      console.log('═══════════════════════════════════════════════════════\n');
      return null;
    }

    // 2. Verificar no banco se há música com status "tocando"
    console.log('\n2️⃣ Verificando música "tocando" no banco de dados...');
    const musicaService = require('./musicaService');
    const musicaTocandoBanco = await musicaService.buscarMusicaAtual(estabelecimentoId);

    if (musicaTocandoBanco) {
      console.log(`⚠️  INCONSISTÊNCIA DETECTADA: Música no banco como "tocando" mas player parado`);
      console.log(`   - Música: ${musicaTocandoBanco.musicaTitulo}`);
      console.log(`   - ID: ${musicaTocandoBanco.id}`);
      console.log(`   - Ação: Iniciando esta música no player...`);

      await iniciarMusica(musicaTocandoBanco, estabelecimentoId);
      console.log('✅ Música inconsistente iniciada com sucesso');
      console.log('═══════════════════════════════════════════════════════\n');
      return musicaTocandoBanco;
    }

    // 3. Buscar primeira música paga na fila
    console.log('\n3️⃣ Buscando primeira música "pago" na fila...');
    const proximaMusica = await musicaService.iniciarProximaMusicaSeNecessario(estabelecimentoId);

    if (proximaMusica) {
      console.log(`🎵 Música encontrada e marcada como "tocando":`);
      console.log(`   - Título: ${proximaMusica.musicaTitulo}`);
      console.log(`   - ID: ${proximaMusica.id}`);
      console.log(`   - Cliente: ${proximaMusica.nomeCliente || 'Anônimo'}`);
      console.log(`   - Ação: Iniciando no player...`);

      await iniciarMusica(proximaMusica, estabelecimentoId);
      console.log('✅ AUTOPLAY BEM-SUCEDIDO! Música iniciada com sucesso');
      console.log('═══════════════════════════════════════════════════════\n');
      return proximaMusica;
    }

    // 4. Nenhuma música para tocar
    console.log('\nℹ️  Nenhuma música aguardando na fila');
    console.log('═══════════════════════════════════════════════════════\n');
    return null;

  } catch (error) {
    console.error('\n❌ ═══════════════════════════════════════════════════════');
    console.error('   ERRO AO GARANTIR AUTOPLAY');
    console.error('   ═══════════════════════════════════════════════════════');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════\n');
    return null;
  }
}

/**
 * Atualiza o tempo atual do player (chamado pela TV via WebSocket)
 * MULTI-TENANT: Requer estabelecimentoId
 */
function atualizarTempoAtual(tempo, estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  const estadoMemoria = obterEstadoMemoria(estabelecimentoId);

  if (estadoMemoria.status === 'playing' && typeof tempo === 'number' && tempo >= 0) {
    estadoMemoria.tempoAtual = tempo;
    estadoMemoria.ultimaAtualizacao = Date.now();
  }
}

module.exports = {
  inicializar,
  iniciarMusica,
  pausar,
  retomar,
  parar,
  pularMusica,
  ajustarVolume,
  buscarTempo,
  obterEstado,
  musicaTerminou,
  garantirAutoplay, // ⭐ NOVA FUNÇÃO EXPORTADA
  atualizarTempoAtual, // ⭐ NOVA FUNÇÃO para sync de tempo
};
