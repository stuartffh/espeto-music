/**
 * Script de Teste do Sistema de Moderação
 *
 * Testa diversos cenários:
 * 1. Palavras proibidas exatas
 * 2. Variações l33t speak
 * 3. Palavras com acentos
 * 4. Nomes de clientes proibidos
 * 5. Títulos de música proibidos
 * 6. Casos válidos que devem passar
 */

const moderationService = require('./src/services/moderationService');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

async function testarCaso(descricao, dados, deveSerBloqueado) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.magenta}📋 TESTE: ${descricao}${colors.reset}`);
  console.log(`   Nome: "${dados.nomeCliente || '(vazio)'}"`);
  console.log(`   Música: "${dados.musicaTitulo}"`);

  try {
    const resultado = await moderationService.validarPedido(dados);

    const passou = resultado.aprovado;
    const bloqueado = !resultado.aprovado;

    // Verificar se o resultado foi o esperado
    const sucesso = (deveSerBloqueado && bloqueado) || (!deveSerBloqueado && passou);

    if (sucesso) {
      if (bloqueado) {
        log('red', '🚫', `BLOQUEADO (como esperado)`);
        log('yellow', '   ➜', `Motivo: ${resultado.motivo}`);
        log('yellow', '   ➜', `Campo: ${resultado.campo}`);
        if (resultado.palavrasEncontradas.length > 0) {
          const palavras = resultado.palavrasEncontradas.map(p => `${p.palavra} (${p.severidade})`).join(', ');
          log('yellow', '   ➜', `Palavras: ${palavras}`);
        }
      } else {
        log('green', '✅', `APROVADO (como esperado)`);
      }
      return true;
    } else {
      if (bloqueado) {
        log('red', '❌', `FALHA: Bloqueado quando deveria PASSAR`);
        log('yellow', '   ➜', `Motivo: ${resultado.motivo}`);
        log('yellow', '   ➜', `Campo: ${resultado.campo}`);
      } else {
        log('red', '❌', `FALHA: Passou quando deveria ser BLOQUEADO`);
      }
      return false;
    }
  } catch (error) {
    log('red', '💥', `ERRO: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n');
  console.log(`${colors.magenta}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   TESTE DO SISTEMA DE MODERAÇÃO DE CONTEÚDO   ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════╝${colors.reset}`);

  let totalTestes = 0;
  let testesPassaram = 0;

  // ========================================
  // CATEGORIA 1: Palavrões Comuns (SEVERA)
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 1: Palavrões Comuns (SEVERA)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'Palavrão exato no título',
    { nomeCliente: 'João Silva', musicaTitulo: 'Música porra legal' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Palavrão exato no nome do cliente',
    { nomeCliente: 'caralho', musicaTitulo: 'Música Bonita' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Múltiplos palavrões',
    { nomeCliente: 'João puta', musicaTitulo: 'Música merda' },
    true
  )) testesPassaram++;

  // ========================================
  // CATEGORIA 2: L33t Speak (Variações)
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 2: L33t Speak (Variações)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'L33t speak: p0rra (0 -> o)',
    { nomeCliente: 'Cliente', musicaTitulo: 'p0rra de música' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'L33t speak: c4ralho (4 -> a)',
    { nomeCliente: 'Cliente', musicaTitulo: 'c4ralho que legal' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'L33t speak: put4 (4 -> a)',
    { nomeCliente: 'put4', musicaTitulo: 'Música Legal' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'L33t speak: merd4 (4 -> a)',
    { nomeCliente: 'João', musicaTitulo: 'merd4 de som' },
    true
  )) testesPassaram++;

  // ========================================
  // CATEGORIA 3: Acentos e Caracteres Especiais
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 3: Acentos e Caracteres${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'Com acentos: pórrá',
    { nomeCliente: 'Cliente', musicaTitulo: 'pórrá demais' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Com pontuação: p.o.r.r.a',
    { nomeCliente: 'Cliente', musicaTitulo: 'p.o.r.r.a' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Com símbolos: p@rra (@ -> a)',
    { nomeCliente: 'Cliente', musicaTitulo: 'p@rra' },
    true
  )) testesPassaram++;

  // ========================================
  // CATEGORIA 4: Ofensas (MEDIA)
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 4: Ofensas (MEDIA)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'Ofensa média: idiota',
    { nomeCliente: 'idiota', musicaTitulo: 'Música Legal' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Ofensa média: burro',
    { nomeCliente: 'João', musicaTitulo: 'burro demais' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Ofensa média: imbecil',
    { nomeCliente: 'imbecil', musicaTitulo: 'Rock Nacional' },
    true
  )) testesPassaram++;

  // ========================================
  // CATEGORIA 5: Nomes Troll (LEVE)
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 5: Nomes Troll (LEVE)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'Nome troll: teste',
    { nomeCliente: 'teste', musicaTitulo: 'Música do Brasil' },
    false // LEVE não bloqueia em nível MEDIA
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Nome troll: asdf',
    { nomeCliente: 'asdf', musicaTitulo: 'Sertanejo Universitário' },
    false // LEVE não bloqueia em nível MEDIA
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Nome troll: admin',
    { nomeCliente: 'admin', musicaTitulo: 'Pagode Raiz' },
    false // LEVE não bloqueia em nível MEDIA
  )) testesPassaram++;

  // ========================================
  // CATEGORIA 6: Casos VÁLIDOS (Devem Passar)
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 6: Casos VÁLIDOS (Devem Passar)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'Nome e música normais',
    { nomeCliente: 'João Silva', musicaTitulo: 'Evidências - Chitãozinho e Xororó' },
    false
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Música com nome composto',
    { nomeCliente: 'Maria Santos', musicaTitulo: 'Ai Se Eu Te Pego - Michel Teló' },
    false
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Nome sem sobrenome',
    { nomeCliente: 'Carlos', musicaTitulo: 'Garota de Ipanema - Tom Jobim' },
    false
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Música com números',
    { nomeCliente: 'Pedro', musicaTitulo: '1989 - Taylor Swift' },
    false
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Cliente sem nome',
    { nomeCliente: null, musicaTitulo: 'Anunciação - Alceu Valença' },
    false
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Música em inglês',
    { nomeCliente: 'Beatriz', musicaTitulo: 'Bohemian Rhapsody - Queen' },
    false
  )) testesPassaram++;

  // ========================================
  // CATEGORIA 7: Edge Cases
  // ========================================
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}   CATEGORIA 7: Edge Cases${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════${colors.reset}`);

  totalTestes++;
  if (await testarCaso(
    'Palavra proibida no meio de outra',
    { nomeCliente: 'Cliente', musicaTitulo: 'PORRANDO tudo' },
    true // Deve detectar "porra" dentro de "porrando"
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Maiúsculas e minúsculas misturadas',
    { nomeCliente: 'Cliente', musicaTitulo: 'PoRrA dEmAiS' },
    true
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'Espaços extras',
    { nomeCliente: '  João  Silva  ', musicaTitulo: '  Música  Legal  ' },
    false
  )) testesPassaram++;

  totalTestes++;
  if (await testarCaso(
    'String vazia no nome',
    { nomeCliente: '', musicaTitulo: 'Música Bonita' },
    false
  )) testesPassaram++;

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║              RESUMO DOS TESTES                 ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n   Total de testes: ${totalTestes}`);
  console.log(`   ${colors.green}✅ Passaram: ${testesPassaram}${colors.reset}`);
  console.log(`   ${colors.red}❌ Falharam: ${totalTestes - testesPassaram}${colors.reset}`);

  const porcentagem = ((testesPassaram / totalTestes) * 100).toFixed(1);
  console.log(`\n   ${colors.magenta}Taxa de sucesso: ${porcentagem}%${colors.reset}`);

  if (testesPassaram === totalTestes) {
    console.log(`\n   ${colors.green}🎉 TODOS OS TESTES PASSARAM! 🎉${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n   ${colors.red}⚠️  ALGUNS TESTES FALHARAM ⚠️${colors.reset}\n`);
    process.exit(1);
  }
}

// Executar testes
main()
  .catch((error) => {
    console.error(`\n${colors.red}💥 ERRO FATAL:${colors.reset}`, error);
    process.exit(1);
  });
