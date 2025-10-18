const prisma = require('../config/database');

/**
 * Middleware de Rate Limit por IP
 *
 * Limita cada IP a no máximo 3 músicas a cada 30 minutos
 * Aplica-se a:
 * - Pedidos individuais
 * - Carrinho (ao finalizar compra)
 */

/**
 * Obtém IP real do cliente (considerando proxies/load balancers)
 */
function obterIPCliente(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    req.connection.remoteAddress ||
    'unknown'
  );
}

/**
 * Verifica rate limit do IP
 */
async function verificarRateLimit(ip) {
  const agora = new Date();

  // Buscar rate limit do IP
  let rateLimit = await prisma.rate_limits.findFirst({
    where: { ip },
  });

  // Se não existe, criar
  if (!rateLimit) {
    const resetaEm = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    rateLimit = await prisma.rate_limits.create({
      data: {
        ip,
        contador: 0,
        resetaEm,
      },
    });
  }

  // Se passou dos 30 minutos, resetar contador
  if (rateLimit.resetaEm <= agora) {
    const novoResetaEm = new Date(Date.now() + 30 * 60 * 1000);

    rateLimit = await prisma.rate_limits.update({
      where: { id: rateLimit.id },
      data: {
        contador: 0,
        resetaEm: novoResetaEm,
      },
    });
  }

  return rateLimit;
}

/**
 * Incrementa contador de pedidos do IP
 */
async function incrementarContador(ip, quantidade = 1) {
  const rateLimit = await verificarRateLimit(ip);

  const novoContador = rateLimit.contador + quantidade;

  const rateLimitAtualizado = await prisma.rate_limits.update({
    where: { id: rateLimit.id },
    data: {
      contador: novoContador,
    },
  });

  console.log(`📊 Rate Limit - IP: ${ip}`);
  console.log(`   Contador: ${novoContador}/3`);
  console.log(`   Reseta em: ${rateLimitAtualizado.resetaEm.toLocaleString('pt-BR')}`);

  return rateLimitAtualizado;
}

/**
 * Middleware para validar rate limit (1 música)
 */
async function validarRateLimitUnitario(req, res, next) {
  try {
    const ip = obterIPCliente(req);
    const rateLimit = await verificarRateLimit(ip);

    const musicasRestantes = 3 - rateLimit.contador;

    if (musicasRestantes <= 0) {
      const tempoRestante = Math.ceil((rateLimit.resetaEm - new Date()) / 1000 / 60);

      console.log(`🚫 Rate Limit atingido - IP: ${ip}`);
      console.log(`   Contador: ${rateLimit.contador}/3`);
      console.log(`   Reseta em: ${tempoRestante} minutos`);

      return res.status(429).json({
        error: 'Limite de pedidos atingido',
        mensagem: `Você atingiu o limite de 3 músicas a cada 30 minutos. Aguarde ${tempoRestante} minutos para fazer novos pedidos.`,
        limiteAtingido: true,
        tempoRestante: tempoRestante,
        resetaEm: rateLimit.resetaEm,
      });
    }

    // Adicionar informações ao request
    req.rateLimitInfo = {
      ip,
      contador: rateLimit.contador,
      musicasRestantes,
      resetaEm: rateLimit.resetaEm,
    };

    console.log(`✅ Rate Limit OK - IP: ${ip}`);
    console.log(`   Músicas restantes: ${musicasRestantes}/3`);

    next();
  } catch (error) {
    console.error('❌ Erro ao verificar rate limit:', error);
    // Em caso de erro, permitir a requisição (fail-open)
    next();
  }
}

/**
 * Middleware para validar rate limit do carrinho (múltiplas músicas)
 */
async function validarRateLimitCarrinho(req, res, next) {
  try {
    const ip = obterIPCliente(req);
    const { quantidadeMusicas } = req.body;

    if (!quantidadeMusicas || quantidadeMusicas < 1) {
      return res.status(400).json({
        error: 'Quantidade de músicas inválida',
      });
    }

    const rateLimit = await verificarRateLimit(ip);
    const musicasRestantes = 3 - rateLimit.contador;

    if (quantidadeMusicas > musicasRestantes) {
      const tempoRestante = Math.ceil((rateLimit.resetaEm - new Date()) / 1000 / 60);

      console.log(`🚫 Rate Limit insuficiente - IP: ${ip}`);
      console.log(`   Solicitado: ${quantidadeMusicas} músicas`);
      console.log(`   Disponível: ${musicasRestantes} músicas`);
      console.log(`   Reseta em: ${tempoRestante} minutos`);

      return res.status(429).json({
        error: 'Limite de pedidos insuficiente',
        mensagem: `Você só pode adicionar ${musicasRestantes} música(s) agora. Aguarde ${tempoRestante} minutos para adicionar mais.`,
        limiteAtingido: true,
        musicasRestantes,
        tempoRestante,
        resetaEm: rateLimit.resetaEm,
      });
    }

    // Adicionar informações ao request
    req.rateLimitInfo = {
      ip,
      contador: rateLimit.contador,
      musicasRestantes,
      quantidadeMusicas,
      resetaEm: rateLimit.resetaEm,
    };

    console.log(`✅ Rate Limit OK para carrinho - IP: ${ip}`);
    console.log(`   Solicitado: ${quantidadeMusicas} músicas`);
    console.log(`   Disponível: ${musicasRestantes} músicas`);

    next();
  } catch (error) {
    console.error('❌ Erro ao verificar rate limit do carrinho:', error);
    // Em caso de erro, permitir a requisição (fail-open)
    next();
  }
}

/**
 * Limpa registros de rate limit expirados (executar periodicamente)
 */
async function limparRateLimitsExpirados() {
  const agora = new Date();

  // Manter registros por 1 hora após resetar (para histórico)
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const resultado = await prisma.rate_limits.deleteMany({
    where: {
      resetaEm: {
        lt: umDiaAtras,
      },
      contador: 0,
    },
  });

  if (resultado.count > 0) {
    console.log(`🗑️  ${resultado.count} rate limits antigos removidos`);
  }

  return resultado.count;
}

module.exports = {
  obterIPCliente,
  verificarRateLimit,
  incrementarContador,
  validarRateLimitUnitario,
  validarRateLimitCarrinho,
  limparRateLimitsExpirados,
};
