const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const IDLE_VIDEO_KEY = 'TV_IDLE_VIDEO_URL';

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function removeFileSafe(filePath) {
  if (!filePath) {
    return;
  }

  try {
    const absolute = path.join(UPLOADS_DIR, path.basename(filePath));
    const normalized = path.normalize(absolute);

    if (!normalized.startsWith(UPLOADS_DIR)) {
      return;
    }

    await fs.unlink(normalized);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Erro ao remover arquivo antigo:', error.message);
    }
  }
}

function buildAbsoluteUrl(req, relativePath) {
  if (!relativePath) {
    return '';
  }

  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${relativePath}`;
}

async function uploadIdleVideo(req, res) {
  try {
    await ensureUploadsDir();

    if (!req.file) {
      return res.status(400).json({ erro: 'Arquivo de vídeo é obrigatório' });
    }

    const allowedExtensions = ['.mp4', '.webm', '.mov'];
    const originalExt = path.extname(req.file.originalname || '').toLowerCase();
    const tempPath = req.file.path;

    if (!allowedExtensions.includes(originalExt)) {
      await fs.unlink(tempPath);
      return res.status(400).json({ erro: 'Formato de vídeo não suportado. Use MP4, WEBM ou MOV.' });
    }

    const finalFileName = `tv-idle-video${originalExt}`;
    const finalPath = path.join(UPLOADS_DIR, finalFileName);

    // Remover arquivos antigos (qualquer extensão)
    const existingConfig = await prisma.configuracao.findUnique({ where: { chave: IDLE_VIDEO_KEY } });
    if (existingConfig?.valor) {
      await removeFileSafe(existingConfig.valor);
    }

    await fs.rename(tempPath, finalPath);

    const relativePath = `/uploads/${finalFileName}`;

    const config = await prisma.configuracao.upsert({
      where: { chave: IDLE_VIDEO_KEY },
      update: { valor: relativePath },
      create: {
        chave: IDLE_VIDEO_KEY,
        valor: relativePath,
        descricao: 'URL do vídeo exibido quando não há música tocando',
        tipo: 'text',
      },
    });

    res.json({
      url: buildAbsoluteUrl(req, relativePath),
      relativePath,
      tamanhoBytes: req.file.size,
      nomeArquivo: finalFileName,
      atualizadoEm: config.atualizadoEm,
    });
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo da TV:', error);
    res.status(500).json({ erro: 'Erro ao fazer upload do vídeo' });
  }
}

async function getIdleVideo(req, res) {
  try {
    await ensureUploadsDir();

    const config = await prisma.configuracao.findUnique({ where: { chave: IDLE_VIDEO_KEY } });

    if (!config || !config.valor) {
      return res.json({ url: '', relativePath: '', atualizadoEm: null });
    }

    res.json({
      url: buildAbsoluteUrl(req, config.valor),
      relativePath: config.valor,
      atualizadoEm: config.atualizadoEm,
    });
  } catch (error) {
    console.error('Erro ao buscar vídeo da TV:', error);
    res.status(500).json({ erro: 'Erro ao buscar vídeo' });
  }
}

async function removerIdleVideo(req, res) {
  try {
    const config = await prisma.configuracao.findUnique({ where: { chave: IDLE_VIDEO_KEY } });

    if (!config) {
      return res.json({ mensagem: 'Nenhum vídeo configurado' });
    }

    await removeFileSafe(config.valor);
    await prisma.configuracao.delete({ where: { chave: IDLE_VIDEO_KEY } });

    res.json({ mensagem: 'Vídeo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover vídeo da TV:', error);
    res.status(500).json({ erro: 'Erro ao remover vídeo' });
  }
}

module.exports = {
  uploadIdleVideo,
  getIdleVideo,
  removerIdleVideo,
};
