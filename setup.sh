#!/bin/bash

echo "🎵 ═══════════════════════════════════════════════════════"
echo "   ESPETO MUSIC - Setup Automático"
echo "   ═══════════════════════════════════════════════════════"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
echo ""
echo "📦 Verificando dependências..."
if ! command_exists node; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "   Instale em: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

if ! command_exists npm; then
    echo -e "${RED}❌ npm não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Verificar se .env foi configurado
echo ""
echo "🔐 Verificando configurações..."
if grep -q "your_mercadopago_access_token_here" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Configure suas credenciais no backend/.env${NC}"
    echo "   - MERCADOPAGO_ACCESS_TOKEN"
    echo "   - MERCADOPAGO_PUBLIC_KEY"
    echo "   - YOUTUBE_API_KEY"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Instalar Backend
echo ""
echo "📦 Instalando dependências do Backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências do backend${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend - dependências instaladas${NC}"

# Gerar Prisma Client
echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao gerar Prisma Client${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma Client gerado${NC}"

# Criar banco de dados
echo ""
echo "💾 Criando banco de dados..."
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Erro ao criar migrations (pode ser normal se já existir)${NC}"
fi

# Seed
echo ""
echo "🌱 Populando banco de dados..."
npm run seed
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao executar seed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Banco de dados populado${NC}"

cd ..

# Instalar Frontend Cliente
echo ""
echo "📦 Instalando dependências do Frontend Cliente..."
cd frontend-cliente
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências do frontend-cliente${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend Cliente - dependências instaladas${NC}"
cd ..

# Instalar Frontend TV
echo ""
echo "📦 Instalando dependências do Frontend TV..."
cd frontend-tv
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências do frontend-tv${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend TV - dependências instaladas${NC}"
cd ..

# Finalização
echo ""
echo "🎉 ═══════════════════════════════════════════════════════"
echo -e "${GREEN}   Setup concluído com sucesso!${NC}"
echo "   ═══════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure as credenciais em backend/.env"
echo "   2. Crie os arquivos React (veja CRIAR_ARQUIVOS_RESTANTES.md)"
echo "   3. Execute os servidores:"
echo ""
echo "      Terminal 1: cd backend && npm run dev"
echo "      Terminal 2: cd frontend-cliente && npm run dev"
echo "      Terminal 3: cd frontend-tv && npm run dev"
echo ""
echo "   4. Acesse:"
echo "      - Cliente: http://localhost:5173"
echo "      - TV: http://localhost:5174"
echo "      - API: http://localhost:3000"
echo ""
echo "🎵 Bora fazer música! 🚀"
