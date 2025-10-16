const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndCreateConfig() {
  try {
    console.log('Verificando configurações...');

    // Buscar todas as configurações
    const configs = await prisma.configuracao.findMany();
    console.log('\nConfigurações existentes:');
    console.log(JSON.stringify(configs, null, 2));

    // Verificar se modo_gratuito existe
    const modoGratuito = await prisma.configuracao.findUnique({
      where: { chave: 'modo_gratuito' }
    });

    if (!modoGratuito) {
      console.log('\n⚠️  Configuração "modo_gratuito" não encontrada!');
      console.log('Criando configuração...');

      await prisma.configuracao.create({
        data: {
          chave: 'modo_gratuito',
          valor: 'false',
          descricao: 'Define se o sistema está em modo gratuito (true) ou modo pago (false)'
        }
      });

      console.log('✅ Configuração "modo_gratuito" criada com sucesso!');
    } else {
      console.log('\n✅ Configuração "modo_gratuito" já existe:');
      console.log(JSON.stringify(modoGratuito, null, 2));
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateConfig();
