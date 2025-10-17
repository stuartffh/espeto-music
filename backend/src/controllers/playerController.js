/**
 * Controller para controle do player da TV
 * Agora usa o playerService centralizado
 * MULTI-TENANT: Todas as funções requerem estabelecimentoId
 */

const playerService = require('../services/playerService');

/**
 * Obter estado atual do player
 * MULTI-TENANT: Requer estabelecimentoId
 */
function obterEstado(req, res) {
  try {
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    const estado = playerService.obterEstado(estabelecimentoId);
    res.json(estado);
  } catch (error) {
    console.error('Erro ao obter estado:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Play - Tocar/Resumir música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function play(req, res) {
  try {
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    const estado = await playerService.retomar(estabelecimentoId);
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao tocar:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Pause - Pausar música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function pause(req, res) {
  try {
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    const estado = await playerService.pausar(estabelecimentoId);
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao pausar:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Stop - Parar música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function stop(req, res) {
  try {
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    const estado = await playerService.parar(estabelecimentoId);
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao parar:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Skip - Pular para próxima música
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function skip(req, res) {
  try {
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    const estado = await playerService.pularMusica(estabelecimentoId);
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Erro ao pular música:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Ajustar volume
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function volume(req, res) {
  try {
    const { nivel } = req.body;
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    if (nivel === undefined || nivel < 0 || nivel > 100) {
      return res.status(400).json({ error: 'Volume deve estar entre 0 e 100' });
    }

    const estado = await playerService.ajustarVolume(nivel, estabelecimentoId);
    res.json({ success: true, volume: nivel, estado });
  } catch (error) {
    console.error('Erro ao ajustar volume:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reset - Limpar músicas travadas com status "tocando"
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function reset(req, res) {
  try {
    const prisma = require('../config/database');
    const estabelecimentoId = req.estabelecimentoId;

    if (!estabelecimentoId) {
      return res.status(400).json({ error: 'Estabelecimento não identificado' });
    }

    console.log(`🔧 [RESET] Limpando estado do player para estabelecimento ${estabelecimentoId}...`);

    // Limpar todas as músicas com status "tocando" DESTE estabelecimento
    const musicasTocando = await prisma.pedidoMusica.findMany({
      where: {
        estabelecimentoId, // ← Multi-tenant
        status: 'tocando'
      }
    });

    console.log(`📋 [RESET] Encontradas ${musicasTocando.length} música(s) com status "tocando"`);

    for (const musica of musicasTocando) {
      console.log(`  - [RESET] ${musica.musicaTitulo} (ID: ${musica.id})`);
      await prisma.pedidoMusica.update({
        where: { id: musica.id },
        data: { status: 'concluida' }
      });
    }

    // Resetar estado do player service DESTE estabelecimento
    await playerService.parar(estabelecimentoId);

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
