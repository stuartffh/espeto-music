import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Hook personalizado para acessar o contexto do tema
 *
 * @returns {Object} Objeto contendo:
 * - theme: Objeto com as configurações do tema
 * - loading: Boolean indicando se o tema está carregando
 * - error: String com mensagem de erro (se houver)
 * - reloadTheme: Função para recarregar o tema
 *
 * @throws {Error} Se usado fora do ThemeProvider
 *
 * @example
 * const { theme, loading } = useTheme();
 *
 * if (loading) return <div>Carregando...</div>;
 *
 * return <div style={{ color: theme.corPrimaria }}>Olá!</div>;
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }

  return context;
};

export default useTheme;
