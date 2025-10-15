const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configurar credenciais do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-token',
});

const preference = new Preference(client);
const payment = new Payment(client);

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
    const preference = {
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

    const response = await preference.create({ body: preference });
    return response;
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    throw new Error('Falha ao criar preferência de pagamento');
  }
}

/**
 * Busca informações de um pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} Informações do pagamento
 */
async function buscarPagamento(paymentId) {
  try {
    const paymentData = await payment.get({ id: paymentId });
    return paymentData;
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    throw new Error('Falha ao buscar informações do pagamento');
  }
}

module.exports = {
  criarPreferenciaPagamento,
  buscarPagamento,
  client,
  preference,
  payment,
};
