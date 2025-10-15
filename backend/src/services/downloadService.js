/**
 * Download Service - Gerenciamento de downloads de vídeos do YouTube
 *
 * Features:
 * - Download com yt-dlp (mais robusto que ytdl-core)
 * - Cache inteligente de vídeos
 * - Limpeza automática de arquivos antigos
 * - Suporte a streaming HTTP
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

// Diretório para armazenar vídeos baixados
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');
const MAX_CACHE_SIZE_GB = 5; // Máximo 5GB de cache
const MAX_FILE_AGE_DAYS = 7; // Arquivos com mais de 7 dias serão deletados

// Map para rastrear downloads em progresso
const activeDownloads = new Map();

/**
 * Inicializa o serviço de download
 */
async function inicializar() {
  try {
    // Criar diretório de downloads se não existir
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      await mkdir(DOWNLOADS_DIR, { recursive: true });
      console.log('📁 Diretório de downloads criado:', DOWNLOADS_DIR);
    }

    // Limpar arquivos antigos ao iniciar
    await limparArquivosAntigos();

    console.log('✅ Download Service inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Download Service:', error);
  }
}

/**
 * Verifica se um vídeo já foi baixado
 */
function videoExiste(youtubeId) {
  const filePath = getVideoPath(youtubeId);
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

/**
 * Retorna o caminho completo do arquivo de vídeo
 */
function getVideoPath(youtubeId) {
  return path.join(DOWNLOADS_DIR, `${youtubeId}.mp4`);
}

/**
 * Retorna informações sobre o progresso do download
 */
function getDownloadProgress(youtubeId) {
  return activeDownloads.get(youtubeId) || null;
}

/**
 * Baixa um vídeo do YouTube usando yt-dlp
 * Retorna uma Promise que resolve quando o download completa
 */
async function baixarVideo(youtubeId) {
  // Se já está baixado, retornar imediatamente
  if (videoExiste(youtubeId)) {
    console.log('✅ Vídeo já existe no cache:', youtubeId);
    return { success: true, cached: true, path: getVideoPath(youtubeId) };
  }

  // Se já está baixando, retornar a Promise existente
  if (activeDownloads.has(youtubeId)) {
    console.log('⏳ Download já em progresso:', youtubeId);
    return activeDownloads.get(youtubeId).promise;
  }

  console.log('📥 Iniciando download:', youtubeId);

  const videoPath = getVideoPath(youtubeId);
  // yt-dlp adiciona extensão automaticamente, então usar output template sem .temp
  const tempOutputTemplate = path.join(DOWNLOADS_DIR, `${youtubeId}.temp`);
  const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

  // Criar objeto de progresso
  const downloadInfo = {
    youtubeId,
    startTime: Date.now(),
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    promise: null,
  };

  // Criar a Promise de download
  const downloadPromise = new Promise((resolve, reject) => {
    try {
      // Usar yt-dlp via shell (mais simples e confiável no Windows)
      const ytdlpPath = 'C:\\Users\\User\\AppData\\Roaming\\Python\\Python313\\Scripts\\yt-dlp.exe';
      const ffmpegPath = path.join(__dirname, '../../ffmpeg/ffmpeg-8.0-essentials_build/bin/ffmpeg.exe');

      // Construir comando completo com formato específico para browser
      // Usa formato que garante vídeo+áudio em MP4 compatível com navegadores
      // -f 22: 720p MP4 com áudio (pre-merged)
      // Fallback: best format até 720p com áudio, forçando merge em MP4 com FFmpeg
      const command = `"${ytdlpPath}" ${videoUrl} -f "22/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]" --merge-output-format mp4 --ffmpeg-location "${ffmpegPath}" -o "${tempOutputTemplate}.%(ext)s" --no-playlist --no-warnings --progress --newline`;

      console.log(`🎬 Executando: ${command}`);

      const ytdlp = spawn(command, {
        shell: true,
        windowsHide: true
      });

      let lastProgress = 0;

      ytdlp.stdout.on('data', (data) => {
        const output = data.toString();

        // Parsear progresso do yt-dlp
        // Formato: [download]  45.2% of 10.50MiB at 2.00MiB/s ETA 00:02
        const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          downloadInfo.progress = Math.floor(progress);

          // Log a cada 10%
          if (Math.floor(progress / 10) > Math.floor(lastProgress / 10)) {
            console.log(`📥 Download ${youtubeId}: ${Math.floor(progress)}%`);
          }
          lastProgress = progress;
        }

        // Parsear tamanho total
        const sizeMatch = output.match(/of\s+([\d.]+)(K|M|G)iB/);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2];
          let bytes = size;
          if (unit === 'K') bytes *= 1024;
          else if (unit === 'M') bytes *= 1024 * 1024;
          else if (unit === 'G') bytes *= 1024 * 1024 * 1024;
          downloadInfo.totalBytes = bytes;
        }
      });

      ytdlp.stderr.on('data', (data) => {
        const error = data.toString();
        // Ignorar avisos normais
        if (!error.includes('WARNING')) {
          console.error(`⚠️ yt-dlp stderr: ${error}`);
        }
      });

      ytdlp.on('error', (error) => {
        console.error('❌ Erro ao executar yt-dlp:', error.message);
        console.log('💡 Certifique-se de que yt-dlp está instalado: pip install yt-dlp');

        // Limpar arquivo temporário
        const actualTempPath = `${tempOutputTemplate}.mp4`;
        if (fs.existsSync(actualTempPath)) {
          fs.unlinkSync(actualTempPath);
        }

        activeDownloads.delete(youtubeId);
        reject(new Error(`Erro ao executar yt-dlp: ${error.message}`));
      });

      ytdlp.on('close', (code) => {
        if (code === 0) {
          // Download bem-sucedido
          // yt-dlp adiciona .mp4 automaticamente, então o arquivo será {youtubeId}.temp.mp4
          const actualTempPath = `${tempOutputTemplate}.mp4`;

          // Renomear arquivo temporário para final
          if (fs.existsSync(actualTempPath)) {
            fs.renameSync(actualTempPath, videoPath);

            const duration = ((Date.now() - downloadInfo.startTime) / 1000).toFixed(2);
            const stats = fs.statSync(videoPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

            console.log(`✅ Download completo: ${youtubeId} (${sizeMB} MB em ${duration}s)`);

            activeDownloads.delete(youtubeId);
            resolve({ success: true, cached: false, path: videoPath });
          } else {
            console.error('❌ Arquivo temporário não encontrado após download');
            console.error(`❌ Esperado: ${actualTempPath}`);
            activeDownloads.delete(youtubeId);
            reject(new Error('Arquivo temporário não encontrado'));
          }
        } else {
          console.error(`❌ yt-dlp saiu com código ${code}`);

          // Limpar arquivo temporário (tentar ambos os padrões)
          const actualTempPath = `${tempOutputTemplate}.mp4`;
          if (fs.existsSync(actualTempPath)) {
            fs.unlinkSync(actualTempPath);
          }

          activeDownloads.delete(youtubeId);
          reject(new Error(`yt-dlp falhou com código ${code}`));
        }
      });

    } catch (error) {
      console.error('❌ Erro ao baixar vídeo:', error);
      activeDownloads.delete(youtubeId);

      // Limpar arquivo temporário se existir
      const actualTempPath = `${tempOutputTemplate}.mp4`;
      if (fs.existsSync(actualTempPath)) {
        fs.unlinkSync(actualTempPath);
      }

      reject(error);
    }
  });

  downloadInfo.promise = downloadPromise;
  activeDownloads.set(youtubeId, downloadInfo);

  return downloadPromise;
}

/**
 * Cria um stream de leitura para um vídeo
 * Permite streaming progressivo enquanto o download está em andamento
 */
function criarVideoStream(youtubeId, options = {}) {
  const videoPath = getVideoPath(youtubeId);

  // Se o vídeo existe, criar stream normal
  if (videoExiste(youtubeId)) {
    return fs.createReadStream(videoPath, options);
  }

  // Se está baixando, aguardar um pouco e criar stream
  if (activeDownloads.has(youtubeId)) {
    // Aguardar 2 segundos para ter algum conteúdo inicial
    return new Promise((resolve) => {
      setTimeout(() => {
        const tempPath = `${videoPath}.temp`;
        if (fs.existsSync(tempPath)) {
          resolve(fs.createReadStream(tempPath, options));
        } else if (fs.existsSync(videoPath)) {
          resolve(fs.createReadStream(videoPath, options));
        } else {
          throw new Error('Vídeo não está disponível para streaming ainda');
        }
      }, 2000);
    });
  }

  throw new Error('Vídeo não encontrado e não está sendo baixado');
}

/**
 * Limpa arquivos antigos do cache
 */
async function limparArquivosAntigos() {
  try {
    const files = await readdir(DOWNLOADS_DIR);
    const now = Date.now();
    const maxAge = MAX_FILE_AGE_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of files) {
      const filePath = path.join(DOWNLOADS_DIR, file);
      const stats = await stat(filePath);

      // Deletar arquivos mais antigos que MAX_FILE_AGE_DAYS
      if (now - stats.mtimeMs > maxAge) {
        const size = stats.size;
        await unlink(filePath);
        deletedCount++;
        freedSpace += size;
        console.log(`🗑️  Arquivo antigo deletado: ${file}`);
      }
    }

    if (deletedCount > 0) {
      const freedMB = (freedSpace / 1024 / 1024).toFixed(2);
      console.log(`✅ Limpeza completa: ${deletedCount} arquivo(s), ${freedMB} MB liberados`);
    }

    // Verificar tamanho total do cache
    await verificarTamanhoCache();

  } catch (error) {
    console.error('❌ Erro ao limpar arquivos antigos:', error);
  }
}

/**
 * Verifica o tamanho total do cache e remove arquivos mais antigos se necessário
 */
async function verificarTamanhoCache() {
  try {
    const files = await readdir(DOWNLOADS_DIR);
    let totalSize = 0;
    const fileStats = [];

    // Calcular tamanho total e coletar informações dos arquivos
    for (const file of files) {
      const filePath = path.join(DOWNLOADS_DIR, file);
      const stats = await stat(filePath);
      totalSize += stats.size;
      fileStats.push({ file, path: filePath, size: stats.size, mtime: stats.mtimeMs });
    }

    const totalGB = totalSize / 1024 / 1024 / 1024;
    console.log(`💾 Cache atual: ${totalGB.toFixed(2)} GB / ${MAX_CACHE_SIZE_GB} GB`);

    // Se exceder o limite, deletar arquivos mais antigos
    if (totalGB > MAX_CACHE_SIZE_GB) {
      console.log('⚠️  Cache excedeu limite, removendo arquivos antigos...');

      // Ordenar por data de modificação (mais antigo primeiro)
      fileStats.sort((a, b) => a.mtime - b.mtime);

      let freedSpace = 0;
      let deletedCount = 0;

      // Deletar arquivos até ficar abaixo do limite
      for (const { file, path: filePath, size } of fileStats) {
        if (totalGB - (freedSpace / 1024 / 1024 / 1024) <= MAX_CACHE_SIZE_GB * 0.8) {
          break; // Parar ao atingir 80% do limite
        }

        await unlink(filePath);
        freedSpace += size;
        deletedCount++;
        console.log(`🗑️  Deletado por limite de cache: ${file}`);
      }

      const freedGB = (freedSpace / 1024 / 1024 / 1024).toFixed(2);
      console.log(`✅ ${deletedCount} arquivo(s) removido(s), ${freedGB} GB liberados`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tamanho do cache:', error);
  }
}

/**
 * Deleta um vídeo específico do cache
 */
async function deletarVideo(youtubeId) {
  try {
    const videoPath = getVideoPath(youtubeId);

    if (fs.existsSync(videoPath)) {
      await unlink(videoPath);
      console.log(`✅ Vídeo deletado: ${youtubeId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao deletar vídeo:', error);
    return false;
  }
}

module.exports = {
  inicializar,
  baixarVideo,
  videoExiste,
  getVideoPath,
  getDownloadProgress,
  criarVideoStream,
  limparArquivosAntigos,
  verificarTamanhoCache,
  deletarVideo,
  DOWNLOADS_DIR,
};
