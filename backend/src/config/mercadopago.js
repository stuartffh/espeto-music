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
 * Gera um CPF aleatório válido
 * @returns {string} CPF no formato XXX.XXX.XXX-XX
 */
function gerarCPFAleatorio() {
  // Gera 9 dígitos aleatórios
  const randomNine = () => Math.floor(100000000 + Math.random() * 900000000).toString();

  const cpfBase = randomNine();

  // Calcula primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfBase[i]) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;

  // Calcula segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfBase[i]) * (11 - i);
  }
  soma += digito1 * 2;
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;

  const cpfCompleto = cpfBase + digito1 + digito2;

  // Formata: XXX.XXX.XXX-XX
  return cpfCompleto.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Gera um email aleatório único
 * @returns {string} Email no formato cliente.XXXXXXXX@espetomusic.com.br
 */
function gerarEmailAleatorio() {
  const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `cliente.${randomId}@espetomusic.com.br`;
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

    // Gerar email e CPF aleatórios se não fornecidos
    const emailFinal = emailPagador || gerarEmailAleatorio();
    const cpfFinal = cpfPagador || gerarCPFAleatorio();

    console.log('🟣 [MP CONFIG] Email usado:', emailFinal);
    console.log('🟣 [MP CONFIG] CPF usado:', cpfFinal);

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
        email: emailFinal,
        identification: {
          type: 'CPF',
          number: cpfFinal.replace(/\D/g, ''), // Remove formatação para enviar apenas números
        },
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
