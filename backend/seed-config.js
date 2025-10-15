/**
 * Seed inicial das configurações do sistema
 *
 * Executa: node seed-config.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed das configurações...');

  const configuracoes = [
    {
      chave: 'PRECO_MUSICA',
      valor: '5.00',
      descricao: 'Preço de cada música em R$',
      tipo: 'number'
    },
    {
      chave: 'MAX_MUSICAS_FILA',
      valor: '50',
      descricao: 'Número máximo de músicas na fila',
      tipo: 'number'
    },
    {
      chave: 'MERCADOPAGO_PUBLIC_KEY',
      valor: '',
      descricao: 'Chave pública do MercadoPago',
      tipo: 'text'
    },
    {
      chave: 'MERCADOPAGO_ACCESS_TOKEN',
      valor: '',
      descricao: 'Token de acesso do MercadoPago',
      tipo: 'password'
    },
    {
      chave: 'PERMITIR_MUSICAS_REPETIDAS',
      valor: 'false',
      descricao: 'Permitir que a mesma música seja adicionada múltiplas vezes na fila',
      tipo: 'boolean'
    },
    {
      chave: 'MODERACAO_ATIVA',
      valor: 'true',
      descricao: 'Ativar moderação de conteúdo (bloquear palavras proibidas)',
      tipo: 'boolean'
    },
    {
      chave: 'TEMPO_EXIBICAO_QRCODE',
      valor: '300',
      descricao: 'Tempo de exibição do QR Code em segundos (0 = sem limite)',
      tipo: 'number'
    },
    {
      chave: 'MENSAGEM_BOAS_VINDAS',
      valor: 'Bem-vindo ao Espeto Music! Escolha sua música favorita.',
      descricao: 'Mensagem exibida na tela inicial do cliente',
      tipo: 'text'
    },
    {
      chave: 'COR_TEMA',
      valor: '#9333ea',
      descricao: 'Cor principal do tema (hexadecimal)',
      tipo: 'text'
    },
    {
      chave: 'YOUTUBE_API_KEY',
      valor: '',
      descricao: 'Chave da API do YouTube (opcional, para melhor busca)',
      tipo: 'password'
    },
    {
      chave: 'LIMITE_CARACTERES_PESQUISA',
      valor: '100',
      descricao: 'Limite de caracteres para busca de músicas',
      tipo: 'number'
    },
    {
      chave: 'VOLUME_PADRAO',
      valor: '80',
      descricao: 'Volume padrão do player (0-100)',
      tipo: 'number'
    }
  ];

  let criadas = 0;
  let atualizadas = 0;

  for (const config of configuracoes) {
    const existente = await prisma.configuracao.findUnique({
      where: { chave: config.chave }
    });

    if (existente) {
      console.log(`  ⚠️  Configuração "${config.chave}" já existe, pulando...`);
      atualizadas++;
    } else {
      await prisma.configuracao.create({
        data: config
      });
      console.log(`  ✅ Criada: ${config.chave}`);
      criadas++;
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`  - Criadas: ${criadas}`);
  console.log(`  - Já existiam: ${atualizadas}`);
  console.log('✨ Seed concluído!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
