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

    const result = await pagamentoService.criarPagamentoPIX(pedidoId, {
      email: email || 'cliente@espeto.music',
      nome: nome || 'Cliente',
    });

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
          io.emit('pedido:pago', { pedidoId: resultado.pedido.id });
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

module.exports = {
  criar,
  criarPix,
  webhook,
  buscarPorId,
  verificarStatus,
};
