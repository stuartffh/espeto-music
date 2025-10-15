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
    {
      chave: 'MODO_GRATUITO',
      valor: 'true',
      descricao: 'Sistema gratuito (sem pagamento) ou pago',
      tipo: 'boolean',
    },
    {
      chave: 'PRECO_MUSICA',
      valor: '5.00',
      descricao: 'Preço padrão por música em reais',
      tipo: 'number',
    },
    {
      chave: 'MAX_MUSICAS_FILA',
      valor: '50',
      descricao: 'Número máximo de músicas na fila',
      tipo: 'number',
    },
    {
      chave: 'TEMPO_EXPIRACAO_PAGAMENTO',
      valor: '10',
      descricao: 'Tempo de expiração do pagamento em minutos',
      tipo: 'number',
    },
    {
      chave: 'PERMITIR_MUSICAS_DUPLICADAS',
      valor: 'false',
      descricao: 'Permitir mesma música na fila',
      tipo: 'boolean',
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
    {
      chave: 'NOME_ESTABELECIMENTO',
      valor: 'Espeto Music',
      descricao: 'Nome do estabelecimento',
      tipo: 'text',
    },
    {
      chave: 'TEMPO_MAXIMO_MUSICA',
      valor: '480',
      descricao: 'Tempo máximo de duração da música em segundos (8 minutos = 480s)',
      tipo: 'number',
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
