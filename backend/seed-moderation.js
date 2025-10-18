/**
 * Script para popular banco de dados com sistema de moderação
 *
 * Execução: node seed-moderation.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de palavras proibidas básicas em PT-BR
const palavrasProibidas = [
  // Palavrões comuns - SEVERA
  { palavra: 'porra', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'caralho', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'puta', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'foder', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'fdp', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'merda', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'cu', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'buceta', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'pinto', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'pau', categoria: 'AMBOS', severidade: 'MEDIA' }, // pode ser nome também

  // Ofensas - MEDIA
  { palavra: 'idiota', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'burro', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'imbecil', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'otario', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'estupido', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'corno', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'viado', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'bicha', categoria: 'AMBOS', severidade: 'SEVERA' },

  // Termos vulgares - MEDIA
  { palavra: 'bosta', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'cacete', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'droga', categoria: 'AMBOS', severidade: 'LEVE' },
  { palavra: 'inferno', categoria: 'AMBOS', severidade: 'LEVE' },
  { palavra: 'diabo', categoria: 'AMBOS', severidade: 'LEVE' },

  // Variações com números e símbolos (l33t speak)
  { palavra: 'p0rra', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'c4ralho', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'put4', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'f0der', categoria: 'AMBOS', severidade: 'SEVERA' },
  { palavra: 'merd4', categoria: 'AMBOS', severidade: 'SEVERA' },

  // Nomes comuns troll - LEVE
  { palavra: 'teste', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
  { palavra: 'asdf', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
  { palavra: 'qwerty', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
  { palavra: 'admin', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
  { palavra: 'root', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
  { palavra: 'null', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
  { palavra: 'undefined', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },

  // Spam patterns - MEDIA
  { palavra: 'aaaa', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: 'zzzz', categoria: 'AMBOS', severidade: 'MEDIA' },
  { palavra: '1234', categoria: 'NOME_CLIENTE', severidade: 'LEVE' },
];

async function main() {
  console.log('🌱 Iniciando seed do sistema de moderação...\n');

  try {
    // 1. Adicionar configurações de moderação
    console.log('📝 Adicionando configurações de moderação...');

    const configs = [
      {
        chave: 'MODERACAO_ATIVA',
        valor: 'true',
        descricao: 'Ativa/desativa o sistema de moderação de conteúdo',
        tipo: 'boolean'
      },
      {
        chave: 'NIVEL_MODERACAO',
        valor: 'MEDIA',
        descricao: 'Nível de moderação: LEVE, MEDIA ou SEVERA',
        tipo: 'text'
      }
    ];

    for (const config of configs) {
      await prisma.configuracoes.upsert({
        where: { chave: config.chave },
        update: config,
        create: config,
      });
      console.log(`   ✅ ${config.chave}: ${config.valor}`);
    }

    // 2. Adicionar palavras proibidas
    console.log(`\n📚 Adicionando ${palavrasProibidas.length} palavras proibidas...`);

    let adicionadas = 0;
    let jaExistentes = 0;

    for (const palavra of palavrasProibidas) {
      try {
        await prisma.palavras_proibidas.create({
          data: palavra,
        });
        adicionadas++;
      } catch (error) {
        // Palavra já existe, ignora
        jaExistentes++;
      }
    }

    console.log(`   ✅ ${adicionadas} palavras adicionadas`);
    if (jaExistentes > 0) {
      console.log(`   ℹ️  ${jaExistentes} palavras já existiam`);
    }

    // 3. Estatísticas
    console.log('\n📊 Estatísticas do sistema de moderação:');

    const totalPalavras = await prisma.palavras_proibidas.count();
    const palavrasPorSeveridade = await prisma.$queryRaw`
      SELECT severidade, COUNT(*) as total
      FROM palavras_proibidas
      WHERE ativo = 1
      GROUP BY severidade
    `;

    console.log(`   Total de palavras ativas: ${totalPalavras}`);
    for (const stat of palavrasPorSeveridade) {
      console.log(`   - ${stat.severidade}: ${stat.total} palavras`);
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n💡 Dicas:');
    console.log('   - Moderação está ATIVA por padrão');
    console.log('   - Nível configurado: MEDIA');
    console.log('   - Para desativar: altere MODERACAO_ATIVA para "false" no painel admin');
    console.log('   - Para ajustar nível: altere NIVEL_MODERACAO (LEVE/MEDIA/SEVERA)');

  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
