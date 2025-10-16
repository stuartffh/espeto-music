const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.pedidoMusica.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.configuracao.deleteMany();

  console.log('✅ Dados antigos removidos');

  // Criar admin padrão
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      password: senhaHash,
      nome: 'Administrador',
      ativo: true,
    },
  });
  console.log('✅ Admin criado - Username: admin | Senha: admin123');

  // Criar configurações padrão
  const configs = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 CONFIGURAÇÕES DE FILA E OPERAÇÃO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      chave: 'MODO_FILA',
      valor: 'gratuito',
      descricao: 'Modo de operação da fila (gratuito ou pago)',
      tipo: 'text',
    },
    {
      chave: 'MAX_MUSICAS_FILA',
      valor: '50',
      descricao: 'Número máximo de músicas na fila',
      tipo: 'number',
    },
    {
      chave: 'PERMITIR_DUPLICADAS',
      valor: 'false',
      descricao: 'Permitir mesma música na fila',
      tipo: 'boolean',
    },
    {
      chave: 'TEMPO_MAXIMO_MUSICA',
      valor: '480',
      descricao: 'Tempo máximo de duração da música em segundos (8 minutos = 480s)',
      tipo: 'number',
    },
    {
      chave: 'TEMPO_MAXIMO_ESPERA',
      valor: '30',
      descricao: 'Tempo máximo de espera na fila em minutos',
      tipo: 'number',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💰 CONFIGURAÇÕES DE PAGAMENTO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      chave: 'PRECO_MUSICA',
      valor: '5.00',
      descricao: 'Preço padrão por música em reais',
      tipo: 'number',
    },
    {
      chave: 'TEMPO_EXPIRACAO_PAGAMENTO',
      valor: '10',
      descricao: 'Tempo de expiração do pagamento em minutos',
      tipo: 'number',
    },
    {
      chave: 'MERCADOPAGO_ACCESS_TOKEN',
      valor: '',
      descricao: 'Token de acesso do Mercado Pago',
      tipo: 'password',
    },
    {
      chave: 'MERCADOPAGO_PUBLIC_KEY',
      valor: '',
      descricao: 'Chave pública do Mercado Pago',
      tipo: 'text',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛡️ CONFIGURAÇÕES DE MODERAÇÃO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖥️ CONFIGURAÇÕES DE PAINEL TV
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏢 CONFIGURAÇÕES DE ESTABELECIMENTO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      chave: 'NOME_ESTABELECIMENTO',
      valor: 'Espeto Music',
      descricao: 'Nome do estabelecimento',
      tipo: 'text',
    },
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📱 CONFIGURAÇÕES DE INTERFACE CLIENTE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔧 CONFIGURAÇÕES TÉCNICAS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  for (const config of configs) {
    await prisma.configuracao.create({ data: config });
    console.log(`✅ Configuração criada: ${config.chave} = ${config.valor}`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Sistema configurado:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Acesso cliente: http://localhost:5173');
  console.log('Painel TV: http://localhost:5174');
  console.log('Gerar QR Code: http://localhost:3000/qrcode');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
