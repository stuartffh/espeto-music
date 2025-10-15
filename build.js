const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n🏗️  ═══════════════════════════════════════════════════════');
console.log('   ESPETO MUSIC - Build Unificado');
console.log('   ═══════════════════════════════════════════════════════\n');

const frontends = [
  { name: 'Frontend Cliente', dir: 'frontend-cliente' },
  { name: 'Frontend TV', dir: 'frontend-tv' },
];

for (const frontend of frontends) {
  console.log(`📦 Fazendo build do ${frontend.name}...`);

  try {
    const frontendPath = path.join(__dirname, frontend.dir);

    // Verificar se o diretório existe
    if (!fs.existsSync(frontendPath)) {
      console.log(`⚠️  ${frontend.name} não encontrado em ${frontendPath}`);
      continue;
    }

    // Executar build
    execSync('npm run build', {
      cwd: frontendPath,
      stdio: 'inherit',
    });

    console.log(`✅ ${frontend.name} buildado com sucesso!\n`);
  } catch (error) {
    console.error(`❌ Erro ao buildar ${frontend.name}:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 Build unificado concluído com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('   1. Execute "npm start" no diretório backend');
console.log('   2. Acesse http://localhost:3000 (Frontend Cliente)');
console.log('   3. Acesse http://localhost:3000/tv (Frontend TV)');
console.log('   4. API disponível em http://localhost:3000/api\n');
