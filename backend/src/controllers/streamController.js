const downloadService = require('../services/downloadService');
const fs = require('fs');
const path = require('path');

/**
 * Stream de vídeo com suporte a Range Requests (para seek)
 */
async function streamVideo(req, res) {
  try {
    const { youtubeId } = req.params;

    if (!youtubeId) {
      return res.status(400).json({ error: 'YouTube ID é obrigatório' });
    }

    const videoPath = downloadService.getVideoPath(youtubeId);

    // Verificar se o vídeo existe
    if (!downloadService.videoExiste(youtubeId)) {
      // Se não existe, verificar se está baixando
      const downloadProgress = downloadService.getDownloadProgress(youtubeId);

      if (downloadProgress) {
        return res.status(202).json({
          message: 'Vídeo sendo baixado',
          progress: downloadProgress.progress,
          downloadedBytes: downloadProgress.downloadedBytes,
          totalBytes: downloadProgress.totalBytes,
        });
      }

      return res.status(404).json({ error: 'Vídeo não encontrado e não está sendo baixado' });
    }

    // Obter informações do arquivo
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Se houver Range request (para seek do player)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Sem range, enviar arquivo completo
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Accept-Ranges, Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('❌ Erro ao fazer streaming do vídeo:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retorna progresso de download de um vídeo
 */
function getDownloadProgress(req, res) {
  try {
    const { youtubeId } = req.params;

    const progress = downloadService.getDownloadProgress(youtubeId);

    if (!progress) {
      if (downloadService.videoExiste(youtubeId)) {
        return res.json({ status: 'completed', progress: 100 });
      }
      return res.json({ status: 'not_started', progress: 0 });
    }

    res.json({
      status: 'downloading',
      progress: progress.progress,
      downloadedBytes: progress.downloadedBytes,
      totalBytes: progress.totalBytes,
      startTime: progress.startTime,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar progresso de download:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Inicia download de um vídeo
 */
async function iniciarDownload(req, res) {
  try {
    const { youtubeId } = req.body;

    if (!youtubeId) {
      return res.status(400).json({ error: 'YouTube ID é obrigatório' });
    }

    // Verificar se já existe
    if (downloadService.videoExiste(youtubeId)) {
      return res.json({ success: true, message: 'Vídeo já está em cache', cached: true });
    }

    // Verificar se já está baixando
    if (downloadService.getDownloadProgress(youtubeId)) {
      return res.json({ success: true, message: 'Download já em progresso', downloading: true });
    }

    // Iniciar download em background
    downloadService.baixarVideo(youtubeId)
      .then(result => {
        console.log(`✅ Download completo em background: ${youtubeId}`);
      })
      .catch(error => {
        console.error(`❌ Erro no download em background: ${youtubeId}`, error);
      });

    res.json({ success: true, message: 'Download iniciado', downloading: true });
  } catch (error) {
    console.error('❌ Erro ao iniciar download:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Deleta um vídeo do cache
 */
async function deletarVideo(req, res) {
  try {
    const { youtubeId } = req.params;

    const deleted = await downloadService.deletarVideo(youtubeId);

    if (deleted) {
      res.json({ success: true, message: 'Vídeo deletado do cache' });
    } else {
      res.status(404).json({ error: 'Vídeo não encontrado no cache' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar vídeo:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retorna informações sobre o cache
 */
function getCacheInfo(req, res) {
  try {
    const fs = require('fs');
    const path = require('path');

    const downloadsDir = downloadService.DOWNLOADS_DIR;

    if (!fs.existsSync(downloadsDir)) {
      return res.json({
        totalFiles: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        totalSizeGB: 0,
        files: [],
      });
    }

    const files = fs.readdirSync(downloadsDir);
    let totalSize = 0;
    const fileList = [];

    for (const file of files) {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;

      fileList.push({
        name: file,
        youtubeId: file.replace('.mp4', ''),
        sizeBytes: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      });
    }

    res.json({
      totalFiles: files.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
      files: fileList,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar informações do cache:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Limpa cache (arquivos antigos)
 */
async function limparCache(req, res) {
  try {
    await downloadService.limparArquivosAntigos();
    await downloadService.verificarTamanhoCache();

    res.json({ success: true, message: 'Cache limpo com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  streamVideo,
  getDownloadProgress,
  iniciarDownload,
  deletarVideo,
  getCacheInfo,
  limparCache,
};
