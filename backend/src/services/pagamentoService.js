const prisma = require('../config/database');
const { criarPreferenciaPagamento, buscarPagamento } = require('../config/mercadopago');

/**
 * Cria um pagamento e preferência no Mercado Pago
 */
async function criarPagamento(pedidoId) {
  const pedido = await prisma.pedidoMusica.findUnique({
    where: { id: pedidoId },
  });

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  if (pedido.status !== 'pendente') {
    throw new Error('Este pedido já foi processado');
  }

  // Criar registro de pagamento
  const pagamento = await prisma.pagamento.create({
    data: {
      valor: pedido.valor,
      status: 'pending',
    },
  });

  try {
    // Criar preferência no Mercado Pago
    const preferencia = await criarPreferenciaPagamento({
      titulo: `Música: ${pedido.musicaTitulo}`,
      descricao: `Espeto Music - ${pedido.musicaTitulo}`,
      valor: pedido.valor,
      pedidoId: pedido.id,
      mesaNumero: null,
    });

    // Atualizar pagamento com ID da preferência
    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPreferenceId: preferencia.id,
      },
    });

    // Atualizar pedido com ID do pagamento
    await prisma.pedidoMusica.update({
      where: { id: pedidoId },
      data: {
        pagamentoId: pagamento.id,
      },
    });

    return {
      pagamento,
      preferencia,
      initPoint: preferencia.init_point,
    };
  } catch (error) {
    // Se falhar, remover pagamento criado
    await prisma.pagamento.delete({
      where: { id: pagamento.id },
    });
    throw error;
  }
}

/**
 * Processa notificação de webhook do Mercado Pago
 */
async function processarWebhook(data) {
  console.log('📩 Webhook recebido:', JSON.stringify(data, null, 2));

  if (data.type !== 'payment') {
    console.log('⚠️ Tipo de notificação ignorado:', data.type);
    return { ignorado: true };
  }

  try {
    const paymentId = data.data.id;
    const paymentInfo = await buscarPagamento(paymentId);

    console.log('💳 Informações do pagamento:', JSON.stringify(paymentInfo, null, 2));

    const pedidoId = paymentInfo.external_reference;

    // Buscar pagamento no banco
    const pedido = await prisma.pedidoMusica.findUnique({
      where: { id: pedidoId },
      include: { pagamento: true },
    });

    if (!pedido || !pedido.pagamento) {
      console.error('❌ Pedido não encontrado:', pedidoId);
      return { paymentInfo, erro: 'Pedido não encontrado' };
    }

    // Atualizar pagamento
    await prisma.pagamento.update({
      where: { id: pedido.pagamento.id },
      data: {
        mercadoPagoPaymentId: paymentId,
        status: paymentInfo.status,
        metodoPagamento: paymentInfo.payment_method_id,
        emailPagador: paymentInfo.payer?.email,
      },
    });

    let pedidoAtualizado = null;
    let deveIniciarReproducao = false;

    // Se pagamento aprovado, atualizar status do pedido
    if (paymentInfo.status === 'approved') {
      pedidoAtualizado = await prisma.pedidoMusica.update({
        where: { id: pedidoId },
        data: { status: 'pago' },
        include: {
          pagamento: true,
        },
      });

      console.log('✅ Pagamento aprovado! Pedido atualizado:', pedidoId);

      const outraMusicaTocando = await prisma.pedidoMusica.findFirst({
        where: {
          status: 'tocando',
          id: { not: pedidoId },
        },
      });

      if (!outraMusicaTocando) {
        pedidoAtualizado = await prisma.pedidoMusica.update({
          where: { id: pedidoId },
          data: { status: 'tocando' },
          include: {
            pagamento: true,
          },
        });
        deveIniciarReproducao = true;
        console.log('🎵 Música iniciada automaticamente:', pedidoId);
      }
    } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
      pedidoAtualizado = await prisma.pedidoMusica.update({
        where: { id: pedidoId },
        data: { status: 'cancelada' },
        include: {
          pagamento: true,
        },
      });
      console.log('❌ Pagamento rejeitado/cancelado. Pedido cancelado:', pedidoId);
    }

    return { paymentInfo, pedido: pedidoAtualizado, deveIniciarReproducao };
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    throw error;
  }
}

/**
 * Busca pagamento por ID
 */
async function buscarPagamentoPorId(pagamentoId) {
  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    include: {
      pedidoMusica: true,
    },
  });

  if (!pagamento) {
    throw new Error('Pagamento não encontrado');
  }

  return pagamento;
}

/**
 * Verifica status do pagamento no Mercado Pago
 */
async function verificarStatusPagamento(pagamentoId) {
  const pagamento = await buscarPagamentoPorId(pagamentoId);

  if (!pagamento.mercadoPagoPaymentId) {
    return pagamento;
  }

  try {
    const paymentInfo = await buscarPagamento(pagamento.mercadoPagoPaymentId);

    // Atualizar status se mudou
    if (paymentInfo.status !== pagamento.status) {
      await prisma.pagamento.update({
        where: { id: pagamentoId },
        data: {
          status: paymentInfo.status,
          metodoPagamento: paymentInfo.payment_method_id,
          emailPagador: paymentInfo.payer?.email,
        },
      });

      // Atualizar pedido se necessário
      if (pagamento.pedidoMusica) {
        if (paymentInfo.status === 'approved' && pagamento.pedidoMusica.status === 'pendente') {
          await prisma.pedidoMusica.update({
            where: { id: pagamento.pedidoMusica.id },
            data: { status: 'pago' },
          });
        }
      }
    }

    return { ...pagamento, status: paymentInfo.status };
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return pagamento;
  }
}

module.exports = {
  criarPagamento,
  processarWebhook,
  buscarPagamentoPorId,
  verificarStatusPagamento,
};
