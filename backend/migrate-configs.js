const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script de migração de configurações
 *
 * Este script migra o banco de dados de produção de forma segura,
 * preservando valores personalizados e adicionando novas configurações.
 *
 * EXECUTE ESTE SCRIPT EM PRODUÇÃO:
 * node migrate-configs.js
 */

async function main() {
  console.log('🔄 Iniciando migração de configurações...\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASSO 1: Converter MODO_GRATUITO → MODO_FILA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 PASSO 1: Convertendo MODO_GRATUITO para MODO_FILA');

  const modoGratuito = await prisma.configuracao.findUnique({
    where: { chave: 'MODO_GRATUITO' }
  });

  if (modoGratuito) {
    const valorAtual = modoGratuito.valor;
    const valorNovo = (valorAtual === 'true' || valorAtual === true) ? 'gratuito' : 'pago';

    console.log(`   ✓ Encontrado: MODO_GRATUITO = ${valorAtual}`);
    console.log(`   → Convertendo para: MODO_FILA = ${valorNovo}`);

    // Deletar antiga
    await prisma.configuracao.delete({
      where: { chave: 'MODO_GRATUITO' }
    });

    // Criar nova
    await prisma.configuracao.create({
      data: {
        chave: 'MODO_FILA',
        valor: valorNovo,
        descricao: 'Modo de operação da fila (gratuito ou pago)',
        tipo: 'text'
      }
    });

    console.log('   ✅ MODO_FILA criado com sucesso!\n');
  } else {
    console.log('   ⚠️  MODO_GRATUITO não encontrado (pode já ter sido migrado)\n');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASSO 2: Renomear PERMITIR_MUSICAS_DUPLICADAS → PERMITIR_DUPLICADAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 PASSO 2: Renomeando PERMITIR_MUSICAS_DUPLICADAS para PERMITIR_DUPLICADAS');

  const permitirDuplicadas = await prisma.configuracao.findUnique({
    where: { chave: 'PERMITIR_MUSICAS_DUPLICADAS' }
  });

  if (permitirDuplicadas) {
    const valorAtual = permitirDuplicadas.valor;

    console.log(`   ✓ Encontrado: PERMITIR_MUSICAS_DUPLICADAS = ${valorAtual}`);
    console.log(`   → Renomeando para: PERMITIR_DUPLICADAS`);

    // Deletar antiga
    await prisma.configuracao.delete({
      where: { chave: 'PERMITIR_MUSICAS_DUPLICADAS' }
    });

    // Criar nova
    await prisma.configuracao.create({
      data: {
        chave: 'PERMITIR_DUPLICADAS',
        valor: valorAtual,
        descricao: 'Permitir mesma música na fila',
        tipo: 'boolean'
      }
    });

    console.log('   ✅ PERMITIR_DUPLICADAS criada com sucesso!\n');
  } else {
    console.log('   ⚠️  PERMITIR_MUSICAS_DUPLICADAS não encontrado (pode já ter sido migrado)\n');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASSO 3: Adicionar novas configurações
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 PASSO 3: Adicionando novas configurações');

  const novasConfigs = [
    // 🎵 Fila e Operação
    {
      chave: 'TEMPO_MAXIMO_ESPERA',
      valor: '30',
      descricao: 'Tempo máximo de espera na fila em minutos',
      tipo: 'number',
    },

    // 🛡️ Moderação
    {
      chave: 'NIVEL_MODERACAO',
      valor: 'medio',
      descricao: 'Nível de moderação automática (leve, medio, severo, desativado)',
      tipo: 'text',
    },
    {
      chave: 'MODERAR_NOME_CLIENTE',
      valor: 'true',
      descricao: 'Ativar moderação no nome do cliente',
      tipo: 'boolean',
    },
    {
      chave: 'MODERAR_TITULO_MUSICA',
      valor: 'true',
      descricao: 'Ativar moderação no título da música',
      tipo: 'boolean',
    },
    {
      chave: 'REJEITAR_AUTO',
      valor: 'false',
      descricao: 'Rejeitar automaticamente conteúdo inapropriado',
      tipo: 'boolean',
    },

    // 🖥️ Painel TV
    {
      chave: 'VIDEO_DESCANSO_URL',
      valor: '',
      descricao: 'URL do vídeo de descanso quando a fila está vazia',
      tipo: 'url',
    },
    {
      chave: 'MOSTRAR_ANUNCIOS',
      valor: 'true',
      descricao: 'Mostrar anúncios no painel TV',
      tipo: 'boolean',
    },
    {
      chave: 'INTERVALO_ANUNCIOS',
      valor: '5',
      descricao: 'Intervalo entre anúncios em minutos',
      tipo: 'number',
    },

    // 🏢 Estabelecimento
    {
      chave: 'LOGO_URL',
      valor: '',
      descricao: 'URL da logo do estabelecimento',
      tipo: 'url',
    },
    {
      chave: 'COR_TEMA',
      valor: '#DC2626',
      descricao: 'Cor principal do tema (hexadecimal)',
      tipo: 'color',
    },

    // 📱 Interface Cliente
    {
      chave: 'EXIBIR_PRECO_FRONTEND',
      valor: 'true',
      descricao: 'Exibir preço no frontend do cliente',
      tipo: 'boolean',
    },
    {
      chave: 'MENSAGEM_BOAS_VINDAS',
      valor: 'Bem-vindo ao Espeto Music! Escolha sua música favorita.',
      descricao: 'Mensagem de boas-vindas no frontend',
      tipo: 'text',
    },

    // 🔧 Técnicas
    {
      chave: 'ATIVAR_LOGS_DETALHADOS',
      valor: 'false',
      descricao: 'Ativar logs detalhados no backend',
      tipo: 'boolean',
    },
    {
      chave: 'WEBHOOK_URL',
      valor: '',
      descricao: 'URL para receber webhooks de eventos',
      tipo: 'url',
    },
  ];

  let adicionadas = 0;
  let jaExistentes = 0;

  for (const config of novasConfigs) {
    const existe = await prisma.configuracao.findUnique({
      where: { chave: config.chave }
    });

    if (!existe) {
      await prisma.configuracao.create({ data: config });
      console.log(`   ✅ Criada: ${config.chave} = ${config.valor}`);
      adicionadas++;
    } else {
      console.log(`   ⏭️  Já existe: ${config.chave}`);
      jaExistentes++;
    }
  }

  console.log(`\n   📊 Resumo: ${adicionadas} adicionadas, ${jaExistentes} já existentes\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASSO 4: Validar e Reportar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 PASSO 4: Validando configurações finais');

  const todasConfigs = await prisma.configuracao.findMany({
    orderBy: { chave: 'asc' }
  });

  console.log(`\n   ✅ Total de configurações: ${todasConfigs.length}\n`);

  // Verificar configurações críticas
  const configsCriticas = [
    'MODO_FILA',
    'MAX_MUSICAS_FILA',
    'PRECO_MUSICA',
    'TEMPO_MAXIMO_MUSICA',
    'NIVEL_MODERACAO'
  ];

  console.log('   🔍 Verificando configurações críticas:');
  for (const chave of configsCriticas) {
    const config = todasConfigs.find(c => c.chave === chave);
    if (config) {
      console.log(`      ✓ ${chave}: ${config.valor}`);
    } else {
      console.log(`      ✗ FALTANDO: ${chave}`);
    }
  }

  console.log('\n🎉 Migração concluída com sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  IMPORTANTE: Reinicie o servidor backend para aplicar as mudanças');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    console.error('\n⚠️  A migração falhou. O banco de dados não foi alterado.');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
