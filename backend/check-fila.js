const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFila() {
  try {
    const fila = await prisma.pedidoMusica.findMany({
      orderBy: { criadoEm: 'asc' }
    });

    console.log('\n=== Estado da Fila ===\n');
    console.log(`Total de músicas: ${fila.length}\n`);

    if (fila.length === 0) {
      console.log('✅ Fila vazia - vídeo de descanso DEVE aparecer\n');
    } else {
      console.log('Músicas na fila:\n');
      fila.forEach((m, i) => {
        console.log(`${i + 1}. ${m.titulo} - Status: ${m.status}`);
      });
      console.log('\n⚠️  Existem músicas na fila - vídeo só aparece quando a fila estiver vazia\n');
    }

  } catch (error) {
    console.error('Erro ao verificar fila:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFila();
