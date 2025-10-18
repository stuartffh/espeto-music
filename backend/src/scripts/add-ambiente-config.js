const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar primeiro estabelecimento
    const estabelecimento = await prisma.estabelecimentos.findFirst();

    if (!estabelecimento) {
      console.error('❌ Nenhum estabelecimento encontrado');
      return;
    }

    console.log(`📍 Usando estabelecimento: ${estabelecimento.nome} (${estabelecimento.id})`);

    // Adicionar configurações para música ambiente
    const configs = [
      {
        chave: 'MUSICA_AMBIENTE_ATIVA',
        valor: 'false',
        descricao: 'Ativar música ambiente quando não há fila',
        tipo: 'boolean'
      },
      {
        chave: 'MUSICA_AMBIENTE_YOUTUBE_ID',
        valor: '',
        descricao: 'ID do YouTube da música ambiente',
        tipo: 'text'
      },
      {
        chave: 'MUSICA_AMBIENTE_TITULO',
        valor: '',
        descricao: 'Título da música ambiente',
        tipo: 'text'
      },
      {
        chave: 'MUSICA_AMBIENTE_VOLUME',
        valor: '30',
        descricao: 'Volume da música ambiente (0-100)',
        tipo: 'number'
      }
    ];

    for (const config of configs) {
      await prisma.configuracoes.upsert({
        where: {
          estabelecimentoId_chave: {
            estabelecimentoId: estabelecimento.id,
            chave: config.chave
          }
        },
        update: {
          valor: config.valor,
          descricao: config.descricao,
          tipo: config.tipo
        },
        create: {
          id: require('crypto').randomUUID(),
          estabelecimentoId: estabelecimento.id,
          chave: config.chave,
          valor: config.valor,
          descricao: config.descricao,
          tipo: config.tipo,
          atualizadoEm: new Date()
        }
      });
      console.log(`✅ Configuração ${config.chave} adicionada/atualizada`);
    }

    console.log('✅ Configurações de música ambiente adicionadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();