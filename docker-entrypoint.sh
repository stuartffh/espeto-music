#!/bin/sh
set -e

echo "🚀 Iniciando Espeto Music..."

# Executar migrações do Prisma
echo "📦 Executando migrações do banco de dados..."
cd /app/backend

# Tentar executar migrações
if npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log; then
  echo "✅ Migrações executadas com sucesso"
else
  echo "⚠️  Erro ou nenhuma migração pendente"
  echo "    Log das migrações:"
  cat /tmp/migrate.log
fi

# Gerar Prisma Client (caso não tenha sido gerado)
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Verificar e semear banco de dados se necessário
echo "🌱 Verificando se precisa semear o banco de dados..."
node scripts/auto-seed.js || echo "⚠️ Erro ao verificar/semear banco, continuando..."

# Verificar se o diretório de frontend existe
if [ -d "/app/frontend/dist" ]; then
  echo "✅ Frontend encontrado"
else
  echo "⚠️ Frontend não encontrado em /app/frontend/dist"
fi

echo "🎵 Iniciando servidor..."

# Executar comando passado como argumento
exec "$@"
