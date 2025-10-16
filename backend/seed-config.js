/**
 * Seed inicial das configurações do sistema e usuário admin
 *
 * Executa: node seed-config.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed das configurações e usuário admin...');

  // ========== CRIAR USUÁRIO ADMIN ==========
  const senhaAdmin = 'admin123';
  const hashSenha = await bcrypt.hash(senhaAdmin, 10);

  const adminExistente = await prisma.usuario.findUnique({
    where: { email: 'admin@espetomusic.com' }
  });

  if (adminExistente) {
    console.log('  ⚠️  Usuário admin já existe, pulando...');
  } else {
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@espetomusic.com',
        senha: hashSenha,
        role: 'ADMIN'
      }
    });
    console.log('  ✅ Usuário admin criado!');
    console.log('  📧 Email: admin@espetomusic.com');
    console.log('  🔑 Senha: admin123');
  }

  const configuracoes = [
    // ========== CONFIGURAÇÕES DE PAGAMENTO ==========
    {
      chave: 'PRECO_MUSICA',
      valor: '5.00',
      descricao: 'Preço de cada música em R$',
      tipo: 'number'
    },
    {
      chave: 'MERCADOPAGO_PUBLIC_KEY',
      valor: '',
      descricao: 'Chave pública do MercadoPago',
      tipo: 'password'
    },
    {
      chave: 'MERCADOPAGO_ACCESS_TOKEN',
      valor: '',
      descricao: 'Token de acesso do MercadoPago',
      tipo: 'password'
    },

    // ========== CONFIGURAÇÕES DA FILA ==========
    {
      chave: 'MODO_FILA',
      valor: 'gratuito',
      descricao: 'Modo de operação da fila (gratuito ou pago)',
      tipo: 'text'
    },
    {
      chave: 'MAX_MUSICAS_FILA',
      valor: '50',
      descricao: 'Número máximo de músicas na fila',
      tipo: 'number'
    },
    {
      chave: 'PERMITIR_MUSICAS_REPETIDAS',
      valor: 'false',
      descricao: 'Permitir que a mesma música seja adicionada múltiplas vezes na fila',
      tipo: 'boolean'
    },
    {
      chave: 'TEMPO_MAXIMO_ESPERA',
      valor: '8',
      descricao: 'Tempo máximo de espera em minutos por música',
      tipo: 'number'
    },
    {
      chave: 'TEMPO_MAXIMO_MUSICA',
      valor: '10',
      descricao: 'Duração máxima da música em minutos',
      tipo: 'number'
    },

    // ========== CONFIGURAÇÕES DE MODERAÇÃO ==========
    {
      chave: 'MODERACAO_ATIVA',
      valor: 'true',
      descricao: 'Ativar moderação de conteúdo (bloquear palavras proibidas)',
      tipo: 'boolean'
    },
    {
      chave: 'NIVEL_MODERACAO',
      valor: 'MEDIA',
      descricao: 'Nível de moderação (BAIXA, MEDIA, ALTA)',
      tipo: 'text'
    },
    {
      chave: 'MODERAR_NOME_CLIENTE',
      valor: 'true',
      descricao: 'Ativar moderação no nome do cliente',
      tipo: 'boolean'
    },
    {
      chave: 'MODERAR_TITULO_MUSICA',
      valor: 'true',
      descricao: 'Ativar moderação no título da música',
      tipo: 'boolean'
    },
    {
      chave: 'REJEITAR_AUTO',
      valor: 'false',
      descricao: 'Rejeitar automaticamente músicas com palavras proibidas',
      tipo: 'boolean'
    },

    // ========== CONFIGURAÇÕES DE INTERFACE ==========
    {
      chave: 'MENSAGEM_BOAS_VINDAS',
      valor: 'Bem-vindo ao Espeto Music! Escolha sua música favorita.',
      descricao: 'Mensagem exibida na tela inicial do cliente',
      tipo: 'text'
    },
    {
      chave: 'TEMPO_EXIBICAO_QRCODE',
      valor: '300',
      descricao: 'Tempo de exibição do QR Code em segundos (0 = sem limite)',
      tipo: 'number'
    },
    {
      chave: 'LIMITE_CARACTERES_PESQUISA',
      valor: '100',
      descricao: 'Limite de caracteres para busca de músicas',
      tipo: 'number'
    },

    // ========== CONFIGURAÇÕES DE PLAYER ==========
    {
      chave: 'VOLUME_PADRAO',
      valor: '80',
      descricao: 'Volume padrão do player (0-100)',
      tipo: 'number'
    },

    // ========== CONFIGURAÇÕES DE TEMA/VISUAL ==========
    {
      chave: 'COR_TEMA',
      valor: '#9333ea',
      descricao: 'Cor principal do tema (hexadecimal)',
      tipo: 'color'
    },
    {
      chave: 'LOGO_URL',
      valor: '',
      descricao: 'URL da logo do estabelecimento (ex: https://seusite.com/logo.png)',
      tipo: 'url'
    },
    {
      chave: 'FAVICON_URL',
      valor: '',
      descricao: 'URL do favicon/ícone do site (ex: https://seusite.com/favicon.ico)',
      tipo: 'url'
    },
    {
      chave: 'BACKGROUND_IMAGE_URL',
      valor: '',
      descricao: 'URL da imagem de fundo para TV (ex: https://seusite.com/bg.jpg)',
      tipo: 'url'
    },
    {
      chave: 'VIDEO_DESCANSO_URL',
      valor: 'https://cdn.pixabay.com/video/2023/11/18/189639-886016299_large.mp4',
      descricao: 'URL do vídeo de descanso para quando não houver música tocando',
      tipo: 'url'
    },
    {
      chave: 'VIDEO_DESCANSO_ATIVO',
      valor: 'true',
      descricao: 'Ativar vídeo de descanso quando não houver música tocando',
      tipo: 'boolean'
    },
    {
      chave: 'NOME_ESTABELECIMENTO',
      valor: 'Espeto Music',
      descricao: 'Nome do estabelecimento exibido no sistema',
      tipo: 'text'
    },
    {
      chave: 'SLOGAN_ESTABELECIMENTO',
      valor: 'Seu pedido, sua música!',
      descricao: 'Slogan ou frase do estabelecimento',
      tipo: 'text'
    },

    // ========== CONFIGURAÇÕES DE ANÚNCIOS ==========
    {
      chave: 'MOSTRAR_ANUNCIOS',
      valor: 'true',
      descricao: 'Exibir anúncios na TV',
      tipo: 'boolean'
    },
    {
      chave: 'INTERVALO_ANUNCIOS',
      valor: '5',
      descricao: 'Intervalo de músicas entre anúncios',
      tipo: 'number'
    },

    // ========== CONFIGURAÇÕES DE INTEGRAÇÕES ==========
    {
      chave: 'YOUTUBE_API_KEY',
      valor: '',
      descricao: 'Chave da API do YouTube (opcional, para melhor busca)',
      tipo: 'password'
    },
    {
      chave: 'WEBHOOK_URL',
      valor: '',
      descricao: 'URL do webhook para notificações externas',
      tipo: 'url'
    },

    // ========== CONFIGURAÇÕES AVANÇADAS ==========
    {
      chave: 'MODO_KIOSK',
      valor: 'false',
      descricao: 'Modo quiosque - oculta controles e navegação do navegador',
      tipo: 'boolean'
    },
    {
      chave: 'EXIBIR_PRECO_CLIENTE',
      valor: 'true',
      descricao: 'Exibir preço da música para o cliente',
      tipo: 'boolean'
    },
    {
      chave: 'EXIBIR_PRECO_FRONTEND',
      valor: 'true',
      descricao: 'Exibir preço no frontend do cliente',
      tipo: 'boolean'
    },
    {
      chave: 'ANIMACAO_TRANSICAO',
      valor: 'fade',
      descricao: 'Tipo de animação entre músicas (fade, slide, none)',
      tipo: 'select'
    },
    {
      chave: 'EXIBIR_LETRA_MUSICA',
      valor: 'false',
      descricao: 'Tentar exibir letra da música durante reprodução',
      tipo: 'boolean'
    },
    {
      chave: 'ATIVAR_LOGS_DETALHADOS',
      valor: 'false',
      descricao: 'Ativar logs detalhados no console para debugging',
      tipo: 'boolean'
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
