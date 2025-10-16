#!/usr/bin/env node

/**
 * Script para verificar se o banco de dados precisa ser semeado
 * Executa seed-config.js apenas se a tabela de configurações estiver vazia
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    console.log('🔍 Verificando se o banco precisa ser semeado...');

    // Verificar se existem configurações no banco
    const configCount = await prisma.configuracao.count();

    if (configCount === 0) {
      console.log('📭 Banco de dados vazio. Executando seed...');

      // Executar seed-config.js
      execSync('node seed-config.js', { stdio: 'inherit', cwd: __dirname });

      console.log('✅ Seed executado com sucesso!');
    } else {
      console.log(`✅ Banco já possui dados (${configCount} configurações). Seed não necessário.`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/semear banco:', error.message);
    // Não falhar o processo, apenas registrar o erro
    console.log('⚠️ Continuando inicialização mesmo com erro no seed...');
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
