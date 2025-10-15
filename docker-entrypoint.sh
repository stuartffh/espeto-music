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

# Verificar se os diretórios de frontend existem
if [ -d "/app/frontend-cliente/dist" ]; then
  echo "✅ Frontend Cliente encontrado"
else
  echo "⚠️ Frontend Cliente não encontrado em /app/frontend-cliente/dist"
fi

if [ -d "/app/frontend-tv/dist" ]; then
  echo "✅ Frontend TV encontrado"
else
  echo "⚠️ Frontend TV não encontrado em /app/frontend-tv/dist"
fi

echo "🎵 Iniciando servidor..."

# Executar comando passado como argumento
exec "$@"
