#!/usr/bin/env node

/**
 * Script de seed automático para primeiro deploy
 *
 * Este script:
 * - Verifica se o banco está vazio
 * - Executa seed completo apenas se necessário
 * - É executado automaticamente em postinstall
 *
 * Uso: node auto-seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function autoSeed() {
  try {
    console.log('\n🔍 Verificando necessidade de seed automático...');

    // Verificar se o banco de dados existe (tentar ambos os caminhos)
    const dbPath1 = path.join(__dirname, '..', 'dev.db');
    const dbPath2 = path.join(__dirname, '..', 'prisma', 'dev.db');
    const dbPath3 = path.join(__dirname, '..', 'prisma', 'production.db');

    const dbExists = fs.existsSync(dbPath1) || fs.existsSync(dbPath2) || fs.existsSync(dbPath3);

    if (!dbExists) {
      console.log('📭 Banco de dados não existe nos caminhos esperados.');
      console.log('   Tentando verificar tabelas via Prisma...');

      // Tentar verificar se há tabelas mesmo sem arquivo visível
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Conexão com banco estabelecida via Prisma');
      } catch (error) {
        console.log('❌ Não foi possível conectar ao banco. Será criado nas migrações.');
        return;
      }
    }

    // Verificar se existem dados no banco
    const [configCount, adminCount] = await Promise.all([
      prisma.configuracoes.count().catch(() => 0),
      prisma.admins.count().catch(() => 0),
    ]);

    const isEmpty = configCount === 0 && adminCount === 0;

    if (isEmpty) {
      console.log('\n📭 Banco de dados vazio detectado!');
      console.log('🌱 Executando seed automático...\n');

      // Executar seed completo
      execSync('node seed-all.js', {
        stdio: 'inherit',
        cwd: __dirname
      });

      console.log('\n✅ Seed automático concluído!\n');
    } else {
      console.log('✅ Banco já possui dados:');
      console.log(`   - Configurações: ${configCount}`);
      console.log(`   - Administradores: ${adminCount}`);
      console.log('⏭️  Pulando seed automático.\n');
    }

  } catch (error) {
    console.error('⚠️  Erro ao verificar/executar seed automático:', error.message);
    console.log('⚠️  Continuando... Você pode executar manualmente com: npm run seed:all\n');
    // Não falhar o processo - apenas avisar
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  autoSeed();
}

module.exports = autoSeed;
