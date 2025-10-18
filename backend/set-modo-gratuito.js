/**
 * Script para ativar modo gratuito
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Ativando modo gratuito...\n');

  const updated = await prisma.configuracoes.update({
    where: { chave: 'modo_gratuito' },
    data: { valor: 'true' }
  });

  console.log('✅ Modo gratuito ativado!');
  console.log('   Valor anterior: false');
  console.log('   Valor atual:', updated.valor);
  console.log('\n💚 Sistema agora está em MODO GRATUITO');
  console.log('   - Músicas tocam direto do YouTube (streaming)');
  console.log('   - Sem necessidade de pagamento');
  console.log('   - Sem download de vídeos\n');
}

main()
  .catch(e => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
