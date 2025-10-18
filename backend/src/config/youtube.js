const yts = require('yt-search');

/**
 * Busca vídeos no YouTube (GRATUITO - sem API key)
 * @param {string} query - Termo de busca
 * @param {number} maxResults - Número máximo de resultados (padrão: 10)
 * @param {number} maxDuration - Duração máxima em segundos (padrão: 600 = 10 minutos)
 * @returns {Promise<Array>} Lista de vídeos encontrados
 */
async function buscarVideos(query, maxResults = 10, maxDuration = 600) {
  try {
    const result = await yts(query);

    // Filtrar vídeos por duração máxima e pegar mais resultados para compensar os filtrados
    const videosFiltrados = result.videos
      .filter(video => video.seconds && video.seconds <= maxDuration)
      .slice(0, maxResults);

    return videosFiltrados.map((video) => ({
      id: video.videoId,
      titulo: video.title,
      canal: video.author.name,
      thumbnail: video.thumbnail,
      descricao: video.description,
      duracao: video.seconds,
    }));
  } catch (error) {
    console.error('Erro ao buscar vídeos no YouTube:', error.message);
    throw new Error('Falha ao buscar vídeos no YouTube');
  }
}

/**
 * Busca detalhes de um vídeo específico (GRATUITO)
 * @param {string} videoId - ID do vídeo
 * @returns {Promise<Object>} Detalhes do vídeo
 */
async function buscarDetalhesVideo(videoId) {
  try {
    const result = await yts({ videoId });

    if (!result) {
      throw new Error('Vídeo não encontrado');
    }

    return {
      id: result.videoId,
      titulo: result.title,
      canal: result.author.name,
      thumbnail: result.thumbnail,
      descricao: result.description,
      duracao: result.seconds,
      visualizacoes: result.views,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do vídeo:', error.message);
    throw new Error('Falha ao buscar detalhes do vídeo');
  }
}

module.exports = {
  buscarVideos,
  buscarDetalhesVideo,
};
