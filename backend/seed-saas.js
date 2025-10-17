/**
 * Seed para SaaS Multi-Tenant
 *
 * Cria:
 * - 1 Super Admin
 * - 1 Estabelecimento Demo
 * - 1 Admin do estabelecimento
 * - 2 TVs
 * - Configurações padrão
 * - Tema padrão
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 ═══════════════════════════════════════════════════════');
  console.log('   SEED SAAS MULTI-TENANT');
  console.log('   ═══════════════════════════════════════════════════════\n');

  // ========== 1. CRIAR SUPER ADMIN ==========
  console.log('1️⃣ Criando Super Admin...');

  const superAdminPassword = 'superadmin123';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdminExistente = await prisma.superAdmin.findUnique({
    where: { username: 'superadmin' }
  });

  let superAdmin;
  if (superAdminExistente) {
    console.log('   ⚠️  Super Admin já existe');
    superAdmin = superAdminExistente;
  } else {
    superAdmin = await prisma.superAdmin.create({
      data: {
        username: 'superadmin',
        password: superAdminHash,
        nome: 'Super Administrador',
        email: 'superadmin@espeto.com',
        ativo: true
      }
    });
    console.log('   ✅ Super Admin criado!');
    console.log('      Username: superadmin');
    console.log('      Senha: superadmin123');
  }

  // ========== 2. CRIAR ESTABELECIMENTO DEMO ==========
  console.log('\n2️⃣ Criando Estabelecimento Demo...');

  const estabelecimentoExistente = await prisma.estabelecimento.findUnique({
    where: { slug: 'demo' }
  });

  let estabelecimento;
  if (estabelecimentoExistente) {
    console.log('   ⚠️  Estabelecimento Demo já existe');
    estabelecimento = estabelecimentoExistente;
  } else {
    estabelecimento = await prisma.estabelecimento.create({
      data: {
        nome: 'Espeto Music Demo',
        slug: 'demo',
        codigo: 'DEMO001',
        email: 'demo@espeto.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Demo, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativo: true,
        plano: 'pro',
        limiteTVs: 5,
        limiteMusicasMes: 5000,
        adminNome: 'Admin Demo',
        adminEmail: 'admin@demo.com',
        adminTelefone: '(11) 98888-8888',
        observacoes: 'Estabelecimento demo criado automaticamente pelo seed'
      }
    });
    console.log('   ✅ Estabelecimento criado!');
    console.log('      Nome: Espeto Music Demo');
    console.log('      Slug: demo');
    console.log('      Código: DEMO001');
    console.log('      Plano: Pro (5 TVs, 5000 músicas/mês)');
  }

  // ========== 3. CRIAR ADMIN DO ESTABELECIMENTO ==========
  console.log('\n3️⃣ Criando Admin do Estabelecimento...');

  const adminPassword = 'admin123';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminExistente = await prisma.admin.findFirst({
    where: {
      estabelecimentoId: estabelecimento.id,
      username: 'admin'
    }
  });

  let admin;
  if (adminExistente) {
    console.log('   ⚠️  Admin já existe');
    admin = adminExistente;
  } else {
    admin = await prisma.admin.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        username: 'admin',
        password: adminHash,
        nome: 'Administrador Demo',
        email: 'admin@demo.com',
        ativo: true
      }
    });
    console.log('   ✅ Admin criado!');
    console.log('      Username: admin');
    console.log('      Senha: admin123');
    console.log('      Estabelecimento: demo');
  }

  // ========== 4. CRIAR TVs ==========
  console.log('\n4️⃣ Criando TVs...');

  const tvsExistentes = await prisma.tV.findMany({
    where: { estabelecimentoId: estabelecimento.id }
  });

  if (tvsExistentes.length > 0) {
    console.log(`   ⚠️  ${tvsExistentes.length} TV(s) já existem`);
    tvsExistentes.forEach(tv => {
      console.log(`      - ${tv.nome}: ${tv.codigo}`);
    });
  } else {
    const tv1 = await prisma.tV.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        nome: 'TV Salão Principal',
        codigo: crypto.randomUUID().substring(0, 8).toUpperCase(),
        ativo: true,
        observacoes: 'TV principal do estabelecimento'
      }
    });

    const tv2 = await prisma.tV.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        nome: 'TV Área Externa',
        codigo: crypto.randomUUID().substring(0, 8).toUpperCase(),
        ativo: true,
        observacoes: 'TV da área externa'
      }
    });

    console.log('   ✅ TVs criadas!');
    console.log(`      - ${tv1.nome}: ${tv1.codigo}`);
    console.log(`      - ${tv2.nome}: ${tv2.codigo}`);
  }

  // ========== 5. CRIAR CONFIGURAÇÕES PADRÃO ==========
  console.log('\n5️⃣ Criando Configurações Padrão...');

  const configuracoes = [
    // Pagamento
    { chave: 'PRECO_MUSICA', valor: '5.00', descricao: 'Preço de cada música em R$', tipo: 'number' },
    { chave: 'MERCADOPAGO_PUBLIC_KEY', valor: '', descricao: 'Chave pública do MercadoPago', tipo: 'password' },
    { chave: 'MERCADOPAGO_ACCESS_TOKEN', valor: '', descricao: 'Token de acesso do MercadoPago', tipo: 'password' },

    // Fila
    { chave: 'modo_gratuito', valor: 'false', descricao: 'Modo gratuito (sem pagamento)', tipo: 'boolean' },
    { chave: 'MAX_MUSICAS_FILA', valor: '50', descricao: 'Máximo de músicas na fila', tipo: 'number' },
    { chave: 'PERMITIR_MUSICAS_REPETIDAS', valor: 'false', descricao: 'Permitir músicas duplicadas', tipo: 'boolean' },
    { chave: 'TEMPO_MAXIMO_ESPERA', valor: '8', descricao: 'Tempo máximo de espera (minutos)', tipo: 'number' },
    { chave: 'TEMPO_MAXIMO_MUSICA', valor: '10', descricao: 'Duração máxima da música (minutos)', tipo: 'number' },

    // Moderação
    { chave: 'MODERACAO_ATIVA', valor: 'true', descricao: 'Ativar moderação de conteúdo', tipo: 'boolean' },
    { chave: 'NIVEL_MODERACAO', valor: 'MEDIA', descricao: 'Nível de moderação (BAIXA, MEDIA, ALTA)', tipo: 'text' },
    { chave: 'MODERAR_NOME_CLIENTE', valor: 'true', descricao: 'Moderar nome do cliente', tipo: 'boolean' },
    { chave: 'MODERAR_TITULO_MUSICA', valor: 'true', descricao: 'Moderar título da música', tipo: 'boolean' },
    { chave: 'REJEITAR_AUTO', valor: 'false', descricao: 'Rejeitar automaticamente', tipo: 'boolean' },

    // Interface
    { chave: 'MENSAGEM_BOAS_VINDAS', valor: 'Bem-vindo ao Espeto Music! Escolha sua música favorita.', descricao: 'Mensagem de boas-vindas', tipo: 'text' },
    { chave: 'TEMPO_EXIBICAO_QRCODE', valor: '300', descricao: 'Tempo de exibição do QR Code (segundos)', tipo: 'number' },
    { chave: 'LIMITE_CARACTERES_PESQUISA', valor: '100', descricao: 'Limite de caracteres para busca', tipo: 'number' },
    { chave: 'SEARCH_FILTER_KEYWORD', valor: 'musica', descricao: 'Palavra-chave do filtro de busca', tipo: 'text' },

    // Player
    { chave: 'VOLUME_PADRAO', valor: '80', descricao: 'Volume padrão (0-100)', tipo: 'number' },

    // Tema/Visual
    { chave: 'COR_TEMA', valor: '#9333ea', descricao: 'Cor principal do tema', tipo: 'color' },
    { chave: 'LOGO_URL', valor: '', descricao: 'URL da logo', tipo: 'url' },
    { chave: 'FAVICON_URL', valor: '', descricao: 'URL do favicon', tipo: 'url' },
    { chave: 'BACKGROUND_IMAGE_URL', valor: '', descricao: 'URL da imagem de fundo', tipo: 'url' },
    { chave: 'VIDEO_DESCANSO_URL', valor: 'https://cdn.pixabay.com/video/2023/11/18/189639-886016299_large.mp4', descricao: 'URL do vídeo de descanso', tipo: 'url' },
    { chave: 'VIDEO_DESCANSO_ATIVO', valor: 'true', descricao: 'Ativar vídeo de descanso', tipo: 'boolean' },
    { chave: 'NOME_ESTABELECIMENTO', valor: 'Espeto Music', descricao: 'Nome do estabelecimento', tipo: 'text' },
    { chave: 'SLOGAN_ESTABELECIMENTO', valor: 'Seu pedido, sua música!', descricao: 'Slogan do estabelecimento', tipo: 'text' },

    // Anúncios
    { chave: 'MOSTRAR_ANUNCIOS', valor: 'true', descricao: 'Exibir anúncios na TV', tipo: 'boolean' },
    { chave: 'INTERVALO_ANUNCIOS', valor: '5', descricao: 'Intervalo de músicas entre anúncios', tipo: 'number' },

    // Integrações
    { chave: 'YOUTUBE_API_KEY', valor: '', descricao: 'Chave da API do YouTube', tipo: 'password' },
    { chave: 'WEBHOOK_URL', valor: '', descricao: 'URL do webhook', tipo: 'url' },

    // Avançadas
    { chave: 'MODO_KIOSK', valor: 'false', descricao: 'Modo quiosque', tipo: 'boolean' },
    { chave: 'EXIBIR_PRECO_CLIENTE', valor: 'true', descricao: 'Exibir preço para cliente', tipo: 'boolean' },
    { chave: 'EXIBIR_PRECO_FRONTEND', valor: 'true', descricao: 'Exibir preço no frontend', tipo: 'boolean' },
    { chave: 'ANIMACAO_TRANSICAO', valor: 'fade', descricao: 'Animação entre músicas', tipo: 'select' },
    { chave: 'EXIBIR_LETRA_MUSICA', valor: 'false', descricao: 'Exibir letra da música', tipo: 'boolean' },
    { chave: 'ATIVAR_LOGS_DETALHADOS', valor: 'false', descricao: 'Logs detalhados', tipo: 'boolean' }
  ];

  let criadas = 0;
  let jaExistentes = 0;

  for (const config of configuracoes) {
    const existente = await prisma.configuracao.findFirst({
      where: {
        estabelecimentoId: estabelecimento.id,
        chave: config.chave
      }
    });

    if (existente) {
      jaExistentes++;
    } else {
      await prisma.configuracao.create({
        data: {
          estabelecimentoId: estabelecimento.id,
          ...config
        }
      });
      criadas++;
    }
  }

  console.log(`   ✅ Configurações: ${criadas} criadas, ${jaExistentes} já existiam`);

  // ========== 6. CRIAR ESTADO DO PLAYER ==========
  console.log('\n6️⃣ Criando Estado do Player...');

  const estadoExistente = await prisma.estadoPlayer.findUnique({
    where: { estabelecimentoId: estabelecimento.id }
  });

  if (estadoExistente) {
    console.log('   ⚠️  Estado do Player já existe');
  } else {
    await prisma.estadoPlayer.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        status: 'stopped',
        tempoAtual: 0,
        volume: 80
      }
    });
    console.log('   ✅ Estado do Player criado!');
  }

  // ========== 7. CRIAR TEMA PADRÃO ==========
  console.log('\n7️⃣ Criando Tema Padrão...');

  const temaExistente = await prisma.tema.findUnique({
    where: { estabelecimentoId: estabelecimento.id }
  });

  if (temaExistente) {
    console.log('   ⚠️  Tema já existe');
  } else {
    await prisma.tema.create({
      data: {
        estabelecimentoId: estabelecimento.id,
        nome: 'Espeto Music Demo',
        corPrimaria: '#DC2626',
        corSecundaria: '#F97316',
        corAcento: '#FBBF24',
        corFundo: '#0F172A',
        corFundoSecundario: '#1E293B',
        corTexto: '#F8FAFC',
        corTextoSecundario: '#CBD5E1',
        fontePrimaria: 'Inter',
        fonteSecundaria: 'Poppins',
        borderRadius: '8px',
        shadowIntensity: 'medium'
      }
    });
    console.log('   ✅ Tema criado!');
  }

  // ========== RESUMO FINAL ==========
  console.log('\n\n📊 ═══════════════════════════════════════════════════════');
  console.log('   RESUMO DO SEED');
  console.log('   ═══════════════════════════════════════════════════════\n');

  console.log('🔐 SUPER ADMIN:');
  console.log('   URL: /super-admin');
  console.log('   Username: superadmin');
  console.log('   Senha: superadmin123\n');

  console.log('🏢 ESTABELECIMENTO:');
  console.log(`   Nome: ${estabelecimento.nome}`);
  console.log(`   Slug: ${estabelecimento.slug}`);
  console.log(`   Código: ${estabelecimento.codigo}`);
  console.log(`   Plano: ${estabelecimento.plano}\n`);

  console.log('👤 ADMIN DO ESTABELECIMENTO:');
  console.log(`   URL: /admin/${estabelecimento.slug}`);
  console.log('   Username: admin');
  console.log('   Senha: admin123\n');

  const tvs = await prisma.tV.findMany({
    where: { estabelecimentoId: estabelecimento.id }
  });

  console.log('📺 TVs:');
  tvs.forEach((tv, index) => {
    console.log(`   ${index + 1}. ${tv.nome}`);
    console.log(`      Código: ${tv.codigo}`);
    console.log(`      URL: /tv/${tv.codigo}\n`);
  });

  console.log('👥 CLIENTE:');
  console.log(`   URL: /${estabelecimento.slug}/cliente`);
  console.log(`   URL alternativa: /${estabelecimento.codigo}/cliente\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ Seed concluído com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ ═══════════════════════════════════════════════════════');
    console.error('   ERRO AO EXECUTAR SEED');
    console.error('   ═══════════════════════════════════════════════════════');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
