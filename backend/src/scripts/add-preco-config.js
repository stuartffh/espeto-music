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

    // Adicionar configurações de preços
    const configs = [
      {
        chave: 'PRECO_MUSICA_NORMAL',
        valor: '5.00',
        descricao: 'Preço padrão de uma música',
        tipo: 'number'
      },
      {
        chave: 'PRECO_MUSICA_PRIORITARIA',
        valor: '10.00',
        descricao: 'Preço de música prioritária (toca antes na fila)',
        tipo: 'number'
      },
      {
        chave: 'PERMITIR_DEDICATORIA',
        valor: 'true',
        descricao: 'Permitir que clientes enviem dedicatórias',
        tipo: 'boolean'
      },
      {
        chave: 'TEMPO_EXIBICAO_DEDICATORIA',
        valor: '10',
        descricao: 'Tempo de exibição da dedicatória na TV (segundos)',
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

    console.log('✅ Configurações de preços adicionadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
