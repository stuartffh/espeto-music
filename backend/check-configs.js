const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfigs() {
  try {
    const configs = await prisma.configuracao.findMany();
    console.log('\nConfigurações encontradas:', configs.length);

    if (configs.length === 0) {
      console.log('\n⚠️  Nenhuma configuração encontrada!');
      console.log('Execute: node seed-config.js\n');
    } else {
      console.log('\nConfigurações:');
      configs.forEach(c => {
        console.log(`  - ${c.chave}: ${c.valor}`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfigs();
