/**
 * Controller para controle do player da TV
 * Agora usa o playerService centralizado
 */

const playerService = require('../services/playerService');

/**
 * Obter estado atual do player
 */
function obterEstado(req, res) {
  const estado = playerService.obterEstado();
  res.json(estado);
}

/**
 * Play - Tocar/Resumir música
 */
async function play(req, res) {
  try {
    const estado = playerService.retomar();
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao tocar:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Pause - Pausar música
 */
async function pause(req, res) {
  try {
    const estado = playerService.pausar();
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao pausar:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Stop - Parar música
 */
async function stop(req, res) {
  try {
    const estado = playerService.parar();
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao parar:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Skip - Pular para próxima música
 */
async function skip(req, res) {
  try {
    const estado = await playerService.pularMusica();
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao pular música:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Ajustar volume
 */
async function volume(req, res) {
  try {
    const { nivel } = req.body;

    if (nivel === undefined || nivel < 0 || nivel > 100) {
      return res.status(400).json({ error: 'Volume deve estar entre 0 e 100' });
    }

    const estado = playerService.ajustarVolume(nivel);
    res.json({ success: true, volume: nivel, estado });
  } catch (error) {
    console.error('Erro ao ajustar volume:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reset - Limpar músicas travadas com status "tocando"
 */
async function reset(req, res) {
  try {
    const prisma = require('../config/database');

    console.log('🔧 [RESET] Limpando estado do player...');

    // Limpar todas as músicas com status "tocando"
    const musicasTocando = await prisma.pedidoMusica.findMany({
      where: { status: 'tocando' }
    });

    console.log(`📋 [RESET] Encontradas ${musicasTocando.length} música(s) com status "tocando"`);

    for (const musica of musicasTocando) {
      console.log(`  - [RESET] ${musica.musicaTitulo} (ID: ${musica.id})`);
      await prisma.pedidoMusica.update({
        where: { id: musica.id },
        data: { status: 'concluido' }
      });
    }

    // Resetar estado do player service
    playerService.parar();

    console.log('✅ [RESET] Estado limpo!');

    res.json({
      success: true,
      message: `${musicasTocando.length} música(s) limpas`,
      musicasLimpas: musicasTocando.length
    });
  } catch (error) {
    console.error('❌ [RESET] Erro ao resetar:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  obterEstado,
  play,
  pause,
  stop,
  skip,
  volume,
  reset,
};
