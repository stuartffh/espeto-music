const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVideoConfig() {
  try {
    const configs = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: ['VIDEO_DESCANSO_URL', 'VIDEO_DESCANSO_ATIVO']
        }
      }
    });

    console.log('\n=== Configurações do Vídeo de Descanso ===\n');
    configs.forEach(c => {
      console.log(`${c.chave}: "${c.valor}"`);
    });
    console.log('\n');

    const ativoConfig = configs.find(c => c.chave === 'VIDEO_DESCANSO_ATIVO');
    const urlConfig = configs.find(c => c.chave === 'VIDEO_DESCANSO_URL');

    if (ativoConfig?.valor !== 'true') {
      console.log('⚠️  PROBLEMA IDENTIFICADO:');
      console.log('   VIDEO_DESCANSO_ATIVO está configurado como "' + ativoConfig?.valor + '"');
      console.log('   Mas precisa estar como "true" (string) para funcionar!\n');
    }

    if (!urlConfig?.valor) {
      console.log('⚠️  VIDEO_DESCANSO_URL está vazio!\n');
    } else {
      console.log('✓ VIDEO_DESCANSO_URL está configurado\n');
    }

  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoConfig();
