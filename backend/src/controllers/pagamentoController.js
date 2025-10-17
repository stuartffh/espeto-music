const pagamentoService = require('../services/pagamentoService');
const musicaService = require('../services/musicaService');
const playerService = require('../services/playerService');
const downloadService = require('../services/downloadService');

/**
 * Cria um pagamento PIX direto para um pedido
 *
 * Checkout Simplificado - Apenas dados essenciais:
 * - pedidoId (obrigatório)
 * - email (opcional - usado para notificações do Mercado Pago)
 * - nome (opcional - apenas para referência)
 *
 * Retorna QR Code e Pix Copia e Cola diretamente
 */
async function criarPix(req, res) {
  try {
    console.log('\n💳 ═══════════════════════════════════════════════════════');
    console.log('   CRIANDO PAGAMENTO PIX');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Body recebido:', JSON.stringify(req.body, null, 2));

    const { pedidoId, email, nome } = req.body;

    // Validação: apenas pedidoId é obrigatório
    if (!pedidoId) {
      console.log('❌ [PAGAMENTO] Erro: ID do pedido não fornecido');
      console.log('═══════════════════════════════════════════════════════\n');
      return res.status(400).json({
        error: 'ID do pedido é obrigatório',
        exemplo: {
          pedidoId: 'uuid-do-pedido',
          email: 'cliente@email.com (opcional)',
          nome: 'Nome do Cliente (opcional)'
        }
      });
    }

    console.log(`\n🔍 Pedido ID: ${pedidoId}`);
    console.log(`📧 Email: ${email || 'Não fornecido (opcional)'}`);
    console.log(`👤 Nome: ${nome || 'Não fornecido (opcional)'}`);
    console.log('\n⏳ Gerando QR Code PIX...');

    // Preparar dados do pagador (apenas campos fornecidos)
    const dadosPagador = {};

    if (email) dadosPagador.email = email;
    if (nome) dadosPagador.nome = nome;

    const result = await pagamentoService.criarPagamentoPIX(pedidoId, dadosPagador);

    console.log('\n✅ [PAGAMENTO] Pagamento PIX criado com sucesso!');
    console.log('💰 Valor:', result.pagamento?.valor);
    console.log('🔢 Payment ID:', result.mercadoPagoPaymentId);
    console.log('📱 QR Code:', result.qrCode ? 'Gerado' : 'Erro');
    console.log('📋 Pix Copia e Cola:', result.qrCodeText ? 'Gerado' : 'Erro');
    console.log('⏰ Expira em:', result.pixExpirationDate);
    console.log('═══════════════════════════════════════════════════════\n');

    res.status(201).json({
      success: true,
      mensagem: 'Pagamento PIX criado com sucesso',
      pagamento: {
        id: result.pagamento.id,
        valor: result.pagamento.valor,
        status: result.pagamento.status,
        mercadoPagoPaymentId: result.mercadoPagoPaymentId,
      },
      pix: {
        qrCode: result.qrCode, // Base64 da imagem do QR Code
        qrCodeText: result.qrCodeText, // Pix Copia e Cola
        expirationDate: result.pixExpirationDate,
      },
    });
  } catch (error) {
    console.error('\n❌ ═══════════════════════════════════════════════════════');
    console.error('   ERRO AO CRIAR PAGAMENTO PIX');
    console.error('   ═══════════════════════════════════════════════════════');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════\n');
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Cria um pagamento para um pedido
 */
async function criar(req, res) {
  try {
    const { pedidoId } = req.body;

    if (!pedidoId) {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }

    const result = await pagamentoService.criarPagamento(pedidoId);

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Webhook do Mercado Pago
 */
async function webhook(req, res) {
  try {
    console.log('\n🔔 ═══════════════════════════════════════════════════════');
    console.log('   WEBHOOK MERCADO PAGO RECEBIDO');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('\n📨 Headers:');
    console.log(JSON.stringify(req.headers, null, 2));
    console.log('\n📦 Body:');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('\n🔗 Query:');
    console.log(JSON.stringify(req.query, null, 2));
    console.log('═══════════════════════════════════════════════════════\n');

    // Mercado Pago pode enviar via body ou query
    const data = req.body.type ? req.body : req.query;

    console.log('🔄 Processando webhook...');
    const resultado = await pagamentoService.processarWebhook(data);

    const io = req.app.get('io');

    if (resultado?.pedido) {
      // Garantir que o vídeo esteja disponível antes de iniciar
      if (resultado.deveIniciarReproducao) {
        try {
          await downloadService.baixarVideo(resultado.pedido.musicaYoutubeId);
        } catch (error) {
          console.error('❌ Erro ao garantir download antes da reprodução:', error);
        }

        try {
          const estadoAtual = playerService.obterEstado();
          const precisaReiniciar =
            !estadoAtual.musicaAtual ||
            estadoAtual.musicaAtual.id !== resultado.pedido.id ||
            estadoAtual.status !== 'playing';

          if (precisaReiniciar) {
            await playerService.iniciarMusica(resultado.pedido);
          }
        } catch (error) {
          console.error('❌ Erro ao iniciar reprodução automática:', error);
        }
      }

      if (io) {
        const fila = await musicaService.buscarFilaMusicas();
        io.emit('fila:atualizada', fila);

        if (resultado.paymentInfo?.status === 'approved') {
          // Emitir evento com pedidoId e pagamentoId
          const eventData = {
            pedidoId: resultado.pedido.id,
            pagamentoId: resultado.pedido.pagamento?.id || resultado.pedido.pagamentoCarrinho?.id
          };
          io.emit('pedido:pago', eventData);
          console.log('📡 [WEBHOOK] Evento pedido:pago emitido:', eventData);
        }
      }
    }

    if (io) {
      io.emit('pagamento:atualizado', data);
    }

    console.log('\n✅ ═══════════════════════════════════════════════════════');
    console.log('   WEBHOOK PROCESSADO COM SUCESSO');
    console.log('   ═══════════════════════════════════════════════════════');
    if (resultado?.pedido) {
      console.log('📋 Pedido ID:', resultado.pedido.id);
      console.log('🎵 Música:', resultado.pedido.musicaTitulo);
      console.log('📊 Status:', resultado.pedido.status);
      console.log('💰 Pagamento Status:', resultado.paymentInfo?.status);
    }
    console.log('═══════════════════════════════════════════════════════\n');

    res.status(200).send('OK');
  } catch (error) {
    console.error('\n❌ ═══════════════════════════════════════════════════════');
    console.error('   ERRO AO PROCESSAR WEBHOOK');
    console.error('   ═══════════════════════════════════════════════════════');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════\n');
    res.status(500).json({ error: error.message });
  }
}

/**
 * Busca pagamento por ID
 */
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const pagamento = await pagamentoService.buscarPagamentoPorId(id);
    res.json(pagamento);
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Verifica status do pagamento
 */
async function verificarStatus(req, res) {
  try {
    const { id } = req.params;
    const pagamento = await pagamentoService.verificarStatusPagamento(id);
    res.json(pagamento);
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Finaliza carrinho e cria pagamento PIX para múltiplas músicas
 * POST /api/pagamentos/carrinho
 */
async function finalizarCarrinho(req, res) {
  try {
    console.log('\n🛒 ═══════════════════════════════════════════════════════');
    console.log('   FINALIZANDO CARRINHO');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Body recebido:', JSON.stringify(req.body, null, 2));

    const { obterIPCliente } = require('../middlewares/rateLimit');
    const ip = obterIPCliente(req);
    const sessionId = `session_${ip}`;

    const { email, nome, cpf } = req.body;

    console.log(`\n📦 SessionId: ${sessionId}`);
    console.log(`📧 Email: ${email || 'Não fornecido (opcional)'}`);
    console.log(`👤 Nome: ${nome || 'Não fornecido (opcional)'}`);
    console.log(`🆔 CPF: ${cpf || 'Não fornecido (opcional)'}`);

    // Preparar dados do pagador
    const dadosPagador = {};
    if (email) dadosPagador.email = email;
    if (nome) dadosPagador.nome = nome;
    if (cpf) dadosPagador.cpf = cpf;

    console.log('\n⏳ Criando pagamento para carrinho...');

    const result = await pagamentoService.criarPagamentoPIXCarrinho(sessionId, dadosPagador);

    console.log('\n✅ [PAGAMENTO] Pagamento do carrinho criado com sucesso!');
    console.log(`💰 Valor: R$ ${result.pagamento?.valor.toFixed(2)}`);
    console.log(`🔢 Payment ID: ${result.mercadoPagoPaymentId}`);
    console.log(`📝 Pedidos criados: ${result.pedidos?.length}`);
    console.log(`📱 QR Code: ${result.qrCode ? 'Gerado' : 'Erro'}`);
    console.log(`📋 Pix Copia e Cola: ${result.qrCodeText ? 'Gerado' : 'Erro'}`);
    console.log('═══════════════════════════════════════════════════════\n');

    res.status(201).json({
      success: true,
      mensagem: 'Carrinho finalizado com sucesso',
      pagamento: {
        id: result.pagamento.id,
        valor: result.pagamento.valor,
        status: result.pagamento.status,
        mercadoPagoPaymentId: result.mercadoPagoPaymentId,
        quantidadeMusicas: result.pedidos.length,
      },
      pedidos: result.pedidos.map(p => ({
        id: p.id,
        musicaTitulo: p.musicaTitulo,
        status: p.status,
      })),
      pix: {
        qrCode: result.qrCode,
        qrCodeText: result.qrCodeText,
        expirationDate: result.pixExpirationDate,
      },
    });
  } catch (error) {
    console.error('\n❌ ═══════════════════════════════════════════════════════');
    console.error('   ERRO AO FINALIZAR CARRINHO');
    console.error('   ═══════════════════════════════════════════════════════');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════\n');

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  criar,
  criarPix,
  finalizarCarrinho,
  webhook,
  buscarPorId,
  verificarStatus,
};
