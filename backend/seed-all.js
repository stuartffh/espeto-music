#!/usr/bin/env node

/**
 * Script unificado para executar seed do sistema MULTI-TENANT SaaS
 *
 * IMPORTANTE: Este seed é para o sistema MULTI-TENANT.
 * Ele cria:
 * - 1 Super Admin
 * - 1 Estabelecimento Demo completo com Admin, TVs, Configurações, etc.
 *
 * Uso: node seed-all.js
 * ou: npm run seed
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function seedAll() {
  console.log('\n🌱 ═══════════════════════════════════════════════════════');
  console.log('   ESPETO MUSIC - Seed Multi-Tenant SaaS');
  console.log('   ═══════════════════════════════════════════════════════\n');

  try {
    // ========================================
    // SEED SAAS MULTI-TENANT
    // ========================================
    console.log('🏢 Executando seed multi-tenant SaaS...\n');

    try {
      execSync('node seed-saas.js', {
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log('\n✅ Sistema multi-tenant semeado com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro ao semear sistema:', error.message);
      throw error;
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('\n🎉 ═══════════════════════════════════════════════════════');
    console.log('   SEED COMPLETO - Sistema Multi-Tenant Pronto!');
    console.log('   ═══════════════════════════════════════════════════════');

    // Buscar estatísticas
    const [
      estabelecimentoCount,
      superAdminCount,
      adminCount,
      tvCount,
      configCount,
      moderacaoCount
    ] = await Promise.all([
      prisma.estabelecimento.count(),
      prisma.superAdmin.count(),
      prisma.admin.count(),
      prisma.tV.count(),
      prisma.configuracao.count(),
      prisma.palavraProibida.count(),
    ]);

    console.log('\n📊 Resumo do banco de dados:');
    console.log(`   ✅ Super Admins: ${superAdminCount}`);
    console.log(`   ✅ Estabelecimentos: ${estabelecimentoCount}`);
    console.log(`   ✅ Admins: ${adminCount}`);
    console.log(`   ✅ TVs: ${tvCount}`);
    console.log(`   ✅ Configurações: ${configCount}`);
    console.log(`   ✅ Palavras de moderação: ${moderacaoCount}`);

    console.log('\n💡 Acesso ao sistema MULTI-TENANT:');
    console.log('\n🏢 ESTABELECIMENTO DEMO:');
    console.log('   🌐 Cliente: http://localhost:5173/demo');
    console.log('   👤 Admin: http://localhost:5173/demo/admin/login');
    console.log('   📺 TV: http://localhost:5173/demo/tv');

    console.log('\n🔑 Credenciais Admin do Estabelecimento:');
    console.log('   Username: admin');
    console.log('   Senha: admin123');

    console.log('\n👑 SUPER ADMIN:');
    console.log('   🌐 Login: http://localhost:5173/super-admin/login');
    console.log('   Username: superadmin');
    console.log('   Senha: superadmin123');

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - URLs agora incluem o SLUG do estabelecimento (/:slug)');
    console.log('   - Cada estabelecimento tem seus próprios dados isolados');
    console.log('   - Super Admin gerencia todos os estabelecimentos');
    console.log('   - Configure credenciais do Mercado Pago no Painel Admin');
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
