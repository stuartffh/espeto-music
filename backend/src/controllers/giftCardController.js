const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para gerar código único de gift card
function gerarCodigo() {
  const parte1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const parte2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GIFT-${parte1}-${parte2}`;
}

// Listar todos os gift cards (admin)
exports.listar = async (req, res) => {
  try {
    const gifts = await prisma.giftCard.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        pedidoMusica: {
          select: {
            id: true,
            musicaTitulo: true,
            nomeCliente: true
          }
        }
      }
    });

    res.json(gifts);
  } catch (error) {
    console.error('Erro ao listar gift cards:', error);
    res.status(500).json({ erro: 'Erro ao listar gift cards' });
  }
};

// Criar novo gift card (admin)
exports.criar = async (req, res) => {
  try {
    const { valor, quantidadeMusicas, dataExpiracao, observacao } = req.body;

    if (!quantidadeMusicas || quantidadeMusicas < 1) {
      return res.status(400).json({ erro: 'Quantidade de músicas inválida' });
    }

    const codigo = gerarCodigo();

    const gift = await prisma.giftCard.create({
      data: {
        codigo,
        valor: valor || 0,
        quantidadeMusicas,
        dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        observacao
      }
    });

    res.status(201).json(gift);
  } catch (error) {
    console.error('Erro ao criar gift card:', error);
    res.status(500).json({ erro: 'Erro ao criar gift card' });
  }
};

// Validar gift card (público - para o cliente usar)
exports.validar = async (req, res) => {
  try {
    const { codigo } = req.params;

    const gift = await prisma.giftCard.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!gift) {
      return res.status(404).json({ erro: 'Gift card não encontrado' });
    }

    if (!gift.ativo) {
      return res.status(400).json({ erro: 'Gift card desativado' });
    }

    if (gift.usado) {
      return res.status(400).json({
        erro: 'Gift card já utilizado',
        usadoEm: gift.usadoEm,
        usadoPor: gift.usadoPor
      });
    }

    if (gift.dataExpiracao && new Date(gift.dataExpiracao) < new Date()) {
      return res.status(400).json({ erro: 'Gift card expirado' });
    }

    res.json({
      valido: true,
      quantidadeMusicas: gift.quantidadeMusicas,
      valor: gift.valor
    });
  } catch (error) {
    console.error('Erro ao validar gift card:', error);
    res.status(500).json({ erro: 'Erro ao validar gift card' });
  }
};

// Usar gift card (link com pedido de música)
exports.usar = async (req, res) => {
  try {
    const { codigo, pedidoMusicaId, nomeCliente } = req.body;

    const gift = await prisma.giftCard.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!gift || !gift.ativo || gift.usado) {
      return res.status(400).json({ erro: 'Gift card inválido ou já usado' });
    }

    if (gift.dataExpiracao && new Date(gift.dataExpiracao) < new Date()) {
      return res.status(400).json({ erro: 'Gift card expirado' });
    }

    // Marcar gift como usado
    const giftAtualizado = await prisma.giftCard.update({
      where: { id: gift.id },
      data: {
        usado: true,
        usadoEm: new Date(),
        usadoPor: nomeCliente,
        pedidoMusicaId
      }
    });

    res.json({
      sucesso: true,
      gift: giftAtualizado
    });
  } catch (error) {
    console.error('Erro ao usar gift card:', error);
    res.status(500).json({ erro: 'Erro ao usar gift card' });
  }
};

// Desativar gift card (admin)
exports.desativar = async (req, res) => {
  try {
    const { id } = req.params;

    const gift = await prisma.giftCard.update({
      where: { id },
      data: { ativo: false }
    });

    res.json(gift);
  } catch (error) {
    console.error('Erro ao desativar gift card:', error);
    res.status(500).json({ erro: 'Erro ao desativar gift card' });
  }
};

// Deletar gift card (admin)
exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.giftCard.delete({
      where: { id }
    });

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao deletar gift card:', error);
    res.status(500).json({ erro: 'Erro ao deletar gift card' });
  }
};
