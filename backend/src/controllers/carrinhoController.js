const carrinhoService = require('../services/carrinhoService');
const { obterIPCliente } = require('../middlewares/rateLimit');

/**
 * Controller de Carrinho
 *
 * Gerencia requisições HTTP relacionadas ao carrinho de compras
 */

/**
 * Gera sessionId único baseado em IP
 */
function gerarSessionId(req) {
  const ip = obterIPCliente(req);
  // Pode adicionar mais dados para tornar único (user agent, etc)
  return `session_${ip}`;
}

/**
 * Lista o carrinho atual
 * GET /api/carrinho
 */
async function listar(req, res) {
  try {
    const sessionId = gerarSessionId(req);

    console.log(`📦 Listando carrinho - Session: ${sessionId}`);

    const carrinho = await carrinhoService.listarCarrinho(sessionId);

    res.json({
      success: true,
      carrinho,
    });
  } catch (error) {
    console.error('❌ Erro ao listar carrinho:', error);
    res.status(500).json({
      error: 'Erro ao buscar carrinho',
      mensagem: error.message,
    });
  }
}

/**
 * Adiciona música ao carrinho
 * POST /api/carrinho
 */
async function adicionar(req, res) {
  try {
    const sessionId = gerarSessionId(req);
    const { titulo, youtubeId, thumbnail, duracao } = req.body;

    // Validação
    if (!titulo || !youtubeId) {
      return res.status(400).json({
        error: 'Título e YouTube ID são obrigatórios',
      });
    }

    console.log(`\n➕ ═══════════════════════════════════════════════════════`);
    console.log('   ADICIONANDO MÚSICA AO CARRINHO');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log(`📦 Session: ${sessionId}`);
    console.log(`🎵 Música: ${titulo}`);
    console.log(`🆔 YouTube ID: ${youtubeId}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Buscar preço da música
    const prisma = require('../config/database');
    const configuracao = await prisma.configuracoes.findUnique({
      where: { chave: 'PRECO_MUSICA' },
    });
    const valor = parseFloat(configuracao?.valor || 5.0);

    const musica = {
      titulo,
      youtubeId,
      thumbnail: thumbnail || '',
      duracao: duracao || 0,
      valor,
    };

    const carrinho = await carrinhoService.adicionarMusica(sessionId, musica);

    console.log(`✅ Música adicionada com sucesso ao carrinho`);

    res.status(201).json({
      success: true,
      mensagem: 'Música adicionada ao carrinho',
      carrinho,
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar música ao carrinho:', error);

    const statusCode = error.message.includes('Limite') || error.message.includes('já está') ? 400 : 500;

    res.status(statusCode).json({
      error: error.message || 'Erro ao adicionar música ao carrinho',
    });
  }
}

/**
 * Remove música do carrinho
 * DELETE /api/carrinho/:youtubeId
 */
async function remover(req, res) {
  try {
    const sessionId = gerarSessionId(req);
    const { youtubeId } = req.params;

    console.log(`\n➖ ═══════════════════════════════════════════════════════`);
    console.log('   REMOVENDO MÚSICA DO CARRINHO');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log(`📦 Session: ${sessionId}`);
    console.log(`🆔 YouTube ID: ${youtubeId}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const carrinho = await carrinhoService.removerMusica(sessionId, youtubeId);

    console.log(`✅ Música removida com sucesso do carrinho`);

    res.json({
      success: true,
      mensagem: 'Música removida do carrinho',
      carrinho,
    });
  } catch (error) {
    console.error('❌ Erro ao remover música do carrinho:', error);

    const statusCode = error.message.includes('não encontrada') ? 404 : 500;

    res.status(statusCode).json({
      error: error.message || 'Erro ao remover música do carrinho',
    });
  }
}

/**
 * Limpa todo o carrinho
 * DELETE /api/carrinho
 */
async function limpar(req, res) {
  try {
    const sessionId = gerarSessionId(req);

    console.log(`\n🗑️  ═══════════════════════════════════════════════════════`);
    console.log('   LIMPANDO CARRINHO');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log(`📦 Session: ${sessionId}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const carrinho = await carrinhoService.limparCarrinho(sessionId);

    console.log(`✅ Carrinho limpo com sucesso`);

    res.json({
      success: true,
      mensagem: 'Carrinho limpo',
      carrinho,
    });
  } catch (error) {
    console.error('❌ Erro ao limpar carrinho:', error);
    res.status(500).json({
      error: 'Erro ao limpar carrinho',
      mensagem: error.message,
    });
  }
}

/**
 * Define nome do cliente no carrinho
 * PATCH /api/carrinho/nome
 */
async function definirNome(req, res) {
  try {
    const sessionId = gerarSessionId(req);
    const { nomeCliente } = req.body;

    if (!nomeCliente || !nomeCliente.trim()) {
      return res.status(400).json({
        error: 'Nome do cliente é obrigatório',
      });
    }

    console.log(`👤 Definindo nome do cliente no carrinho: ${nomeCliente}`);

    const carrinho = await carrinhoService.definirNomeCliente(sessionId, nomeCliente.trim());

    res.json({
      success: true,
      mensagem: 'Nome definido',
      carrinho,
    });
  } catch (error) {
    console.error('❌ Erro ao definir nome no carrinho:', error);
    res.status(500).json({
      error: 'Erro ao definir nome',
      mensagem: error.message,
    });
  }
}

module.exports = {
  listar,
  adicionar,
  remover,
  limpar,
  definirNome,
};
