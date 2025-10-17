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
let io = null;

/**
 * Inicializa o player service e recupera estado do banco
 */
async function inicializar(socketIo) {
  io = socketIo;

  console.log('🎮 Player Service: Inicializando...');

  // Recuperar estado do banco de dados
  await recuperarEstado();

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

        // Verificar modo do player
        const playerMode = process.env.PLAYER_MODE || 'embed';

        if (playerMode === 'download') {
          // VALIDAÇÃO CRÍTICA (apenas para modo download): Verificar se o arquivo existe
          const downloadService = require('./downloadService');
          const videoExiste = downloadService.videoExiste(musicaAtual.musicaYoutubeId);

          if (!videoExiste) {
            console.warn('⚠️  ERRO: Arquivo de vídeo não encontrado para música em reprodução!');
            console.warn(`   YouTube ID: ${musicaAtual.musicaYoutubeId}`);
            console.warn(`   Caminho esperado: ${downloadService.getVideoPath(musicaAtual.musicaYoutubeId)}`);
            console.warn('   Possível causa: Deploy/reinício deletou arquivos temporários');
            console.warn('   Ação: Marcando música como concluída e buscando próxima...');

            // Marcar como concluída e buscar próxima
            const musicaService = require('./musicaService');
            const proximaMusica = await musicaService.concluirMusica(musicaAtual.id);

            if (proximaMusica) {
              console.log('✅ Próxima música encontrada, iniciando:', proximaMusica.musicaTitulo);
              // Iniciar próxima música (que fará download se necessário)
              await limparEstado();
              const playerService = require('./playerService');
              await playerService.iniciarMusica(proximaMusica);
            } else {
              console.log('ℹ️  Nenhuma música na fila, parando player');
              await limparEstado();
            }

            return;
          }
        } else {
          // Modo embed: não precisa validar arquivo local
          console.log('🎬 Recuperando estado em modo embed (YouTube direto)');
        }

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
          console.log('✅ Arquivo de vídeo verificado e disponível');
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

  // Verificar modo do player (embed ou download)
  const playerMode = process.env.PLAYER_MODE || 'embed';

  if (playerMode === 'embed') {
    // Modo EMBED: Usar YouTube direto (sem download)
    console.log('🎬 Modo: YouTube Embed (sem download)');
    console.log('🆔 YouTube ID:', musica.musicaYoutubeId);
    console.log('✨ Player tocará direto do YouTube com qualidade automática');
  } else {
    // Modo DOWNLOAD: Verificar se o arquivo de vídeo existe antes de iniciar
    console.log('💾 Modo: Download Local (com armazenamento)');
    const downloadService = require('./downloadService');
    const videoExiste = downloadService.videoExiste(musica.musicaYoutubeId);

    if (!videoExiste) {
      console.warn('⚠️  Arquivo de vídeo não encontrado, iniciando download...');
      console.log(`   YouTube ID: ${musica.musicaYoutubeId}`);

      try {
        // Fazer download antes de iniciar reprodução
        await downloadService.baixarVideo(musica.musicaYoutubeId);
        console.log('✅ Download completo, iniciando reprodução...');
      } catch (error) {
        console.error('❌ Falha no download do vídeo:', error.message);
        console.error('   Pulando para próxima música...');

        // Marcar como concluída (falhou) e tentar próxima
        const musicaService = require('./musicaService');
        const proximaMusica = await musicaService.concluirMusica(musica.id);

        if (proximaMusica) {
          return await iniciarMusica(proximaMusica);
        } else {
          console.log('ℹ️  Nenhuma música na fila');
          return await parar();
        }
      }
    } else {
      console.log('✅ Arquivo de vídeo disponível no cache');
    }
  }

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
  const downloadService = require('./downloadService');

  if (estadoMemoria.musicaAtual) {
    const musicaPulada = estadoMemoria.musicaAtual;
    const proximaMusica = await musicaService.pularMusica(estadoMemoria.musicaAtual.id);

    pararSincronizacao();
    pararBackup();

    // Agendar limpeza do arquivo de vídeo após 1 minuto (música pulada também)
    if (musicaPulada.musicaYoutubeId) {
      console.log(`🗑️  Agendando limpeza do vídeo pulado ${musicaPulada.musicaTitulo} em 1 minuto...`);

      setTimeout(async () => {
        try {
          const deleted = await downloadService.deletarVideo(musicaPulada.musicaYoutubeId);
          if (deleted) {
            console.log(`✅ Vídeo pulado limpo: ${musicaPulada.musicaTitulo}`);
          }
        } catch (error) {
          console.error('❌ Erro ao limpar vídeo pulado:', error);
        }
      }, 60000);
    }

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
  const downloadService = require('./downloadService');

  if (estadoMemoria.musicaAtual) {
    const musicaConcluida = estadoMemoria.musicaAtual;
    const proximaMusica = await musicaService.concluirMusica(estadoMemoria.musicaAtual.id);

    pararSincronizacao();
    pararBackup();

    // Agendar limpeza do arquivo de vídeo após 1 minuto
    if (musicaConcluida.musicaYoutubeId) {
      console.log(`🗑️  Agendando limpeza do vídeo ${musicaConcluida.musicaTitulo} em 1 minuto...`);

      setTimeout(async () => {
        try {
          const deleted = await downloadService.deletarVideo(musicaConcluida.musicaYoutubeId);
          if (deleted) {
            const videoPath = downloadService.getVideoPath(musicaConcluida.musicaYoutubeId);
            console.log(`✅ Vídeo limpo após reprodução: ${musicaConcluida.musicaTitulo}`);
            console.log(`   Caminho: ${videoPath}`);
          }
        } catch (error) {
          console.error('❌ Erro ao limpar vídeo após reprodução:', error);
        }
      }, 60000); // 60 segundos = 1 minuto
    }

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
 * Atualiza o tempo atual do player vindo do YouTube player (frontend)
 * Usado para sincronizar o estado do backend com o player real
 */
function atualizarTempoAtual(tempo) {
  // Só atualizar se houver música tocando ou pausada
  if (estadoMemoria.musicaAtual && (estadoMemoria.status === 'playing' || estadoMemoria.status === 'paused')) {
    estadoMemoria.tempoAtual = tempo;
    estadoMemoria.ultimaAtualizacao = Date.now();

    // Não precisa salvar no banco a cada update (muito frequente)
    // O backup periódico já faz isso
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
  atualizarTempoAtual,
};
