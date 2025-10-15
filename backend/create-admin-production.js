const bcrypt = require('bcrypt');

/**
 * Script para criar usuário admin diretamente no banco de produção
 *
 * IMPORTANTE: Este script deve ser executado no servidor de produção via SSH
 * ou você pode adaptar para fazer uma chamada direta ao banco de dados
 */

const PRODUCTION_DB_PATH = './prisma/dev.db'; // Ajustar para o caminho correto em produção

async function createAdminUser() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('🔐 Criando usuário admin...');

    // Hash da senha
    const senhaHash = await bcrypt.hash('admin123', 10);

    // Verificar se já existe
    const existing = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });

    if (existing) {
      console.log('⚠️  Admin já existe, atualizando senha...');
      await prisma.admin.update({
        where: { username: 'admin' },
        data: {
          password: senhaHash,
          ativo: true,
        }
      });
      console.log('✅ Senha do admin atualizada!');
    } else {
      await prisma.admin.create({
        data: {
          username: 'admin',
          password: senhaHash,
          nome: 'Administrador',
          ativo: true,
        }
      });
      console.log('✅ Admin criado com sucesso!');
    }

    console.log('\n📋 Credenciais:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin');
    console.log('Senha: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
