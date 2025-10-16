const pagamentoService = require('../services/pagamentoService');
const musicaService = require('../services/musicaService');
const playerService = require('../services/playerService');
const downloadService = require('../services/downloadService');

/**
 * Cria um pagamento PIX direto para um pedido
 */
async function criarPix(req, res) {
  try {
    console.log('💳 [PAGAMENTO] Iniciando criação de pagamento PIX');
    console.log('📋 [PAGAMENTO] Body recebido:', JSON.stringify(req.body, null, 2));

    const { pedidoId, email, cpf, nome } = req.body;

    if (!pedidoId) {
      console.log('❌ [PAGAMENTO] Erro: ID do pedido não fornecido');
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }

    console.log(`🔍 [PAGAMENTO] Pedido ID: ${pedidoId}`);
    console.log(`👤 [PAGAMENTO] Dados do pagador: email=${email}, cpf=${cpf}, nome=${nome}`);

    const result = await pagamentoService.criarPagamentoPIX(pedidoId, {
      email,
      cpf,
      nome,
    });

    console.log('✅ [PAGAMENTO] Pagamento PIX criado com sucesso');
    console.log('📄 [PAGAMENTO] Resultado:', JSON.stringify(result, null, 2));

    res.status(201).json({
      mensagem: 'Pagamento PIX criado com sucesso',
      ...result,
    });
  } catch (error) {
    console.error('❌ [PAGAMENTO] Erro ao criar pagamento PIX:', error);
    console.error('❌ [PAGAMENTO] Stack trace:', error.stack);
    res.status(400).json({ error: error.message });
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
    console.log('📩 Webhook recebido do Mercado Pago');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Query:', req.query);

    // Mercado Pago pode enviar via body ou query
    const data = req.body.type ? req.body : req.query;

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

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
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
