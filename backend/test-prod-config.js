const axios = require('axios');

const API_URL = 'https://espeto.zapchatbr.com';

async function testProdConfigAPI() {
  try {
    // 1. Fazer login
    console.log('1. Fazendo login em produção...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Login bem-sucedido!');

    // 2. Buscar configurações
    console.log('\n2. Buscando configurações...');
    const configRes = await axios.get(`${API_URL}/api/config`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`\n✅ Resposta recebida! Status: ${configRes.status}`);
    console.log(`📊 Total de configurações: ${configRes.data.length}\n`);

    if (configRes.data.length === 0) {
      console.log('⚠️  ARRAY VAZIO! Nenhuma configuração encontrada.');
      console.log('Solução: Execute "node seed-config.js" no servidor de produção\n');
    } else {
      console.log('Configurações encontradas:');
      configRes.data.forEach((config, index) => {
        console.log(`\n${index + 1}. ${config.chave}`);
        console.log(`   Valor: ${config.valor}`);
        console.log(`   Tipo: ${config.tipo}`);
        if (config.descricao) {
          console.log(`   Descrição: ${config.descricao}`);
        }
      });
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testProdConfigAPI();
