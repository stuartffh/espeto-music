# 🚀 COMANDOS RÁPIDOS - ESPETO MUSIC

## ⚡ INSTALAÇÃO RÁPIDA (5 MINUTOS)

### Windows
```bash
setup.bat
```

### Linux/Mac
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🔧 INSTALAÇÃO MANUAL

### 1. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 2. Frontend Cliente
```bash
cd frontend-cliente
npm install
```

### 3. Frontend TV
```bash
cd frontend-tv
npm install
```

---

## ▶️ EXECUTAR DESENVOLVIMENTO

### Opção 1: 3 Terminais Separados

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Cliente:**
```bash
cd frontend-cliente
npm run dev
```

**Terminal 3 - Frontend TV:**
```bash
cd frontend-tv
npm run dev
```

### Opção 2: Comandos em Sequência (Windows)
```bash
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend-cliente && npm run dev"
start cmd /k "cd frontend-tv && npm run dev"
```

### Opção 3: Comandos em Sequência (Linux/Mac)
```bash
cd backend && npm run dev &
cd frontend-cliente && npm run dev &
cd frontend-tv && npm run dev &
```

---

## 🗄️ COMANDOS PRISMA (Banco de Dados)

### Gerar Client
```bash
cd backend
npx prisma generate
```

### Criar Migration
```bash
cd backend
npx prisma migrate dev --name nome_da_migration
```

### Aplicar Migrations (Produção)
```bash
cd backend
npx prisma migrate deploy
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

### Seed (Popular Banco)
```bash
cd backend
npm run seed
```

### Abrir Prisma Studio (Interface Visual)
```bash
cd backend
npx prisma studio
```
Abre em: http://localhost:5555

---

## 📦 BUILD PARA PRODUÇÃO

### Frontend Cliente
```bash
cd frontend-cliente
npm run build
```
Output: `frontend-cliente/dist/`

### Frontend TV
```bash
cd frontend-tv
npm run build
```
Output: `frontend-tv/dist/`

### Backend (não precisa build, já é Node.js)
```bash
cd backend
npm start
```

---

## 🧹 LIMPEZA

### Limpar node_modules
```bash
# Windows
rmdir /s /q backend\node_modules
rmdir /s /q frontend-cliente\node_modules
rmdir /s /q frontend-tv\node_modules

# Linux/Mac
rm -rf backend/node_modules
rm -rf frontend-cliente/node_modules
rm -rf frontend-tv/node_modules
```

### Limpar banco de dados
```bash
rm backend/prisma/*.db
rm backend/prisma/*.db-journal
```

### Limpar builds
```bash
# Windows
rmdir /s /q frontend-cliente\dist
rmdir /s /q frontend-tv\dist

# Linux/Mac
rm -rf frontend-cliente/dist
rm -rf frontend-tv/dist
```

---

## 🔍 VERIFICAÇÃO

### Verificar Status Backend
```bash
curl http://localhost:3000/api/health
```
Deve retornar: `{"status":"ok",...}`

### Verificar Portas em Uso
**Windows:**
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :5174
```

**Linux/Mac:**
```bash
lsof -i :3000
lsof -i :5173
lsof -i :5174
```

### Matar Processo em Porta
**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Linux/Mac:**
```bash
lsof -ti :3000 | xargs kill -9
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot find module"
```bash
cd backend && npm install
cd frontend-cliente && npm install
cd frontend-tv && npm install
```

### Erro: "Prisma Client not generated"
```bash
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

### Erro: "Port already in use"
```bash
# Matar processo (ver comandos acima)
# OU trocar porta no .env
```

### Erro: Database locked
```bash
cd backend
rm prisma/*.db-journal
```

### Reset completo do projeto
```bash
# Limpar tudo
rm -rf */node_modules
rm -rf */dist
rm backend/prisma/*.db

# Reinstalar
setup.bat  # ou ./setup.sh
```

---

## 📊 LOGS E DEBUG

### Ver logs do backend
```bash
cd backend
npm run dev
# Logs aparecem no terminal
```

### Ver logs do Prisma
```bash
cd backend
# Editar .env:
# DATABASE_URL="file:./dev.db?connection_limit=1&socket_timeout=10"
```

### Debug WebSocket
No navegador (F12 → Console):
```javascript
// Ver mensagens WebSocket
socket.onAny((event, ...args) => {
  console.log(event, args);
});
```

---

## 🌐 DEPLOY

### Backend (Railway)
```bash
cd backend
git init
git add .
git commit -m "Initial commit"
# Conectar ao Railway via dashboard
```

### Frontend (Vercel)
```bash
cd frontend-cliente
npm run build
vercel --prod
```

### Configurar variáveis de ambiente na plataforma

---

## 🔐 SEGURANÇA

### Gerar nova chave secreta
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Verificar .env não commitado
```bash
git status
# .env não deve aparecer
```

---

## 📱 TESTE LOCAL EM REDE

### Descobrir IP local
**Windows:**
```bash
ipconfig
```

**Linux/Mac:**
```bash
ifconfig
# ou
ip addr show
```

### Acessar de outro dispositivo
```
http://SEU_IP:5173  # Cliente
http://SEU_IP:5174  # TV
```

Exemplo: `http://192.168.1.10:5173`

---

## 🎯 COMANDOS ÚTEIS

### Instalar dependência nova (exemplo)
```bash
cd backend
npm install nome-do-pacote
```

### Atualizar dependências
```bash
npm update
```

### Verificar vulnerabilidades
```bash
npm audit
npm audit fix
```

### Ver versão do Node
```bash
node --version
npm --version
```

### Limpar cache npm
```bash
npm cache clean --force
```

---

## 🔧 GIT

### Iniciar repositório
```bash
git init
git add .
git commit -m "Initial commit"
```

### Adicionar remote
```bash
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

### Verificar status
```bash
git status
git log --oneline
```

---

## 📦 COMANDOS PM2 (Produção)

### Instalar PM2
```bash
npm install -g pm2
```

### Iniciar backend
```bash
cd backend
pm2 start src/server.js --name espeto-music
```

### Ver processos
```bash
pm2 list
pm2 status
```

### Logs
```bash
pm2 logs espeto-music
```

### Restart
```bash
pm2 restart espeto-music
```

### Parar
```bash
pm2 stop espeto-music
pm2 delete espeto-music
```

### Startup (iniciar com sistema)
```bash
pm2 startup
pm2 save
```

---

## 🎵 COMANDOS ESPECÍFICOS DO PROJETO

### Gerar QR Code
```bash
curl http://localhost:3000/qrcode
```

### Ver configurações do sistema
```bash
cd backend
npx prisma studio
# Ir na tabela "configuracoes"
```

### Alterar preço da música
```bash
cd backend
# Via Prisma Studio ou SQL direto:
npx prisma db execute --sql "UPDATE configuracoes SET valor = '10.00' WHERE chave = 'PRECO_MUSICA'"
```

---

## 📝 ATALHOS

### Criar arquivo .env rapidamente
```bash
cp backend/.env.example backend/.env
cp frontend-cliente/.env.example frontend-cliente/.env
cp frontend-tv/.env.example frontend-tv/.env
```

### Rodar tudo de uma vez (Linux/Mac)
```bash
#!/bin/bash
cd backend && npm run dev &
cd frontend-cliente && npm run dev &
cd frontend-tv && npm run dev &
wait
```

---

## 🆘 AJUDA RÁPIDA

```bash
# Backend não inicia?
cd backend && npm install && npx prisma generate

# Frontend não compila?
cd frontend-cliente && rm -rf node_modules && npm install

# Banco corrompido?
cd backend && npx prisma migrate reset && npm run seed

# WebSocket não conecta?
# Verificar se backend está rodando
curl http://localhost:3000/api/health
```

---

**Mantenha este arquivo aberto enquanto desenvolve!** 🚀
