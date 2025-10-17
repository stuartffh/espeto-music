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

// Estado em memória (rápido para leitura)
let estadoMemoria = {
  musicaAtual: null,
  status: 'stopped', // 'playing', 'paused', 'stopped'
  tempoAtual: 0,
  volume: 80,
  ultimaAtualizacao: Date.now(),
};

let intervalSync = null;
let intervalBackup = null;
let intervalAutoplay = null;
let io = null;

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
    let estadoSalvo = await prisma.estadoPlayer.findUnique({
      where: { id: 'singleton' }
    });

    // Se não existe, criar registro inicial
    if (!estadoSalvo) {
      console.log('📝 Criando registro inicial de estado...');
      estadoSalvo = await prisma.estadoPlayer.create({
        data: {
          id: 'singleton',
          status: 'stopped',
          tempoAtual: 0,
          volume: 80,
        }
      });
    }

    // Se tinha música tocando, recuperar
    if (estadoSalvo.musicaAtualId) {
      const musicaAtual = await prisma.pedidoMusica.findUnique({
        where: { id: estadoSalvo.musicaAtualId }
      });

      if (musicaAtual && musicaAtual.status === 'tocando') {
        console.log('🎵 Recuperando música:', musicaAtual.musicaTitulo);
        console.log('⏱️  Tempo salvo:', Math.floor(estadoSalvo.tempoAtual), 'segundos');

        estadoMemoria = {
          musicaAtual,
          status: estadoSalvo.status,
          tempoAtual: estadoSalvo.tempoAtual,
          volume: estadoSalvo.volume,
          ultimaAtualizacao: Date.now(),
        };

        // Se estava tocando, retomar
        if (estadoSalvo.status === 'playing') {
          console.log('▶️ Retomando reprodução automaticamente...');
          iniciarSincronizacao();
          iniciarBackup();

          // Emitir evento para TVs retomarem
          if (io) {
            io.emit('player:iniciar', {
              musica: musicaAtual,
              estado: estadoMemoria,
            });
          }
        }
      } else {
        console.log('⚠️  Música salva não encontrada ou inconsistente, limpando estado...');
        await limparEstado();
      }
    } else {
      console.log('ℹ️  Nenhuma música em reprodução');
      estadoMemoria.volume = estadoSalvo.volume;
    }

  } catch (error) {
    console.error('❌ Erro ao recuperar estado:', error);
  }
}

/**
 * Salva o estado atual no banco de dados
 */
async function salvarEstado() {
  try {
    await prisma.estadoPlayer.upsert({
      where: { id: 'singleton' },
      update: {
        musicaAtualId: estadoMemoria.musicaAtual?.id || null,
        status: estadoMemoria.status,
        tempoAtual: estadoMemoria.tempoAtual,
        volume: estadoMemoria.volume,
        ultimaAtualizacao: new Date(),
      },
      create: {
        id: 'singleton',
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
 */
async function limparEstado() {
  await prisma.estadoPlayer.update({
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
 */
async function iniciarMusica(musica) {
  console.log('▶️ Player: Iniciando música', musica.musicaTitulo);

  estadoMemoria = {
    musicaAtual: musica,
    status: 'playing',
    tempoAtual: 0,
    volume: estadoMemoria.volume,
    ultimaAtualizacao: Date.now(),
  };

  // Salvar no banco imediatamente
  await salvarEstado();

  // Iniciar sincronização e backup
  iniciarSincronizacao();
  iniciarBackup();

  // Emitir evento WebSocket
  if (io) {
    io.emit('player:iniciar', {
      musica,
      estado: estadoMemoria,
    });
  }

  return estadoMemoria;
}

/**
 * Pausa a música
 */
async function pausar() {
  if (estadoMemoria.status === 'playing') {
    console.log('⏸️ Player: Pausando');
    estadoMemoria.status = 'paused';
    estadoMemoria.ultimaAtualizacao = Date.now();

    await salvarEstado();
    pararSincronizacao();
    // Manter backup para salvar estado pausado

    if (io) {
      io.emit('player:pausar', { estado: estadoMemoria });
    }
  }
  return estadoMemoria;
}

/**
 * Retoma a música pausada
 */
async function retomar() {
  if (estadoMemoria.status === 'paused') {
    console.log('▶️ Player: Retomando');
    estadoMemoria.status = 'playing';
    estadoMemoria.ultimaAtualizacao = Date.now();

    await salvarEstado();
    iniciarSincronizacao();

    if (io) {
      io.emit('player:retomar', { estado: estadoMemoria });
    }
  }
  return estadoMemoria;
}

/**
 * Para completamente
 */
async function parar() {
  console.log('⏹️ Player: Parando');

  pararSincronizacao();
  pararBackup();

  estadoMemoria = {
    musicaAtual: null,
    status: 'stopped',
    tempoAtual: 0,
    volume: estadoMemoria.volume,
    ultimaAtualizacao: Date.now(),
  };

  await salvarEstado();

  if (io) {
    io.emit('player:parar', { estado: estadoMemoria });
  }

  return estadoMemoria;
}

/**
 * Pula para a próxima música
 */
async function pularMusica() {
  console.log('⏭️ Player: Pulando música');

  const musicaService = require('./musicaService');

  if (estadoMemoria.musicaAtual) {
    const proximaMusica = await musicaService.pularMusica(estadoMemoria.musicaAtual.id);

    pararSincronizacao();
    pararBackup();

    if (proximaMusica) {
      return await iniciarMusica(proximaMusica);
    } else {
      return await parar();
    }
  }

  return estadoMemoria;
}

/**
 * Chamado quando a música termina naturalmente
 */
async function musicaTerminou() {
  console.log('🎵 Player: Música terminou');

  const musicaService = require('./musicaService');

  if (estadoMemoria.musicaAtual) {
    const proximaMusica = await musicaService.concluirMusica(estadoMemoria.musicaAtual.id);

    pararSincronizacao();
    pararBackup();

    if (proximaMusica) {
      return await iniciarMusica(proximaMusica);
    } else {
      return await parar();
    }
  }

  return estadoMemoria;
}

/**
 * Ajusta o volume
 */
async function ajustarVolume(nivel) {
  console.log('🔊 Player: Volume ajustado para', nivel);
  estadoMemoria.volume = nivel;

  await salvarEstado();

  if (io) {
    io.emit('player:volume', { volume: nivel });
  }

  return estadoMemoria;
}

/**
 * Busca para um tempo específico
 */
async function buscarTempo(tempo) {
  console.log('⏩ Player: Buscando para', tempo, 'segundos');
  estadoMemoria.tempoAtual = tempo;
  estadoMemoria.ultimaAtualizacao = Date.now();

  await salvarEstado();

  if (io) {
    io.emit('player:buscar', { tempo });
  }

  return estadoMemoria;
}

/**
 * Retorna o estado atual
 */
function obterEstado() {
  return { ...estadoMemoria };
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
 * @returns {Promise<Object|null>} Música iniciada ou null
 */
async function garantirAutoplay() {
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
    const musicaService = require('./musicaService');
    const musicaTocandoBanco = await musicaService.buscarMusicaAtual();

    if (musicaTocandoBanco) {
      console.log(`⚠️  INCONSISTÊNCIA DETECTADA: Música no banco como "tocando" mas player parado`);
      console.log(`   - Música: ${musicaTocandoBanco.musicaTitulo}`);
      console.log(`   - ID: ${musicaTocandoBanco.id}`);
      console.log(`   - Ação: Iniciando esta música no player...`);

      await iniciarMusica(musicaTocandoBanco);
      console.log('✅ Música inconsistente iniciada com sucesso');
      console.log('═══════════════════════════════════════════════════════\n');
      return musicaTocandoBanco;
    }

    // 3. Buscar primeira música paga na fila
    console.log('\n3️⃣ Buscando primeira música "pago" na fila...');
    const proximaMusica = await musicaService.iniciarProximaMusicaSeNecessario();

    if (proximaMusica) {
      console.log(`🎵 Música encontrada e marcada como "tocando":`);
      console.log(`   - Título: ${proximaMusica.musicaTitulo}`);
      console.log(`   - ID: ${proximaMusica.id}`);
      console.log(`   - Cliente: ${proximaMusica.nomeCliente || 'Anônimo'}`);
      console.log(`   - Ação: Iniciando no player...`);

      await iniciarMusica(proximaMusica);
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
 */
function atualizarTempoAtual(tempo) {
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
