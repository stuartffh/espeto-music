const prisma = require('../config/database');
const { criarPreferenciaPagamento, criarPagamentoPix, buscarPagamento } = require('../config/mercadopago');

/**
 * Cria um pagamento e preferência no Mercado Pago
 */
async function criarPagamento(pedidoId) {
  const pedido = await prisma.pedidos_musica.findUnique({
    where: { id: pedidoId },
  });

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  if (pedido.status !== 'pendente') {
    throw new Error('Este pedido já foi processado');
  }

  // Criar registro de pagamento
  const pagamento = await prisma.pagamentos.create({
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
    await prisma.pagamentos.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPreferenceId: preferencia.id,
      },
    });

    // Atualizar pedido com ID do pagamento
    await prisma.pedidos_musica.update({
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
    await prisma.pagamentos.delete({
      where: { id: pagamento.id },
    });
    throw error;
  }
}

/**
 * Cria um pagamento PIX direto no Mercado Pago
 */
async function criarPagamentoPIX(pedidoId, dadosPagador = {}) {
  console.log('🔵 [SERVICE] Iniciando criarPagamentoPIX');
  console.log(`🔵 [SERVICE] PedidoId: ${pedidoId}`);
  console.log(`🔵 [SERVICE] DadosPagador:`, JSON.stringify(dadosPagador, null, 2));

  const pedido = await prisma.pedidos_musica.findUnique({
    where: { id: pedidoId },
  });

  console.log('🔵 [SERVICE] Pedido encontrado:', pedido ? 'SIM' : 'NÃO');
  if (pedido) {
    console.log(`🔵 [SERVICE] Pedido status: ${pedido.status}`);
    console.log(`🔵 [SERVICE] Pedido valor: ${pedido.valor}`);
    console.log(`🔵 [SERVICE] Música: ${pedido.musicaTitulo}`);
  }

  if (!pedido) {
    console.log('❌ [SERVICE] Erro: Pedido não encontrado');
    throw new Error('Pedido não encontrado');
  }

  if (pedido.status !== 'pendente') {
    console.log(`❌ [SERVICE] Erro: Pedido já foi processado (status: ${pedido.status})`);
    throw new Error('Este pedido já foi processado');
  }

  // Criar registro de pagamento
  console.log('🔵 [SERVICE] Criando registro de pagamento no banco...');
  const pagamento = await prisma.pagamentos.create({
    data: {
      valor: pedido.valor,
      status: 'pending',
      emailPagador: dadosPagador.email,
      cpfPagador: dadosPagador.cpf,
      nomePagador: dadosPagador.nome,
      metodoPagamento: 'pix',
    },
  });
  console.log(`✅ [SERVICE] Pagamento criado no banco com ID: ${pagamento.id}`);

  try {
    console.log('🔵 [SERVICE] Chamando Mercado Pago API para criar pagamento PIX...');
    console.log('🔵 [SERVICE] Dados enviados ao MP:', {
      titulo: `Música: ${pedido.musicaTitulo}`,
      descricao: `Espeto Music - ${pedido.musicaTitulo}`,
      valor: pedido.valor,
      pedidoId: pedido.id,
      emailPagador: dadosPagador.email,
      cpfPagador: dadosPagador.cpf,
      nomePagador: dadosPagador.nome,
    });

    // Criar pagamento PIX no Mercado Pago
    const pixPayment = await criarPagamentoPix({
      titulo: `Música: ${pedido.musicaTitulo}`,
      descricao: `Espeto Music - ${pedido.musicaTitulo}`,
      valor: pedido.valor,
      pedidoId: pedido.id,
      emailPagador: dadosPagador.email,
      cpfPagador: dadosPagador.cpf,
      nomePagador: dadosPagador.nome,
    });

    console.log('✅ [SERVICE] Resposta do Mercado Pago:',  JSON.stringify(pixPayment, null, 2));

    // Atualizar pagamento com dados do PIX
    const pagamentoAtualizado = await prisma.pagamentos.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPaymentId: pixPayment.id.toString(),
        status: pixPayment.status,
        qrCode: pixPayment.qrCode,
        qrCodeText: pixPayment.qrCodeText,
        pixExpirationDate: pixPayment.pixExpirationDate ? new Date(pixPayment.pixExpirationDate) : null,
      },
    });

    // Vincular pagamento ao pedido
    await prisma.pedidos_musica.update({
      where: { id: pedidoId },
      data: {
        pagamentoId: pagamento.id,
      },
    });

    return {
      pagamento: pagamentoAtualizado,
      qrCode: pixPayment.qrCode,
      qrCodeText: pixPayment.qrCodeText,
      pixExpirationDate: pixPayment.pixExpirationDate,
      mercadoPagoPaymentId: pixPayment.id,
    };
  } catch (error) {
    console.error('❌ [SERVICE] Erro ao criar pagamento PIX');
    console.error('❌ [SERVICE] Tipo do erro:', error.constructor.name);
    console.error('❌ [SERVICE] Mensagem:', error.message);
    console.error('❌ [SERVICE] Stack:', error.stack);
    if (error.response) {
      console.error('❌ [SERVICE] Response data:', error.response.data);
      console.error('❌ [SERVICE] Response status:', error.response.status);
    }

    // Se falhar, remover pagamento criado
    console.log('🔵 [SERVICE] Removendo pagamento do banco (rollback)...');
    await prisma.pagamentos.delete({
      where: { id: pagamento.id },
    });
    console.log('✅ [SERVICE] Pagamento removido do banco');

    throw error;
  }
}

/**
 * Processa notificação de webhook do Mercado Pago
 */
async function processarWebhook(data) {
  console.log('\n🔄 [WEBHOOK SERVICE] Processando notificação...');
  console.log('📦 [WEBHOOK SERVICE] Dados recebidos:', JSON.stringify(data, null, 2));

  if (data.type !== 'payment') {
    console.log('⚠️ [WEBHOOK SERVICE] Tipo de notificação ignorado:', data.type);
    return { ignorado: true };
  }

  try {
    const paymentId = data.data.id;
    console.log(`🔍 [WEBHOOK SERVICE] Buscando informações do pagamento: ${paymentId}`);

    const paymentInfo = await buscarPagamento(paymentId);

    console.log('\n💳 [WEBHOOK SERVICE] ═════════════════════════════════════');
    console.log('   INFORMAÇÕES DO PAGAMENTO');
    console.log('   ═════════════════════════════════════════════════════');
    console.log('💰 ID:', paymentInfo.id);
    console.log('📊 Status:', paymentInfo.status);
    console.log('💵 Valor:', paymentInfo.transaction_amount);
    console.log('💳 Método:', paymentInfo.payment_method_id);
    console.log('📧 Email Pagador:', paymentInfo.payer?.email);
    console.log('🆔 CPF:', paymentInfo.payer?.identification?.number);
    console.log('👤 Nome:', paymentInfo.payer?.first_name);
    console.log('🔗 External Reference:', paymentInfo.external_reference);
    console.log('═════════════════════════════════════════════════════\n');

    const pedidoId = paymentInfo.external_reference;

    // Buscar pagamento no banco
    const pedido = await prisma.pedidos_musica.findUnique({
      where: { id: pedidoId },
      include: { pagamento: true },
    });

    if (!pedido || !pedido.pagamento) {
      console.error('❌ Pedido não encontrado:', pedidoId);
      return { paymentInfo, erro: 'Pedido não encontrado' };
    }

    // Atualizar pagamento
    await prisma.pagamentos.update({
      where: { id: pedido.pagamento.id },
      data: {
        mercadoPagoPaymentId: paymentId,
        status: paymentInfo.status,
        metodoPagamento: paymentInfo.payment_method_id,
        emailPagador: paymentInfo.payer?.email,
        cpfPagador: paymentInfo.payer?.identification?.number,
        nomePagador: paymentInfo.payer?.first_name,
        webhookData: JSON.stringify(paymentInfo),
        lastWebhookUpdate: new Date(),
      },
    });

    let pedidoAtualizado = null;
    let deveIniciarReproducao = false;

    // Se pagamento aprovado, atualizar status do pedido
    if (paymentInfo.status === 'approved') {
      console.log('\n💚 [WEBHOOK SERVICE] ═════════════════════════════════════');
      console.log('   PAGAMENTO APROVADO!');
      console.log('   ═════════════════════════════════════════════════════');
      console.log('📋 Pedido ID:', pedidoId);
      console.log('💰 Valor:', paymentInfo.transaction_amount);

      // Verificar se é pagamento de carrinho (múltiplas músicas)
      if (pedido.pagamentoCarrinhoId) {
        console.log('🛒 Pagamento de carrinho detectado!');
        console.log('💳 Pagamento ID:', pedido.pagamentoCarrinhoId);

        // Buscar todos os pedidos deste carrinho
        const todosPedidos = await prisma.pedidos_musica.findMany({
          where: { pagamentoCarrinhoId: pedido.pagamentoCarrinhoId },
          include: { pagamentoCarrinho: true },
        });

        console.log(`🎵 Atualizando ${todosPedidos.length} pedidos para "pago"...`);

        // Atualizar todos os pedidos para "pago"
        for (const pedidoCarrinho of todosPedidos) {
          await prisma.pedidos_musica.update({
            where: { id: pedidoCarrinho.id },
            data: { status: 'pago' },
          });
          console.log(`✅ Pedido atualizado: ${pedidoCarrinho.musicaTitulo}`);
        }

        pedidoAtualizado = todosPedidos[0]; // Retornar primeiro pedido

        console.log('✅ [WEBHOOK SERVICE] Todos os pedidos do carrinho atualizados!');
        console.log('═════════════════════════════════════════════════════\n');

        // Verificar se deve iniciar primeira música
        const outraMusicaTocando = await prisma.pedidos_musica.findFirst({
          where: {
            status: 'tocando',
          },
        });

        if (!outraMusicaTocando) {
          pedidoAtualizado = await prisma.pedidos_musica.update({
            where: { id: todosPedidos[0].id },
            data: { status: 'tocando' },
            include: {
              pagamentoCarrinho: true,
            },
          });
          deveIniciarReproducao = true;
          console.log('🎵 Primeira música do carrinho iniciada automaticamente:', todosPedidos[0].id);
        }
      } else {
        // Pagamento unitário
        console.log('🎵 Atualizando status para "pago"...');

        pedidoAtualizado = await prisma.pedidos_musica.update({
          where: { id: pedidoId },
          data: { status: 'pago' },
          include: {
            pagamento: true,
          },
        });

        console.log('✅ [WEBHOOK SERVICE] Pedido atualizado com sucesso!');
        console.log('═════════════════════════════════════════════════════\n');

        const outraMusicaTocando = await prisma.pedidos_musica.findFirst({
          where: {
            status: 'tocando',
            id: { not: pedidoId },
          },
        });

        if (!outraMusicaTocando) {
          pedidoAtualizado = await prisma.pedidos_musica.update({
            where: { id: pedidoId },
            data: { status: 'tocando' },
            include: {
              pagamento: true,
            },
          });
          deveIniciarReproducao = true;
          console.log('🎵 Música iniciada automaticamente:', pedidoId);
        }
      }
    } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
      pedidoAtualizado = await prisma.pedidos_musica.update({
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
  const pagamento = await prisma.pagamentos.findUnique({
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
      await prisma.pagamentos.update({
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
          await prisma.pedidos_musica.update({
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

/**
 * Cria pagamento PIX para carrinho (múltiplas músicas)
 */
async function criarPagamentoPIXCarrinho(sessionId, dadosPagador = {}) {
  console.log('🛒 [SERVICE] Iniciando pagamento de carrinho');
  console.log(`🛒 [SERVICE] SessionId: ${sessionId}`);

  const carrinhoService = require('./carrinhoService');
  const carrinho = await carrinhoService.listarCarrinho(sessionId);

  if (carrinho.quantidadeItens === 0) {
    throw new Error('Carrinho está vazio');
  }

  console.log(`🛒 [SERVICE] Carrinho com ${carrinho.quantidadeItens} músicas`);
  console.log(`🛒 [SERVICE] Valor total: R$ ${carrinho.valorTotal.toFixed(2)}`);

  // Criar registro de pagamento
  const pagamento = await prisma.pagamentos.create({
    data: {
      valor: carrinho.valorTotal,
      status: 'pending',
      emailPagador: dadosPagador.email,
      cpfPagador: dadosPagador.cpf,
      nomePagador: dadosPagador.nome || carrinho.nomeCliente,
      metodoPagamento: 'pix',
    },
  });

  console.log(`✅ [SERVICE] Pagamento criado no banco com ID: ${pagamento.id}`);

  // Criar pedidos para cada música do carrinho
  const pedidosCriados = [];

  for (const musica of carrinho.musicas) {
    const pedido = await prisma.pedidos_musica.create({
      data: {
        nomeCliente: carrinho.nomeCliente || dadosPagador.nome || 'Cliente',
        musicaTitulo: musica.titulo,
        musicaYoutubeId: musica.youtubeId,
        musicaThumbnail: musica.thumbnail,
        musicaDuracao: musica.duracao,
        status: 'pendente',
        valor: carrinho.valorTotal / carrinho.quantidadeItens, // Valor unitário
        pagamentoCarrinhoId: pagamento.id,
      },
    });

    pedidosCriados.push(pedido);
    console.log(`📝 [SERVICE] Pedido criado: ${pedido.musicaTitulo}`);
  }

  try {
    console.log('🛒 [SERVICE] Criando pagamento PIX no Mercado Pago...');

    // Criar descrição com todas as músicas
    const descricao = `Espeto Music - ${carrinho.quantidadeItens} músicas`;
    const titulo = carrinho.musicas.map(m => m.titulo).join(', ').substring(0, 100);

    // Criar pagamento PIX no Mercado Pago
    const pixPayment = await criarPagamentoPix({
      titulo,
      descricao,
      valor: carrinho.valorTotal,
      pedidoId: pedidosCriados[0].id, // Usar primeiro pedido como referência
      emailPagador: dadosPagador.email,
      cpfPagador: dadosPagador.cpf,
      nomePagador: dadosPagador.nome || carrinho.nomeCliente,
    });

    console.log('✅ [SERVICE] Pagamento PIX criado no Mercado Pago');

    // Atualizar pagamento com dados do PIX
    const pagamentoAtualizado = await prisma.pagamentos.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPaymentId: pixPayment.id.toString(),
        status: pixPayment.status,
        qrCode: pixPayment.qrCode,
        qrCodeText: pixPayment.qrCodeText,
        pixExpirationDate: pixPayment.pixExpirationDate ? new Date(pixPayment.pixExpirationDate) : null,
      },
    });

    // Limpar carrinho após criar pagamento
    await carrinhoService.limparCarrinho(sessionId);
    console.log('🗑️  [SERVICE] Carrinho limpo após criar pagamento');

    return {
      pagamento: pagamentoAtualizado,
      pedidos: pedidosCriados,
      qrCode: pixPayment.qrCode,
      qrCodeText: pixPayment.qrCodeText,
      pixExpirationDate: pixPayment.pixExpirationDate,
      mercadoPagoPaymentId: pixPayment.id,
    };
  } catch (error) {
    console.error('❌ [SERVICE] Erro ao criar pagamento PIX do carrinho');
    console.error('❌ [SERVICE] Mensagem:', error.message);

    // Rollback: remover pagamento e pedidos criados
    await prisma.pagamentos.delete({ where: { id: pagamento.id } });

    for (const pedido of pedidosCriados) {
      await prisma.pedidos_musica.delete({ where: { id: pedido.id } });
    }

    console.log('🔄 [SERVICE] Rollback executado: pagamento e pedidos removidos');

    throw error;
  }
}

module.exports = {
  criarPagamento,
  criarPagamentoPIX,
  criarPagamentoPIXCarrinho,
  processarWebhook,
  buscarPagamentoPorId,
  verificarStatusPagamento,
};
