/**
 * Helper para buscar configurações do banco de dados com cache
 *
 * Evita múltiplas queries ao banco ao buscar a mesma configuração.
 * Cache expira após 2 minutos.
 */

const prisma = require('../config/database');

// Cache de configurações
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

/**
 * Busca uma configuração do banco com cache
 * @param {string} chave - Chave da configuração
 * @param {string} valorPadrao - Valor padrão caso não encontre
 * @returns {Promise<string>} Valor da configuração
 */
async function buscarConfig(chave, valorPadrao = null) {
  const agora = Date.now();
  const cacheEntry = cache.get(chave);

  // Verificar se cache é válido
  if (cacheEntry && (agora - cacheEntry.timestamp < CACHE_TTL)) {
    return cacheEntry.valor;
  }

  try {
    // Buscar do banco
    const config = await prisma.configuracao.findUnique({
      where: { chave },
    });

    const valor = config ? config.valor : valorPadrao;

    // Armazenar no cache
    cache.set(chave, {
      valor,
      timestamp: agora,
    });

    return valor;
  } catch (error) {
    console.error(`Erro ao buscar configuração ${chave}:`, error);
    return valorPadrao;
  }
}

/**
 * Busca múltiplas configurações de uma vez
 * @param {string[]} chaves - Array de chaves
 * @returns {Promise<Object>} Objeto com chaves e valores
 */
async function buscarConfigs(chaves) {
  const resultado = {};

  for (const chave of chaves) {
    resultado[chave] = await buscarConfig(chave);
  }

  return resultado;
}

/**
 * Invalida o cache de uma configuração específica
 * @param {string} chave - Chave da configuração
 */
function invalidarCache(chave) {
  if (chave) {
    cache.delete(chave);
  } else {
    // Limpar todo o cache
    cache.clear();
  }
}

/**
 * Invalida todo o cache
 */
function limparCache() {
  cache.clear();
  console.log('🗑️ Cache de configurações limpo');
}

module.exports = {
  buscarConfig,
  buscarConfigs,
  invalidarCache,
  limparCache,
};
