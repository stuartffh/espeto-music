/**
 * Serviço de Moderação de Conteúdo
 *
 * Funcionalidades:
 * - Validação de palavras proibidas em títulos de músicas
 * - Validação de nomes de clientes inapropriados
 * - Normalização de texto (remove acentos, caracteres especiais)
 * - Detecção de variações (l33t speak: p0rr@ -> porra)
 * - Cache de palavras proibidas para performance
 * - Níveis de severidade (LEVE, MEDIA, SEVERA)
 */

const prisma = require('../config/database');

// Cache de palavras proibidas (atualizado a cada 5 minutos)
let cachePalavrasProibidas = null;
let ultimaAtualizacaoCache = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Normaliza texto para comparação
 * - Remove acentos
 * - Remove pontuação
 * - Converte para minúsculas
 * - Substitui caracteres l33t speak (4 -> a, 3 -> e, 0 -> o, 1 -> i, 7 -> t)
 */
function normalizarTexto(texto) {
  if (!texto) return '';

  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .trim();
}

/**
 * Carrega palavras proibidas do banco com cache
 */
async function carregarPalavrasProibidas() {
  const agora = Date.now();

  // Usar cache se ainda válido
  if (cachePalavrasProibidas && ultimaAtualizacaoCache && (agora - ultimaAtualizacaoCache < CACHE_TTL)) {
    return cachePalavrasProibidas;
  }

  // Buscar do banco
  const palavras = await prisma.palavraProibida.findMany({
    where: { ativo: true },
    select: {
      id: true,
      palavra: true,
      categoria: true,
      severidade: true,
    },
  });

  // Normalizar palavras para comparação
  cachePalavrasProibidas = palavras.map(p => ({
    ...p,
    palavraNormalizada: normalizarTexto(p.palavra),
  }));

  ultimaAtualizacaoCache = agora;

  console.log(`✅ Cache de moderação atualizado: ${cachePalavrasProibidas.length} palavras proibidas`);

  return cachePalavrasProibidas;
}

/**
 * Invalida cache de palavras proibidas
 */
function invalidarCache() {
  cachePalavrasProibidas = null;
  ultimaAtualizacaoCache = null;
  console.log('🔄 Cache de moderação invalidado');
}

/**
 * Verifica se texto contém palavras proibidas
 * @param {string} texto - Texto a ser verificado
 * @param {string} categoria - NOME_CLIENTE, TITULO_MUSICA, ou AMBOS
 * @returns {Object} { encontradas: [...], severidadeMaxima: 'LEVE'|'MEDIA'|'SEVERA' }
 */
async function verificarTexto(texto, categoria = 'AMBOS') {
  if (!texto) {
    return { encontradas: [], severidadeMaxima: null };
  }

  const palavrasProibidas = await carregarPalavrasProibidas();
  const textoNormalizado = normalizarTexto(texto);
  const palavrasTexto = textoNormalizado.split(' ');

  const encontradas = [];

  for (const palavraProibida of palavrasProibidas) {
    // Verificar categoria
    if (palavraProibida.categoria !== 'AMBOS' && palavraProibida.categoria !== categoria) {
      continue;
    }

    const palavraNormalizada = palavraProibida.palavraNormalizada;

    // Verificar palavra exata
    if (palavrasTexto.includes(palavraNormalizada)) {
      encontradas.push(palavraProibida);
      continue;
    }

    // Verificar substring (para palavras compostas ou dentro de outras)
    if (textoNormalizado.includes(palavraNormalizada)) {
      encontradas.push(palavraProibida);
      continue;
    }

    // Verificar similaridade (detectar variações próximas)
    for (const palavra of palavrasTexto) {
      if (calcularSimilaridade(palavra, palavraNormalizada) > 0.8) {
        encontradas.push(palavraProibida);
        break;
      }
    }
  }

  // Determinar severidade máxima
  let severidadeMaxima = null;
  if (encontradas.length > 0) {
    const severidades = encontradas.map(p => p.severidade);
    if (severidades.includes('SEVERA')) {
      severidadeMaxima = 'SEVERA';
    } else if (severidades.includes('MEDIA')) {
      severidadeMaxima = 'MEDIA';
    } else {
      severidadeMaxima = 'LEVE';
    }
  }

  return { encontradas, severidadeMaxima };
}

/**
 * Calcula similaridade entre duas strings (Levenshtein simplificado)
 * @returns {number} 0 a 1, onde 1 é idêntico
 */
function calcularSimilaridade(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const distancia = levenshteinDistance(str1, str2);
  return 1 - (distancia / maxLen);
}

/**
 * Distância de Levenshtein entre duas strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Valida um pedido de música
 * @param {Object} dados - { nomeCliente, musicaTitulo, dedicatoria, dedicatoriaDe }
 * @returns {Object} { aprovado: boolean, motivo: string, palavrasEncontradas: [...] }
 */
async function validarPedido({ nomeCliente, musicaTitulo, dedicatoria, dedicatoriaDe }) {
  // Verificar se moderação está ativa
  const configModeracao = await prisma.configuracao.findUnique({
    where: { chave: 'MODERACAO_ATIVA' },
  });

  if (configModeracao && configModeracao.valor !== 'true') {
    return { aprovado: true, motivo: null, palavrasEncontradas: [] };
  }

  // Buscar nível de moderação
  const configNivel = await prisma.configuracao.findUnique({
    where: { chave: 'NIVEL_MODERACAO' },
  });

  const nivelModeracao = configNivel ? configNivel.valor : 'MEDIA';

  // Verificar nome do cliente
  if (nomeCliente) {
    const resultadoNome = await verificarTexto(nomeCliente, 'NOME_CLIENTE');

    if (resultadoNome.encontradas.length > 0) {
      // Aplicar filtro baseado em severidade e nível de moderação
      if (aplicarBloqueio(resultadoNome.severidadeMaxima, nivelModeracao)) {
        return {
          aprovado: false,
          motivo: obterMensagemBloqueio(resultadoNome.severidadeMaxima),
          palavrasEncontradas: resultadoNome.encontradas,
          campo: 'nomeCliente',
        };
      }
    }
  }

  // Verificar título da música
  if (musicaTitulo) {
    const resultadoTitulo = await verificarTexto(musicaTitulo, 'TITULO_MUSICA');

    if (resultadoTitulo.encontradas.length > 0) {
      // Aplicar filtro baseado em severidade e nível de moderação
      if (aplicarBloqueio(resultadoTitulo.severidadeMaxima, nivelModeracao)) {
        return {
          aprovado: false,
          motivo: obterMensagemBloqueio(resultadoTitulo.severidadeMaxima),
          palavrasEncontradas: resultadoTitulo.encontradas,
          campo: 'musicaTitulo',
        };
      }
    }
  }

  // Verificar dedicatória (se presente)
  if (dedicatoria) {
    const resultadoDedicatoria = await verificarTexto(dedicatoria, 'AMBOS');

    if (resultadoDedicatoria.encontradas.length > 0) {
      if (aplicarBloqueio(resultadoDedicatoria.severidadeMaxima, nivelModeracao)) {
        return {
          aprovado: false,
          motivo: 'Dedicatória contém conteúdo inapropriado',
          palavrasEncontradas: resultadoDedicatoria.encontradas,
          campo: 'dedicatoria',
        };
      }
    }
  }

  // Verificar dedicatória "De:" (se presente)
  if (dedicatoriaDe) {
    const resultadoDedicatoriaDe = await verificarTexto(dedicatoriaDe, 'NOME_CLIENTE');

    if (resultadoDedicatoriaDe.encontradas.length > 0) {
      if (aplicarBloqueio(resultadoDedicatoriaDe.severidadeMaxima, nivelModeracao)) {
        return {
          aprovado: false,
          motivo: 'Nome do remetente da dedicatória contém conteúdo inapropriado',
          palavrasEncontradas: resultadoDedicatoriaDe.encontradas,
          campo: 'dedicatoriaDe',
        };
      }
    }
  }

  // Aprovado
  return { aprovado: true, motivo: null, palavrasEncontradas: [] };
}

/**
 * Decide se deve bloquear baseado em severidade e nível de moderação
 */
function aplicarBloqueio(severidade, nivelModeracao) {
  if (!severidade) return false;

  // LEVE: bloqueia apenas SEVERA
  if (nivelModeracao === 'LEVE') {
    return severidade === 'SEVERA';
  }

  // MEDIA: bloqueia MEDIA e SEVERA
  if (nivelModeracao === 'MEDIA') {
    return severidade === 'MEDIA' || severidade === 'SEVERA';
  }

  // SEVERA: bloqueia tudo (LEVE, MEDIA, SEVERA)
  if (nivelModeracao === 'SEVERA') {
    return true;
  }

  return false;
}

/**
 * Retorna mensagem amigável de bloqueio
 */
function obterMensagemBloqueio(severidade) {
  if (severidade === 'SEVERA') {
    return 'Não foi possível processar seu pedido. Por favor, revise as informações fornecidas.';
  }

  if (severidade === 'MEDIA') {
    return 'O conteúdo informado não está adequado. Por favor, escolha outro nome ou música.';
  }

  return 'Por favor, revise o nome ou música escolhida.';
}

/**
 * Adiciona uma palavra proibida
 */
async function adicionarPalavraProibida({ palavra, categoria, severidade }) {
  const palavraNormalizada = normalizarTexto(palavra);

  // Verificar se já existe
  const existe = await prisma.palavraProibida.findFirst({
    where: {
      palavra: palavraNormalizada,
      categoria,
    },
  });

  if (existe) {
    throw new Error('Esta palavra já está cadastrada para esta categoria');
  }

  const novaPalavra = await prisma.palavraProibida.create({
    data: {
      palavra: palavraNormalizada,
      categoria: categoria || 'AMBOS',
      severidade: severidade || 'MEDIA',
      ativo: true,
    },
  });

  invalidarCache();

  return novaPalavra;
}

/**
 * Lista palavras proibidas
 */
async function listarPalavrasProibidas({ categoria, severidade, ativo } = {}) {
  const where = {};

  if (categoria) where.categoria = categoria;
  if (severidade) where.severidade = severidade;
  if (ativo !== undefined) where.ativo = ativo;

  return await prisma.palavraProibida.findMany({
    where,
    orderBy: [
      { categoria: 'asc' },
      { severidade: 'desc' },
      { palavra: 'asc' },
    ],
  });
}

/**
 * Atualiza palavra proibida
 */
async function atualizarPalavraProibida(id, dados) {
  const palavra = await prisma.palavraProibida.update({
    where: { id },
    data: dados,
  });

  invalidarCache();

  return palavra;
}

/**
 * Deleta palavra proibida
 */
async function deletarPalavraProibida(id) {
  await prisma.palavraProibida.delete({
    where: { id },
  });

  invalidarCache();
}

/**
 * Ativa/desativa palavra proibida
 */
async function togglePalavraProibida(id) {
  const palavra = await prisma.palavraProibida.findUnique({
    where: { id },
  });

  if (!palavra) {
    throw new Error('Palavra proibida não encontrada');
  }

  const atualizada = await prisma.palavraProibida.update({
    where: { id },
    data: { ativo: !palavra.ativo },
  });

  invalidarCache();

  return atualizada;
}

module.exports = {
  validarPedido,
  verificarTexto,
  normalizarTexto,
  adicionarPalavraProibida,
  listarPalavrasProibidas,
  atualizarPalavraProibida,
  deletarPalavraProibida,
  togglePalavraProibida,
  invalidarCache,
};
