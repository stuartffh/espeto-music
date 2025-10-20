#!/usr/bin/env node

/**
 * Script unificado para executar todos os seeds na ordem correta
 *
 * Ordem de execução:
 * 1. seed-config.js - Configurações e usuário admin
 * 2. seed-moderation.js - Palavras proibidas para moderação
 *
 * Uso: node seed-all.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function seedAll() {
  console.log('\n🌱 ═══════════════════════════════════════════════════════');
  console.log('   ESPETO MUSIC - Seed Completo');
  console.log('   ═══════════════════════════════════════════════════════\n');

  try {
    // ========================================
    // 1. SEED DE CONFIGURAÇÕES
    // ========================================
    console.log('📋 [1/2] Executando seed de configurações...\n');

    try {
      execSync('node seed-config.js', {
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log('\n✅ Configurações semeadas com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro ao semear configurações:', error.message);
      throw error;
    }

    // ========================================
    // 2. SEED DE MODERAÇÃO
    // ========================================
    console.log('🛡️ [2/2] Executando seed de moderação...\n');

    try {
      execSync('node seed-moderation.js', {
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log('\n✅ Palavras de moderação semeadas com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro ao semear moderação:', error.message);
      throw error;
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('\n🎉 ═══════════════════════════════════════════════════════');
    console.log('   SEED COMPLETO - Todos os dados foram inseridos!');
    console.log('   ═══════════════════════════════════════════════════════');

    // Buscar estatísticas
    const [configCount, adminCount, moderacaoCount] = await Promise.all([
      prisma.configuracoes.count(),
      prisma.admins.count(),
      prisma.palavras_proibidas.count(),
    ]);

    console.log('\n📊 Resumo do banco de dados:');
    console.log(`   ✅ Configurações: ${configCount}`);
    console.log(`   ✅ Administradores: ${adminCount}`);
    console.log(`   ✅ Palavras de moderação: ${moderacaoCount}`);
    console.log('\n💡 Acesso ao sistema:');
    console.log('   🌐 Frontend: http://localhost:5173');
    console.log('   👤 Admin: http://localhost:5173/admin');
    console.log('   📺 Painel TV: http://localhost:5174');
    console.log('\n🔑 Credenciais de admin:');
    console.log('   Username: admin');
    console.log('   Senha: admin123');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Configure suas credenciais do Mercado Pago em:');
    console.log('   Painel Admin > Configurações');
    console.log('   ═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ═══════════════════════════════════════════════════════');
    console.error('   ERRO NO SEED - Processo interrompido');
    console.error('   ═══════════════════════════════════════════════════════\n');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAll();
}

module.exports = seedAll;
