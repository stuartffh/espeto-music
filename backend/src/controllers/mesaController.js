const mesaService = require('../services/mesaService');

/**
 * Lista todas as mesas
 */
async function listar(req, res) {
  try {
    const mesas = await mesaService.listarMesas();
    res.json(mesas);
  } catch (error) {
    console.error('Erro ao listar mesas:', error);
    res.status(500).json({ error: 'Erro ao listar mesas' });
  }
}

/**
 * Busca mesa por token do QR Code
 */
async function buscarPorToken(req, res) {
  try {
    const { token } = req.params;
    const mesa = await mesaService.buscarMesaPorToken(token);
    res.json(mesa);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Busca mesa por ID
 */
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const mesa = await mesaService.buscarMesaPorId(id);
    res.json(mesa);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Gera QR Code para uma mesa
 */
async function gerarQRCode(req, res) {
  try {
    const { id } = req.params;
    const result = await mesaService.gerarQRCode(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Cria uma nova mesa
 */
async function criar(req, res) {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({ error: 'Número da mesa é obrigatório' });
    }

    const mesa = await mesaService.criarMesa(parseInt(numero));
    res.status(201).json(mesa);
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Atualiza status de uma mesa
 */
async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { ativa } = req.body;

    if (ativa === undefined) {
      return res.status(400).json({ error: 'Status ativa é obrigatório' });
    }

    const mesa = await mesaService.atualizarStatusMesa(id, ativa);
    res.json(mesa);
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listar,
  buscarPorToken,
  buscarPorId,
  gerarQRCode,
  criar,
  atualizarStatus,
};
