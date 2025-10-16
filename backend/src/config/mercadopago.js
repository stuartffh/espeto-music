const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { buscarConfig } = require('../utils/configHelper');

// Cliente do Mercado Pago (será inicializado sob demanda)
let client = null;
let preference = null;
let payment = null;
let ultimoTokenCarregado = null;

/**
 * Inicializa ou atualiza o cliente do Mercado Pago com as credenciais do banco
 */
async function inicializarCliente() {
  // Buscar token do banco de dados
  const accessToken = await buscarConfig(
    'MERCADOPAGO_ACCESS_TOKEN',
    process.env.MERCADOPAGO_ACCESS_TOKEN || ''
  );

  // Se não mudou o token, retornar cliente existente
  if (client && ultimoTokenCarregado === accessToken) {
    return { client, preference, payment };
  }

  // Verificar se token é válido
  if (!accessToken || accessToken.trim() === '') {
    throw new Error(
      'Token do Mercado Pago não configurado. Configure em: Painel Admin > Configurações > MERCADOPAGO_ACCESS_TOKEN'
    );
  }

  console.log('🔧 Inicializando cliente Mercado Pago...');
  console.log(`🔑 Token configurado: ${accessToken.substring(0, 20)}...`);

  // Criar novo cliente
  client = new MercadoPagoConfig({
    accessToken: accessToken,
  });

  preference = new Preference(client);
  payment = new Payment(client);
  ultimoTokenCarregado = accessToken;

  console.log('✅ Cliente Mercado Pago inicializado com sucesso');

  return { client, preference, payment };
}

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * @param {Object} params - Parâmetros do pagamento
 * @returns {Promise<Object>} Preferência criada
 */
async function criarPreferenciaPagamento({
  titulo,
  descricao,
  valor,
  pedidoId,
  mesaNumero,
}) {
  try {
    // Inicializar cliente
    const { preference: pref } = await inicializarCliente();

    const preferenceData = {
      items: [
        {
          title: titulo,
          description: descricao,
          unit_price: parseFloat(valor),
          quantity: 1,
          currency_id: 'BRL',
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pagamento/sucesso`,
        failure: `${process.env.FRONTEND_URL}/pagamento/falha`,
        pending: `${process.env.FRONTEND_URL}/pagamento/pendente`,
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
      statement_descriptor: 'ESPETO MUSIC',
      metadata: {
        pedido_id: pedidoId,
        mesa_numero: mesaNumero,
      },
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
    };

    const response = await pref.create({ body: preferenceData });
    return response;
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    throw new Error('Falha ao criar preferência de pagamento: ' + error.message);
  }
}

/**
 * Busca informações de um pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} Informações do pagamento
 */
async function buscarPagamento(paymentId) {
  try {
    // Inicializar cliente
    const { payment: pay } = await inicializarCliente();

    const paymentData = await pay.get({ id: paymentId });
    return paymentData;
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    throw new Error('Falha ao buscar informações do pagamento');
  }
}

/**
 * Cria um pagamento PIX direto no Mercado Pago
 * @param {Object} params - Parâmetros do pagamento PIX
 * @returns {Promise<Object>} Pagamento criado com QR Code
 */
async function criarPagamentoPix({
  titulo,
  descricao,
  valor,
  pedidoId,
  emailPagador,
  cpfPagador,
  nomePagador,
}) {
  try {
    console.log('🟣 [MP CONFIG] Iniciando criarPagamentoPix');

    // Inicializar cliente (busca token do banco)
    const { payment: pay } = await inicializarCliente();

    console.log('🟣 [MP CONFIG] Cliente Mercado Pago inicializado');

    // Data de expiração: 15 dias a partir de agora
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 15);

    const paymentData = {
      transaction_amount: parseFloat(valor),
      description: descricao || titulo,
      payment_method_id: 'pix',
      external_reference: pedidoId,
      notification_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
      date_of_expiration: expirationDate.toISOString(),
      payer: {
        email: emailPagador || 'cliente@espeto.music',
        identification: cpfPagador ? {
          type: 'CPF',
          number: cpfPagador,
        } : undefined,
        first_name: nomePagador || 'Cliente',
      },
    };

    console.log('🟣 [MP CONFIG] Payload para Mercado Pago:', JSON.stringify(paymentData, null, 2));
    console.log('🟣 [MP CONFIG] Chamando payment.create()...');

    const response = await pay.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey: `${pedidoId}-${Date.now()}`,
      },
    });

    console.log('✅ [MP CONFIG] Pagamento PIX criado com sucesso!');
    console.log('✅ [MP CONFIG] Payment ID:', response.id);
    console.log('✅ [MP CONFIG] Status:', response.status);
    console.log('✅ [MP CONFIG] QR Code disponível:', !!response.point_of_interaction?.transaction_data?.qr_code);

    return {
      id: response.id,
      status: response.status,
      qrCode: response.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCodeText: response.point_of_interaction?.transaction_data?.qr_code,
      pixExpirationDate: response.date_of_expiration,
      transactionAmount: response.transaction_amount,
    };
  } catch (error) {
    console.error('❌ [MP CONFIG] Erro ao criar pagamento PIX');
    console.error('❌ [MP CONFIG] Tipo:', error.constructor.name);
    console.error('❌ [MP CONFIG] Mensagem:', error.message);
    console.error('❌ [MP CONFIG] Stack:', error.stack);
    if (error.response) {
      console.error('❌ [MP CONFIG] Status HTTP:', error.response.status);
      console.error('❌ [MP CONFIG] Response body:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.cause) {
      console.error('❌ [MP CONFIG] Causa:', error.cause);
    }
    throw new Error('Falha ao criar pagamento PIX: ' + error.message);
  }
}

module.exports = {
  criarPreferenciaPagamento,
  criarPagamentoPix,
  buscarPagamento,
  inicializarCliente,
  getClient: () => client,
  getPreference: () => preference,
  getPayment: () => payment,
};
