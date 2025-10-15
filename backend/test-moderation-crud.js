const axios = require('axios');

const API_URL = 'http://localhost:3000';
let token = '';
let palavraId = null;

// Cores para output no console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n🔐 Fazendo login como admin...', 'blue');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    token = response.data.token;
    log('✓ Login realizado com sucesso', 'green');
    return true;
  } catch (error) {
    log(`✗ Erro no login: ${error.response?.data?.error || error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function listarPalavras() {
  try {
    log('\n📋 Listando todas as palavras proibidas...', 'blue');
    const response = await axios.get(`${API_URL}/api/admin/moderacao/palavras`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ ${response.data.length} palavras encontradas`, 'green');
    if (response.data.length > 0) {
      log(`Primeiras 3 palavras: ${response.data.slice(0, 3).map(p => p.palavra).join(', ')}`, 'yellow');
    }
    return true;
  } catch (error) {
    log(`✗ Erro ao listar: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function listarComFiltros() {
  try {
    log('\n🔍 Testando filtros (categoria=NOME_CLIENTE, severidade=ALTA)...', 'blue');
    const response = await axios.get(`${API_URL}/api/admin/moderacao/palavras?categoria=NOME_CLIENTE&severidade=ALTA`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ ${response.data.length} palavras com filtros aplicados`, 'green');
    return true;
  } catch (error) {
    log(`✗ Erro ao filtrar: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function adicionarPalavra() {
  try {
    log('\n➕ Adicionando nova palavra de teste...', 'blue');
    const response = await axios.post(`${API_URL}/api/admin/moderacao/palavras`, {
      palavra: 'teste_crud_palavra',
      categoria: 'AMBOS',
      severidade: 'MEDIA'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    palavraId = response.data.id;
    log(`✓ Palavra adicionada com ID: ${palavraId}`, 'green');
    log(`Detalhes: palavra="${response.data.palavra}", categoria=${response.data.categoria}, severidade=${response.data.severidade}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Erro ao adicionar: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function atualizarPalavra() {
  try {
    log('\n✏️ Atualizando palavra de teste...', 'blue');
    const response = await axios.put(`${API_URL}/api/admin/moderacao/palavras/${palavraId}`, {
      palavra: 'teste_crud_atualizada',
      categoria: 'TITULO_MUSICA',
      severidade: 'ALTA'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Palavra atualizada com sucesso`, 'green');
    log(`Novos valores: palavra="${response.data.palavra}", categoria=${response.data.categoria}, severidade=${response.data.severidade}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Erro ao atualizar: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function togglePalavra() {
  try {
    log('\n🔄 Testando toggle (desativar/ativar)...', 'blue');

    // Desativar
    const response1 = await axios.post(`${API_URL}/api/admin/moderacao/palavras/${palavraId}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Toggle 1: palavra agora está ${response1.data.ativo ? 'ATIVA' : 'INATIVA'}`, 'green');

    // Ativar novamente
    const response2 = await axios.post(`${API_URL}/api/admin/moderacao/palavras/${palavraId}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Toggle 2: palavra agora está ${response2.data.ativo ? 'ATIVA' : 'INATIVA'}`, 'green');

    return true;
  } catch (error) {
    log(`✗ Erro ao toggle: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testarTexto() {
  try {
    log('\n🧪 Testando verificação de texto...', 'blue');

    // Teste 1: Texto limpo
    const response1 = await axios.post(`${API_URL}/api/admin/moderacao/testar`, {
      texto: 'João Silva quer ouvir música legal',
      categoria: 'AMBOS'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Teste texto limpo: ${response1.data.bloqueado ? 'BLOQUEADO' : 'APROVADO'}`, response1.data.bloqueado ? 'red' : 'green');

    // Teste 2: Texto com palavra proibida que acabamos de criar
    const response2 = await axios.post(`${API_URL}/api/admin/moderacao/testar`, {
      texto: 'teste_crud_atualizada é uma música',
      categoria: 'TITULO_MUSICA'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Teste com palavra proibida: ${response2.data.bloqueado ? 'BLOQUEADO' : 'APROVADO'}`, response2.data.bloqueado ? 'green' : 'red');
    if (response2.data.encontradas.length > 0) {
      log(`Palavras encontradas: ${response2.data.encontradas.map(p => p.palavra).join(', ')}`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`✗ Erro ao testar texto: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function estatisticas() {
  try {
    log('\n📊 Buscando estatísticas...', 'blue');
    const response = await axios.get(`${API_URL}/api/admin/moderacao/estatisticas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Estatísticas recuperadas:`, 'green');
    log(`  - Total de palavras: ${response.data.total}`, 'yellow');
    log(`  - Palavras ativas: ${response.data.ativos}`, 'yellow');
    log(`  - Palavras inativas: ${response.data.inativos}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Erro ao buscar estatísticas: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function deletarPalavra() {
  try {
    log('\n🗑️ Deletando palavra de teste...', 'blue');
    await axios.delete(`${API_URL}/api/admin/moderacao/palavras/${palavraId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✓ Palavra deletada com sucesso`, 'green');
    return true;
  } catch (error) {
    log(`✗ Erro ao deletar: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════════', 'blue');
  log('🚀 INICIANDO TESTES DE CRUD - MODERAÇÃO', 'blue');
  log('═══════════════════════════════════════════════', 'blue');

  const results = {
    passed: 0,
    failed: 0
  };

  // Executar testes na ordem
  const tests = [
    { name: 'Login', fn: login },
    { name: 'Listar Palavras', fn: listarPalavras },
    { name: 'Listar com Filtros', fn: listarComFiltros },
    { name: 'Adicionar Palavra', fn: adicionarPalavra },
    { name: 'Atualizar Palavra', fn: atualizarPalavra },
    { name: 'Toggle Palavra', fn: togglePalavra },
    { name: 'Testar Texto', fn: testarTexto },
    { name: 'Estatísticas', fn: estatisticas },
    { name: 'Deletar Palavra', fn: deletarPalavra },
  ];

  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay entre testes
  }

  // Resumo final
  log('\n═══════════════════════════════════════════════', 'blue');
  log('📈 RESUMO DOS TESTES', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  log(`✓ Testes aprovados: ${results.passed}`, 'green');
  log(`✗ Testes falhados: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📊 Total: ${results.passed + results.failed} testes`, 'blue');

  if (results.failed === 0) {
    log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!', 'green');
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS ACIMA.', 'red');
  }

  log('═══════════════════════════════════════════════\n', 'blue');
}

// Executar testes
runTests().catch(error => {
  log(`\n💥 Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
