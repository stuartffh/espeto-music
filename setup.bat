@echo off
chcp 65001 > nul
echo.
echo 🎵 ═══════════════════════════════════════════════════════
echo    ESPETO MUSIC - Setup Automático (Windows)
echo    ═══════════════════════════════════════════════════════
echo.

:: Verificar Node.js
echo 📦 Verificando dependências...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado!
    echo    Instale em: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION%

:: Verificar credenciais
echo.
echo 🔐 Verificando configurações...
findstr /C:"your_mercadopago_access_token_here" backend\.env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  ATENÇÃO: Configure suas credenciais no backend\.env
    echo    - MERCADOPAGO_ACCESS_TOKEN
    echo    - MERCADOPAGO_PUBLIC_KEY
    echo    - YOUTUBE_API_KEY
    echo.
    set /p CONTINUE="Deseja continuar mesmo assim? (S/N): "
    if /i not "%CONTINUE%"=="S" exit /b 1
)

:: Backend
echo.
echo 📦 Instalando dependências do Backend...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)
echo ✅ Backend - dependências instaladas

:: Prisma
echo.
echo 🔧 Gerando Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)
echo ✅ Prisma Client gerado

:: Migrations
echo.
echo 💾 Criando banco de dados...
call npx prisma migrate dev --name init
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Erro ao criar migrations (pode ser normal se já existir)
)

:: Seed
echo.
echo 🌱 Populando banco de dados...
call npm run seed
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao executar seed
    pause
    exit /b 1
)
echo ✅ Banco de dados populado

cd ..

:: Frontend Cliente
echo.
echo 📦 Instalando dependências do Frontend Cliente...
cd frontend-cliente
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências do frontend-cliente
    pause
    exit /b 1
)
echo ✅ Frontend Cliente - dependências instaladas
cd ..

:: Frontend TV
echo.
echo 📦 Instalando dependências do Frontend TV...
cd frontend-tv
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências do frontend-tv
    pause
    exit /b 1
)
echo ✅ Frontend TV - dependências instaladas
cd ..

:: Finalização
echo.
echo 🎉 ═══════════════════════════════════════════════════════
echo    Setup concluído com sucesso!
echo    ═══════════════════════════════════════════════════════
echo.
echo 📋 Próximos passos:
echo    1. Configure as credenciais em backend\.env
echo    2. Crie os arquivos React (veja CRIAR_ARQUIVOS_RESTANTES.md)
echo    3. Execute os servidores:
echo.
echo       Terminal 1: cd backend ^&^& npm run dev
echo       Terminal 2: cd frontend-cliente ^&^& npm run dev
echo       Terminal 3: cd frontend-tv ^&^& npm run dev
echo.
echo    4. Acesse:
echo       - Cliente: http://localhost:5173
echo       - TV: http://localhost:5174
echo       - API: http://localhost:3000
echo.
echo 🎵 Bora fazer música! 🚀
echo.
pause
