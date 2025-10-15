const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testConfigAPI() {
  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Login bem-sucedido! Token:', token.substring(0, 20) + '...');

    // 2. Buscar configurações
    console.log('\n2. Buscando configurações...');
    const configRes = await axios.get(`${API_URL}/api/config`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ ${configRes.data.length} configurações encontradas:\n`);

    configRes.data.forEach((config, index) => {
      console.log(`${index + 1}. ${config.chave}`);
      console.log(`   Valor: ${config.valor}`);
      console.log(`   Descrição: ${config.descricao || 'N/A'}`);
      console.log(`   Tipo: ${config.tipo}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testConfigAPI();
