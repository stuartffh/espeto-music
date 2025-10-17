const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateModoGratuito() {
  try {
    console.log('🔄 Migrando configuração MODO_FILA para modo_gratuito...\n');

    // 1. Buscar configuração antiga
    const modoFila = await prisma.configuracao.findUnique({
      where: { chave: 'MODO_FILA' }
    });

    console.log('1️⃣ Configuração MODO_FILA:', modoFila);

    // 2. Buscar ou criar modo_gratuito
    let modoGratuito = await prisma.configuracao.findUnique({
      where: { chave: 'modo_gratuito' }
    });

    if (!modoGratuito) {
      // Criar baseado no MODO_FILA ou com valor padrão
      const valor = modoFila && modoFila.valor === 'gratuito' ? 'true' : 'false';

      modoGratuito = await prisma.configuracao.create({
        data: {
          chave: 'modo_gratuito',
          valor,
          descricao: 'Modo de operação: true = gratuito (sem pagamento), false = pago (requer pagamento PIX ou gift card)',
          tipo: 'boolean'
        }
      });
      console.log('2️⃣ Configuração modo_gratuito criada:', modoGratuito);
    } else {
      console.log('2️⃣ Configuração modo_gratuito já existe:', modoGratuito);
    }

    // 3. Deletar MODO_FILA se existir
    if (modoFila) {
      await prisma.configuracao.delete({
        where: { chave: 'MODO_FILA' }
      });
      console.log('3️⃣ Configuração MODO_FILA removida ✅');
    } else {
      console.log('3️⃣ MODO_FILA não encontrada (já foi removida)');
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`   modo_gratuito = "${modoGratuito.valor}"`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateModoGratuito();
