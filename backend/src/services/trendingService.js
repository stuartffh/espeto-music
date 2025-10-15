const yts = require('yt-search');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Termos de busca por categoria para encontrar trending
const TRENDING_QUERIES = {
  sertanejo: ['top sertanejo 2024', 'sertanejo mais tocadas', 'sertanejo universitário hits'],
  pagode: ['top pagode 2024', 'pagode mais tocadas', 'pagode romântico hits'],
  funk: ['top funk 2024', 'funk brasil hits', 'funk mais tocados'],
  mpb: ['mpb clássicos', 'mpb mais tocadas', 'mpb brasileira'],
  rock: ['rock nacional hits', 'rock brasil clássicos', 'rock brasileiro'],
  forro: ['forró mais tocados', 'forró pé de serra', 'forró hits'],
  samba: ['samba mais tocados', 'samba clássico', 'samba brasileiro'],
  gospel: ['gospel mais tocadas 2024', 'louvor mais tocados', 'gospel brasil'],
};

/**
 * Busca músicas trending para uma categoria
 * @param {string} categoria
 * @param {number} limite
 * @returns {Promise<Array>}
 */
async function buscarTrendingCategoria(categoria, limite = 8) {
  try {
    const queries = TRENDING_QUERIES[categoria] || [categoria];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const result = await yts(query);
    const videos = result.videos.slice(0, limite);

    return videos.map((video) => ({
      categoria,
      titulo: video.title,
      youtubeId: video.videoId,
      thumbnail: video.thumbnail,
      tipo: 'trending',
      ativo: true,
    }));
  } catch (error) {
    console.error(`Erro ao buscar trending para ${categoria}:`, error.message);
    return [];
  }
}

/**
 * Atualiza sugestões trending para todas as categorias
 * @returns {Promise<Object>}
 */
async function atualizarTodasSugestoes() {
  console.log('🔄 Atualizando sugestões trending...');
  const categorias = Object.keys(TRENDING_QUERIES);
  let totalAdicionadas = 0;
  let totalErros = 0;

  for (const categoria of categorias) {
    try {
      // Desativar sugestões antigas de trending desta categoria
      await prisma.sugestao.updateMany({
        where: {
          categoria,
          tipo: 'trending',
        },
        data: {
          ativo: false,
        },
      });

      // Buscar novas trending
      const sugestoes = await buscarTrendingCategoria(categoria, 8);

      // Salvar novas sugestões
      for (const [index, sugestao] of sugestoes.entries()) {
        await prisma.sugestao.create({
          data: {
            ...sugestao,
            ordem: index,
          },
        });
        totalAdicionadas++;
      }

      console.log(`✅ ${categoria}: ${sugestoes.length} sugestões atualizadas`);

      // Delay entre categorias para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Erro ao atualizar ${categoria}:`, error.message);
      totalErros++;
    }
  }

  console.log(`\n🎉 Atualização concluída: ${totalAdicionadas} sugestões adicionadas, ${totalErros} erros`);

  return {
    sucesso: totalErros === 0,
    totalAdicionadas,
    totalErros,
    categorias: categorias.length,
  };
}

/**
 * Busca sugestões ativas por categoria
 * @param {string} categoria
 * @param {number} limite
 * @returns {Promise<Array>}
 */
async function buscarSugestoesPorCategoria(categoria, limite = 8) {
  try {
    const sugestoes = await prisma.sugestao.findMany({
      where: {
        categoria,
        ativo: true,
      },
      orderBy: [
        { tipo: 'asc' }, // trending primeiro
        { ordem: 'asc' },
      ],
      take: limite,
    });

    return sugestoes.map(s => s.titulo);
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }
}

/**
 * Registra uma busca no histórico
 * @param {string} termo
 * @param {string} categoria
 * @param {number} resultados
 */
async function registrarBusca(termo, categoria = null, resultados = 0) {
  try {
    // Buscar se já existe
    const existente = await prisma.historicoBusca.findFirst({
      where: { termo: termo.toLowerCase() },
    });

    if (existente) {
      // Incrementar contador
      await prisma.historicoBusca.update({
        where: { id: existente.id },
        data: {
          vezesBuscado: existente.vezesBuscado + 1,
          atualizadoEm: new Date(),
          categoria: categoria || existente.categoria,
        },
      });
    } else {
      // Criar novo
      await prisma.historicoBusca.create({
        data: {
          termo: termo.toLowerCase(),
          categoria,
          resultados,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao registrar busca:', error.message);
  }
}

/**
 * Busca termos mais populares
 * @param {number} limite
 * @returns {Promise<Array>}
 */
async function buscarTermosPopulares(limite = 10) {
  try {
    const termos = await prisma.historicoBusca.findMany({
      orderBy: {
        vezesBuscado: 'desc',
      },
      take: limite,
    });

    return termos;
  } catch (error) {
    console.error('Erro ao buscar termos populares:', error);
    return [];
  }
}

module.exports = {
  buscarTrendingCategoria,
  atualizarTodasSugestoes,
  buscarSugestoesPorCategoria,
  registrarBusca,
  buscarTermosPopulares,
};
