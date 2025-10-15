import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buscarConfiguracoesPublicas } from '../services/api';

const defaultTheme = {
  primary: '#7c3aed',
  secondary: '#f472b6',
  accent: '#facc15',
  background: '#0f172a',
  surface: '#ffffff',
  text: '#f8fafc',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onAccent: '#0f172a',
  onBackground: '#f8fafc',
  onSurface: '#0f172a',
};

const ConfigContext = createContext({
  theme: defaultTheme,
  modoGratuito: true,
  tempoMaximoSegundos: 480,
  precoMusica: 5,
  idleVideoUrl: '',
  idleVideoUpdatedAt: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

const hexRegex = /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i;

function normalizeHex(color, fallback) {
  if (typeof color !== 'string') {
    return fallback;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return fallback;
  }

  if (!hexRegex.test(trimmed)) {
    return fallback;
  }

  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function getLuminance(hex) {
  const sanitized = normalizeHex(hex, '#000000').replace('#', '');
  const bigint = parseInt(sanitized.length === 3
    ? sanitized.split('').map((c) => c + c).join('')
    : sanitized, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const [nr, ng, nb] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
}

function getContrastColor(hex) {
  return getLuminance(hex) > 0.5 ? '#0f172a' : '#ffffff';
}

function applyTheme(theme) {
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`, value);
  });
}

export function ConfigProvider({ children }) {
  const [state, setState] = useState({
    theme: defaultTheme,
    modoGratuito: true,
    tempoMaximoSegundos: 480,
    precoMusica: 5,
    idleVideoUrl: '',
    idleVideoUpdatedAt: null,
    loading: true,
    error: null,
  });

  const processTheme = useCallback((rawTheme = {}) => {
    const base = {
      primary: normalizeHex(rawTheme.primary, defaultTheme.primary),
      secondary: normalizeHex(rawTheme.secondary, defaultTheme.secondary),
      accent: normalizeHex(rawTheme.accent, defaultTheme.accent),
      background: normalizeHex(rawTheme.background, defaultTheme.background),
      surface: normalizeHex(rawTheme.surface, defaultTheme.surface),
      text: normalizeHex(rawTheme.text, defaultTheme.text),
    };

    return {
      ...defaultTheme,
      ...base,
      onPrimary: getContrastColor(base.primary),
      onSecondary: getContrastColor(base.secondary),
      onAccent: getContrastColor(base.accent),
      onBackground: getContrastColor(base.background),
      onSurface: getContrastColor(base.surface),
    };
  }, []);

  const fetchConfig = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await buscarConfiguracoesPublicas();
      const data = response.data || {};
      const theme = processTheme(data.theme);

      applyTheme(theme);

      setState({
        theme,
        modoGratuito: Boolean(data.modoGratuito),
        tempoMaximoSegundos: Number(data.tempoMaximoMusica) || 480,
        precoMusica: Number(data.precoMusica) || 5,
        idleVideoUrl: data.idleVideoUrl || '',
        idleVideoUpdatedAt: data.idleVideoUpdatedAt || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Erro ao carregar configurações públicas:', error);
      applyTheme(defaultTheme);
      setState((prev) => ({
        ...prev,
        theme: defaultTheme,
        loading: false,
        error: 'Não foi possível carregar as configurações do sistema.',
      }));
    }
  }, [processTheme]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value = useMemo(() => ({
    theme: state.theme,
    modoGratuito: state.modoGratuito,
    tempoMaximoSegundos: state.tempoMaximoSegundos,
    precoMusica: state.precoMusica,
    idleVideoUrl: state.idleVideoUrl,
    idleVideoUpdatedAt: state.idleVideoUpdatedAt,
    loading: state.loading,
    error: state.error,
    refresh: fetchConfig,
  }), [state, fetchConfig]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
