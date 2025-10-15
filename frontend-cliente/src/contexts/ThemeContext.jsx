import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar tema do backend
  const fetchTheme = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/theme`);

      if (!response.ok) {
        throw new Error('Erro ao carregar tema');
      }

      const data = await response.json();
      setTheme(data);
      applyTheme(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tema:', err);
      setError(err.message);
      // Aplicar tema padrão em caso de erro
      applyDefaultTheme();
    } finally {
      setLoading(false);
    }
  };

  // Aplicar tema ao documento via CSS Variables
  const applyTheme = (themeData) => {
    if (!themeData) return;

    const root = document.documentElement;

    // Cores
    root.style.setProperty('--color-primary', themeData.corPrimaria);
    root.style.setProperty('--color-secondary', themeData.corSecundaria);
    root.style.setProperty('--color-accent', themeData.corAcento);
    root.style.setProperty('--color-background', themeData.corFundo);
    root.style.setProperty('--color-background-secondary', themeData.corFundoSecundario);
    root.style.setProperty('--color-text', themeData.corTexto);
    root.style.setProperty('--color-text-secondary', themeData.corTextoSecundario);

    // Tipografia
    root.style.setProperty('--font-primary', `${themeData.fontePrimaria}, sans-serif`);
    root.style.setProperty('--font-secondary', `${themeData.fonteSecundaria}, sans-serif`);

    // Estilo
    root.style.setProperty('--border-radius', themeData.borderRadius);

    // Sombras baseadas na intensidade
    const shadows = {
      light: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      },
      medium: {
        sm: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      strong: {
        sm: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        md: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        lg: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }
    };

    const intensity = themeData.shadowIntensity || 'medium';
    root.style.setProperty('--shadow-sm', shadows[intensity].sm);
    root.style.setProperty('--shadow-md', shadows[intensity].md);
    root.style.setProperty('--shadow-lg', shadows[intensity].lg);

    // Background image (se existir)
    if (themeData.backgroundUrl) {
      root.style.setProperty('--background-image', `url(${themeData.backgroundUrl})`);
    }
  };

  // Aplicar tema padrão
  const applyDefaultTheme = () => {
    const defaultTheme = {
      nome: 'Espeto Music',
      corPrimaria: '#DC2626',
      corSecundaria: '#F97316',
      corAcento: '#FBBF24',
      corFundo: '#0F172A',
      corFundoSecundario: '#1E293B',
      corTexto: '#F8FAFC',
      corTextoSecundario: '#CBD5E1',
      fontePrimaria: 'Inter',
      fonteSecundaria: 'Poppins',
      borderRadius: '8px',
      shadowIntensity: 'medium'
    };
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
  };

  // Recarregar tema (útil para atualizar após mudanças no admin)
  const reloadTheme = () => {
    fetchTheme();
  };

  // Buscar tema ao montar o componente
  useEffect(() => {
    fetchTheme();
  }, []);

  const value = {
    theme,
    loading,
    error,
    reloadTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
