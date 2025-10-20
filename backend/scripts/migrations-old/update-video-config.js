const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateVideoConfig() {
  try {
    console.log('\n🔄 Atualizando configurações do vídeo de descanso...\n');

    // Atualizar VIDEO_DESCANSO_URL
    await prisma.configuracoes.update({
      where: { chave: 'VIDEO_DESCANSO_URL' },
      data: { valor: 'https://cdn.pixabay.com/video/2023/11/18/189639-886016299_large.mp4' }
    });
    console.log('✅ VIDEO_DESCANSO_URL atualizado');

    // Atualizar VIDEO_DESCANSO_ATIVO
    await prisma.configuracoes.update({
      where: { chave: 'VIDEO_DESCANSO_ATIVO' },
      data: { valor: 'true' }
    });
    console.log('✅ VIDEO_DESCANSO_ATIVO atualizado para "true"');

    // Verificar as configurações atualizadas
    const configs = await prisma.configuracoes.findMany({
      where: {
        chave: {
          in: ['VIDEO_DESCANSO_URL', 'VIDEO_DESCANSO_ATIVO']
        }
      }
    });

    console.log('\n=== Configurações Atuais ===\n');
    configs.forEach(c => {
      console.log(`${c.chave}: "${c.valor}"`);
    });
    console.log('\n✅ Vídeo de descanso configurado e ativado com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVideoConfig();
