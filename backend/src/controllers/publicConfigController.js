const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULTS = {
  MODO_GRATUITO: 'true',
  TEMPO_MAXIMO_MUSICA: '480',
  PRECO_MUSICA: '5',
  THEME_PRIMARY: '#7c3aed',
  THEME_SECONDARY: '#f472b6',
  THEME_ACCENT: '#facc15',
  THEME_BACKGROUND: '#0f172a',
  THEME_SURFACE: '#ffffff',
  THEME_TEXT: '#f8fafc',
  THEME_ON_SURFACE: '#0f172a',
  TV_IDLE_VIDEO_URL: '',
};

const PUBLIC_KEYS = Object.keys(DEFAULTS);

function toBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureHash(color, fallback) {
  if (typeof color !== 'string') {
    return fallback;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  return `#${trimmed}`;
}

function resolveUrl(req, value) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${value}`;
}

async function getPublicConfig(req, res) {
  try {
    const configs = await prisma.configuracao.findMany({
      where: {
        chave: { in: PUBLIC_KEYS },
      },
    });

    const map = configs.reduce((acc, item) => {
      acc[item.chave] = item;
      return acc;
    }, {});

    const theme = {
      primary: ensureHash(map.THEME_PRIMARY?.valor ?? DEFAULTS.THEME_PRIMARY, DEFAULTS.THEME_PRIMARY),
      secondary: ensureHash(map.THEME_SECONDARY?.valor ?? DEFAULTS.THEME_SECONDARY, DEFAULTS.THEME_SECONDARY),
      accent: ensureHash(map.THEME_ACCENT?.valor ?? DEFAULTS.THEME_ACCENT, DEFAULTS.THEME_ACCENT),
      background: ensureHash(map.THEME_BACKGROUND?.valor ?? DEFAULTS.THEME_BACKGROUND, DEFAULTS.THEME_BACKGROUND),
      surface: ensureHash(map.THEME_SURFACE?.valor ?? DEFAULTS.THEME_SURFACE, DEFAULTS.THEME_SURFACE),
      text: ensureHash(map.THEME_TEXT?.valor ?? DEFAULTS.THEME_TEXT, DEFAULTS.THEME_TEXT),
      onSurface: ensureHash(map.THEME_ON_SURFACE?.valor ?? DEFAULTS.THEME_ON_SURFACE, DEFAULTS.THEME_ON_SURFACE),
    };

    const idleVideoConfig = map.TV_IDLE_VIDEO_URL;
    const idleVideoRelative = idleVideoConfig?.valor ?? DEFAULTS.TV_IDLE_VIDEO_URL;

    res.json({
      modoGratuito: toBoolean(map.MODO_GRATUITO?.valor ?? DEFAULTS.MODO_GRATUITO),
      tempoMaximoMusica: toNumber(map.TEMPO_MAXIMO_MUSICA?.valor, Number(DEFAULTS.TEMPO_MAXIMO_MUSICA)),
      precoMusica: toNumber(map.PRECO_MUSICA?.valor, Number(DEFAULTS.PRECO_MUSICA)),
      theme,
      idleVideoUrl: resolveUrl(req, idleVideoRelative),
      idleVideoRelativePath: idleVideoRelative,
      idleVideoUpdatedAt: idleVideoConfig?.atualizadoEm ?? null,
    });
  } catch (error) {
    console.error('Erro ao carregar configurações públicas:', error);
    res.status(500).json({
      erro: 'Erro ao carregar configurações públicas',
    });
  }
}

module.exports = {
  getPublicConfig,
};
