const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function toggleMode() {
  await prisma.configuracao.update({
    where: { chave: 'modo_gratuito' },
    data: { valor: 'false' }
  });

  console.log('✅ Modo gratuito DESATIVADO - Músicas precisam ser pagas');
  await prisma.$disconnect();
}

toggleMode();
