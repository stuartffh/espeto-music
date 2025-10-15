const pagamentoService = require('../services/pagamentoService');

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

    await pagamentoService.processarWebhook(data);

    // Emitir evento via WebSocket
    const io = req.app.get('io');
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
  webhook,
  buscarPorId,
  verificarStatus,
};
