/**
 * Configuração da API
 *
 * Usa variáveis de ambiente do Vite para definir a URL base da API
 * Em desenvolvimento: http://localhost:3000
 * Em produção: https://espeto.zapchatbr.com
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Helper para fazer requisições à API
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
};

export default { API_URL, apiRequest };
