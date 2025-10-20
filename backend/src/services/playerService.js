/**
 * Player Service - Controle centralizado do player com backup em banco de dados
 *
 * Features:
 * - Estado global sincronizado com banco de dados
 * - Recuperação automática após crash
 * - Auto-correção de inconsistências
 * - Backup contínuo do tempo de reprodução
 */

const prisma = require('../config/database');
const historicoService = require('./historicoService');

// Estado em memória separado por locação (rápido para leitura)
// Chave: locacaoId ou 'global' para sistema global
let estadosMemoria = {
  global: {
    musicaAtual: null,
    status: 'stopped', // 'playing', 'paused', 'stopped'
    tempoAtual: 0,
    volume: 80,
    ultimaAtualizacao: Date.now(),
  }
};

// Helper para obter estado de uma locação específica
function getEstadoMemoria(locacaoId = null) {
  const key = locacaoId || 'global';
  if (!estadosMemoria[key]) {
    estadosMemoria[key] = {
      musicaAtual: null,
      status: 'stopped',
      tempoAtual: 0,
      volume: 80,
      ultimaAtualizacao: Date.now(),
    };
  }
  return estadosMemoria[key];
}

let intervalSync = null;
let intervalBackup = null;
let intervalAutoplay = null;
let io = null;
let historicoAtualId = null; // ID do registro de histórico da música atual

/**
 * Inicializa o player service e recupera estado do banco
 */
async function inicializar(socketIo) {
  io = socketIo;

  console.log('🎮 Player Service: Inicializando...');

  // Recuperar estado do banco de dados
  await recuperarEstado();

  // Iniciar verificador de autoplay
  iniciarVerificadorAutoplay();

  console.log('✅ Player Service inicializado');
}

/**
 * Recupera o estado salvo no banco após crash/reinício
 */
async function recuperarEstado() {
  try {
    console.log('🔄 Recuperando estado do player do banco de dados...');

    // Buscar estado salvo
    let estadoSalvo = await prisma.estado_player.findUnique({
      where: { id: 'singleton' }
    });

    // Se não existe, criar registro inicial
    if (!estadoSalvo) {
      console.log('📝 Criando registro inicial de estado...');
      estadoSalvo = await prisma.estado_player.create({
        data: {
          id: 'singleton',
          status: 'stopped',
          tempoAtual: 0,
          volume: 80
        }
      });
    }

    // Se tinha música tocando, recuperar
    if (estadoSalvo.musicaAtualId) {
      const musicaAtual = await prisma.pedidos_musica.findUnique({
        where: { id: estadoSalvo.musicaAtualId }
      });

      if (musicaAtual && musicaAtual.status === 'tocando') {
        console.log('🎵 Recuperando música:', musicaAtual.musicaTitulo);
        console.log('⏱️  Tempo salvo:', Math.floor(estadoSalvo.tempoAtual), 'segundos');

        const estadoGlobal = getEstadoMemoria('global');
        estadoGlobal.musicaAtual = musicaAtual;
        estadoGlobal.status = estadoSalvo.status;
        estadoGlobal.tempoAtual = estadoSalvo.tempoAtual;
        estadoGlobal.volume = estadoSalvo.volume;
        estadoGlobal.ultimaAtualizacao = Date.now();

        // Se estava tocando, retomar
        if (estadoSalvo.status === 'playing') {
          console.log('▶️ Retomando reprodução automaticamente...');
          iniciarSincronizacao();
          iniciarBackup();

          // Emitir evento para TVs retomarem
          if (io) {
            io.emit('player:iniciar', {
              musica: musicaAtual,
              estado: estadoGlobal,
            });
          }
        }
      } else {
        console.log('⚠️  Música salva não encontrada ou inconsistente, limpando estado...');
        await limparEstado();
      }
    } else {
      console.log('ℹ️  Nenhuma música em reprodução');
      const estadoGlobal = getEstadoMemoria('global');
      estadoGlobal.volume = estadoSalvo.volume;
    }

  } catch (error) {
    console.error('❌ Erro ao recuperar estado:', error);
  }
}

/**
 * Salva o estado atual no banco de dados
 */
async function salvarEstado(locacaoId = null) {
  try {
    // Por enquanto, salvar apenas o estado global no banco
    // TODO: Implementar salvamento separado por locação se necessário
    if (locacaoId && locacaoId !== 'global') {
      console.log(`ℹ️ [SALVAR] Estado de locação ${locacaoId} não salvo no banco (apenas em memória)`);
      return;
    }

    const estadoGlobal = getEstadoMemoria('global');
    await prisma.estado_player.upsert({
      where: { id: 'singleton' },
      update: {
        musicaAtualId: estadoGlobal.musicaAtual?.id || null,
        status: estadoGlobal.status,
        tempoAtual: estadoGlobal.tempoAtual,
        volume: estadoGlobal.volume,
        ultimaAtualizacao: new Date(),
      },
      create: {
        id: 'singleton',
        musicaAtualId: estadoGlobal.musicaAtual?.id || null,
        status: estadoGlobal.status,
        tempoAtual: estadoGlobal.tempoAtual,
        volume: estadoGlobal.volume,
        atualizadoEm: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao salvar estado:', error);
  }
}

/**
 * Limpa o estado do banco
 */
async function limparEstado() {
  await prisma.estado_player.update({
    where: { id: 'singleton' },
    data: {
      musicaAtualId: null,
      status: 'stopped',
      tempoAtual: 0,
    }
  });
  estadoMemoria.musicaAtual = null;
  estadoMemoria.status = 'stopped';
  estadoMemoria.tempoAtual = 0;
}

/**
 * Inicia backup periódico do estado (a cada 3 segundos)
 */
function iniciarBackup() {
  pararBackup();
  intervalBackup = setInterval(async () => {
    await salvarEstado();
  }, 3000); // Backup a cada 3 segundos
}

/**
 * Para backup periódico
 */
function pararBackup() {
  if (intervalBackup) {
    clearInterval(intervalBackup);
    intervalBackup = null;
  }
}

/**
 * Inicia uma nova música
 * @param {Object} musica - Dados da música
 * @param {string|null} locacaoId - ID da locação (null = global)
 */
async function iniciarMusica(musica, locacaoId = null) {
  console.log('▶️ Player: Iniciando música', musica.musicaTitulo);
  console.log(`   - Locação: ${locacaoId || 'global'}`);

  const estado = getEstadoMemoria(locacaoId);
  estado.musicaAtual = musica;
  estado.status = 'playing';
  estado.tempoAtual = 0;
  estado.ultimaAtualizacao = Date.now();

  // Salvar no banco imediatamente
  await salvarEstado(locacaoId);

  // Registrar no histórico
  try {
    const historico = await historicoService.registrarInicioMusica({
      pedidoId: musica.id,
      titulo: musica.musicaTitulo,
      youtubeId: musica.musicaYoutubeId,
      thumbnail: musica.musicaThumbnail,
      duracao: musica.musicaDuracao,
      nomeCliente: musica.nomeCliente,
      valor: musica.valor || 0,
      tipo: 'cliente'
    });
    historicoAtualId = historico.id;
  } catch (error) {
    console.error('❌ Erro ao registrar música no histórico:', error);
  }

  // Iniciar sincronização e backup
  iniciarSincronizacao();
  iniciarBackup();

  // Emitir evento WebSocket
  console.log('🔌 [PLAYER] Verificando io para emitir player:iniciar...');
  console.log('🔌 [PLAYER] io disponível?', !!io);
  if (io) {
    console.log('📡 [PLAYER] Emitindo player:iniciar para:', musica.musicaTitulo);
    io.emit('player:iniciar', {
      musica,
      estado: estado,
    });
    console.log('✅ [PLAYER] Evento player:iniciar emitido com sucesso');
  } else {
    console.error('❌ [PLAYER] IO não disponível! Evento player:iniciar NÃO foi emitido!');
  }

  return estado;
}

/**
 * Pausa a música
 */
async function pausar(locacaoId = null) {
  const estado = getEstadoMemoria(locacaoId);
  
  if (estado.status === 'playing') {
    console.log('⏸️ Player: Pausando');
    console.log(`   - Locação: ${locacaoId || 'global'}`);
    estado.status = 'paused';
    estado.ultimaAtualizacao = Date.now();

    await salvarEstado(locacaoId);
    pararSincronizacao();
    // Manter backup para salvar estado pausado

    if (io) {
      io.emit('player:pausar', { estado: estado });
    }
  }
  return estado;
}

/**
 * Retoma a música pausada
 */
async function retomar(locacaoId = null) {
  const estado = getEstadoMemoria(locacaoId);
  
  if (estado.status === 'paused') {
    console.log('▶️ Player: Retomando');
    console.log(`   - Locação: ${locacaoId || 'global'}`);
    estado.status = 'playing';
    estado.ultimaAtualizacao = Date.now();

    await salvarEstado(locacaoId);
    iniciarSincronizacao();

    if (io) {
      io.emit('player:retomar', { estado: estado });
    }
  }
  return estado;
}

/**
 * Para completamente
 */
async function parar(locacaoId = null) {
  console.log('⏹️ Player: Parando');
  console.log(`   - Locação: ${locacaoId || 'global'}`);

  const estado = getEstadoMemoria(locacaoId);

  // Registrar fim da música no histórico
  if (historicoAtualId) {
    try {
      await historicoService.registrarFimMusica(historicoAtualId, Math.floor(estado.tempoAtual));
      historicoAtualId = null;
    } catch (error) {
      console.error('❌ Erro ao registrar fim da música no histórico:', error);
    }
  }

  pararSincronizacao();
  pararBackup();

  estado.musicaAtual = null;
  estado.status = 'stopped';
  estado.tempoAtual = 0;
  estado.ultimaAtualizacao = Date.now();

  await salvarEstado(locacaoId);

  if (io) {
    io.emit('player:parar', { estado: estado });
  }

  return estado;
}

/**
 * Pula para a próxima música
 */
async function pularMusica(locacaoId = null) {
  console.log('⏭️ Player: Pulando música');
  console.log(`   - Locação: ${locacaoId || 'global'}`);

  const musicaService = require('./musicaService');
  const estado = getEstadoMemoria(locacaoId);

  if (estado.musicaAtual) {
    const proximaMusica = await musicaService.pularMusica(estado.musicaAtual.id);

    pararSincronizacao();
    pararBackup();

    if (proximaMusica) {
      return await iniciarMusica(proximaMusica, locacaoId);
    } else {
      return await parar(locacaoId);
    }
  }

  return estado;
}

/**
 * Chamado quando a música termina naturalmente
 * @param {string|null} locacaoId - ID da locação (null = global)
 */
async function musicaTerminou(locacaoId = null) {
  console.log('🎵 Player: Música terminou');
  console.log(`   - Locação: ${locacaoId || 'global'}`);

  const musicaService = require('./musicaService');
  const estado = getEstadoMemoria(locacaoId);

  if (estado.musicaAtual) {
    const proximaMusica = await musicaService.concluirMusica(estado.musicaAtual.id, locacaoId);

    pararSincronizacao();
    pararBackup();

    if (proximaMusica) {
      return await iniciarMusica(proximaMusica, locacaoId);
    } else {
      return await parar(locacaoId);
    }
  }

  return estado;
}

/**
 * Ajusta o volume
 */
async function ajustarVolume(nivel, locacaoId = null) {
  console.log('🔊 Player: Volume ajustado para', nivel);
  console.log(`   - Locação: ${locacaoId || 'global'}`);
  
  const estado = getEstadoMemoria(locacaoId);
  estado.volume = nivel;

  await salvarEstado(locacaoId);

  if (io) {
    io.emit('player:volume', { volume: nivel });
  }

  return estado;
}

/**
 * Busca para um tempo específico
 */
async function buscarTempo(tempo, locacaoId = null) {
  console.log('⏩ Player: Buscando para', tempo, 'segundos');
  console.log(`   - Locação: ${locacaoId || 'global'}`);
  
  const estado = getEstadoMemoria(locacaoId);
  estado.tempoAtual = tempo;
  estado.ultimaAtualizacao = Date.now();

  await salvarEstado(locacaoId);

  if (io) {
    io.emit('player:buscar', { tempo });
  }

  return estado;
}

/**
 * Retorna o estado atual
 */
function obterEstado(locacaoId = null) {
  const estado = getEstadoMemoria(locacaoId);
  return { ...estado };
}

/**
 * Sincronização de tempo (a cada segundo)
 */
function iniciarSincronizacao() {
  pararSincronizacao();

  intervalSync = setInterval(() => {
    if (estadoMemoria.status === 'playing') {
      const agora = Date.now();
      const deltaSegundos = (agora - estadoMemoria.ultimaAtualizacao) / 1000;
      estadoMemoria.tempoAtual += deltaSegundos;
      estadoMemoria.ultimaAtualizacao = agora;

      // Emitir sync a cada 5 segundos
      if (Math.floor(estadoMemoria.tempoAtual) % 5 === 0) {
        if (io) {
          io.emit('player:sync', {
            tempo: estadoMemoria.tempoAtual,
            status: estadoMemoria.status,
          });
        }
      }
    }
  }, 1000);
}

/**
 * Para sincronização
 */
function pararSincronizacao() {
  if (intervalSync) {
    clearInterval(intervalSync);
    intervalSync = null;
  }
}

/**
 * Inicia verificador periódico de autoplay
 * Verifica a cada 10 segundos se há músicas na fila e player parado
 */
function iniciarVerificadorAutoplay() {
  pararVerificadorAutoplay();

  console.log('🔄 Iniciando verificador de autoplay (a cada 10 segundos)');

  intervalAutoplay = setInterval(async () => {
    try {
      // 🎯 Usar função centralizada de autoplay
      await garantirAutoplay();
    } catch (error) {
      console.error('❌ Erro no verificador de autoplay:', error);
    }
  }, 10000); // A cada 10 segundos
}

/**
 * Para verificador de autoplay
 */
function pararVerificadorAutoplay() {
  if (intervalAutoplay) {
    clearInterval(intervalAutoplay);
    intervalAutoplay = null;
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
 * @param {string|null} locacaoId - ID da locação (null = global)
 * @returns {Promise<Object|null>} Música iniciada ou null
 */
async function garantirAutoplay(locacaoId = null) {
  try {
    console.log('\n🎯 ═══════════════════════════════════════════════════════');
    console.log('   GARANTIR AUTOPLAY - Verificação Iniciada');
    console.log('   ═══════════════════════════════════════════════════════');

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
    console.log(`   - Locação: ${locacaoId || 'global'}`);
    const musicaService = require('./musicaService');
    const musicaTocandoBanco = await musicaService.buscarMusicaAtual(locacaoId);

    if (musicaTocandoBanco) {
      console.log(`⚠️  INCONSISTÊNCIA DETECTADA: Música no banco como "tocando" mas player parado`);
      console.log(`   - Música: ${musicaTocandoBanco.musicaTitulo}`);
      console.log(`   - ID: ${musicaTocandoBanco.id}`);
      console.log(`   - Ação: Iniciando esta música no player...`);

      await iniciarMusica(musicaTocandoBanco, locacaoId);
      console.log('✅ Música inconsistente iniciada com sucesso');
      console.log('═══════════════════════════════════════════════════════\n');
      return musicaTocandoBanco;
    }

    // 3. Buscar primeira música paga na fila
    console.log('\n3️⃣ Buscando primeira música "pago" na fila...');
    console.log(`   - Locação: ${locacaoId || 'global'}`);
    const proximaMusica = await musicaService.iniciarProximaMusicaSeNecessario(locacaoId);

    if (proximaMusica) {
      console.log(`🎵 Música encontrada e marcada como "tocando":`);
      console.log(`   - Título: ${proximaMusica.musicaTitulo}`);
      console.log(`   - ID: ${proximaMusica.id}`);
      console.log(`   - Cliente: ${proximaMusica.nomeCliente || 'Anônimo'}`);
      console.log(`   - Ação: Iniciando no player...`);

      console.log('🎵 [AUTOPLAY] Chamando iniciarMusica...');
      await iniciarMusica(proximaMusica, locacaoId);
      console.log('✅ [AUTOPLAY] AUTOPLAY BEM-SUCEDIDO! Música iniciada com sucesso');
      console.log('✅ [AUTOPLAY] Verificar se evento player:iniciar foi emitido acima ⬆️');
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
 * Atualiza o tempo atual do player (recebido do frontend via WebSocket)
 */
function atualizarTempoAtual(tempo) {
  if (estadoMemoria.musicaAtual && (estadoMemoria.status === 'playing' || estadoMemoria.status === 'paused')) {
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
  atualizarTempoAtual, // ⭐ FUNÇÃO DE SYNC DE TEMPO
};
