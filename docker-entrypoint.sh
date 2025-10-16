#!/bin/sh
set -e

echo "🚀 Iniciando Espeto Music..."

# Executar migrações do Prisma
echo "📦 Executando migrações do banco de dados..."
cd /app/backend
npx prisma migrate deploy || echo "⚠️ Nenhuma migração pendente ou erro ao migrar"

# Gerar Prisma Client (caso não tenha sido gerado)
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Verificar e semear banco de dados se necessário
echo "🌱 Verificando se precisa semear o banco de dados..."
node auto-seed.js || echo "⚠️ Erro ao verificar/semear banco, continuando..."

# Verificar se o diretório de frontend existe
if [ -d "/app/frontend/dist" ]; then
  echo "✅ Frontend encontrado"
else
  echo "⚠️ Frontend não encontrado em /app/frontend/dist"
fi

echo "🎵 Iniciando servidor..."

# Executar comando passado como argumento
exec "$@"
