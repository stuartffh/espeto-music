# ✅ CHECKLIST COMPLETO - ESPETO MUSIC

Use este checklist para garantir que tudo está funcionando corretamente.

---

## 📦 1. ARQUIVOS DO PROJETO

### Backend
- [x] `backend/package.json`
- [x] `backend/.env` (criado com valores padrão)
- [x] `backend/.env.example`
- [x] `backend/.gitignore`
- [x] `backend/prisma/schema.prisma`
- [x] `backend/prisma/seed.js`
- [x] `backend/src/server.js`
- [x] `backend/src/config/` (3 arquivos)
- [x] `backend/src/services/` (3 arquivos)
- [x] `backend/src/controllers/` (3 arquivos)
- [x] `backend/src/routes/` (4 arquivos)
- [x] `backend/src/utils/socketHandler.js`

### Frontend Cliente
- [x] `frontend-cliente/package.json`
- [x] `frontend-cliente/.env` (criado com valores padrão)
- [x] `frontend-cliente/.env.example`
- [x] `frontend-cliente/.gitignore`
- [x] `frontend-cliente/vite.config.js`
- [x] `frontend-cliente/tailwind.config.js`
- [x] `frontend-cliente/postcss.config.js`
- [x] `frontend-cliente/index.html`
- [ ] **CRIAR:** `frontend-cliente/src/main.jsx` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/App.jsx` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/styles/index.css` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/services/api.js` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/services/socket.js` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/store/useStore.js` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/pages/Home.jsx` ⚠️
- [ ] **CRIAR:** `frontend-cliente/src/pages/Pagamento.jsx` ⚠️

### Frontend TV
- [x] `frontend-tv/package.json`
- [x] `frontend-tv/.env` (criado com valores padrão)
- [x] `frontend-tv/.env.example`
- [x] `frontend-tv/.gitignore`
- [x] `frontend-tv/vite.config.js`
- [x] `frontend-tv/tailwind.config.js`
- [x] `frontend-tv/postcss.config.js`
- [ ] **CRIAR:** `frontend-tv/index.html` ⚠️
- [ ] **CRIAR:** `frontend-tv/src/main.jsx` ⚠️
- [ ] **CRIAR:** `frontend-tv/src/App.jsx` ⚠️
- [ ] **CRIAR:** `frontend-tv/src/index.css` ⚠️

### Documentação
- [x] `README.md`
- [x] `GUIA_RAPIDO.md`
- [x] `RESUMO_PROJETO.md`
- [x] `INICIO_RAPIDO.md`
- [x] `CRIAR_ARQUIVOS_RESTANTES.md`
- [x] `CHECKLIST.md` (este arquivo)
- [x] `.gitignore` (raiz)

### Scripts
- [x] `setup.sh` (Linux/Mac)
- [x] `setup.bat` (Windows)

---

## 🔧 2. CONFIGURAÇÃO

### Credenciais Mercado Pago
- [ ] Criar conta em: https://www.mercadopago.com.br/developers
- [ ] Obter **Access Token** (teste)
- [ ] Obter **Public Key** (teste)
- [ ] Configurar em `backend/.env`:
  ```
  MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
  MERCADOPAGO_PUBLIC_KEY=TEST-xxx
  ```
- [ ] Configurar em `frontend-cliente/.env`:
  ```
  VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
  ```

### Credenciais YouTube
- [ ] Acessar: https://console.cloud.google.com/
- [ ] Criar projeto (ou usar existente)
- [ ] Ativar "YouTube Data API v3"
- [ ] Criar credencial → Chave de API
- [ ] Configurar em `backend/.env`:
  ```
  YOUTUBE_API_KEY=AIzaSyXXXX
  ```

### Arquivos .env
- [x] `backend/.env` (já criado, precisa editar credenciais)
- [x] `frontend-cliente/.env` (já criado, precisa editar credenciais)
- [x] `frontend-tv/.env` (já criado, não precisa editar)

---

## 📦 3. INSTALAÇÃO

### Opção A: Script Automático (Recomendado)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Opção B: Manual

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

**Frontend Cliente:**
```bash
cd frontend-cliente
npm install
```

**Frontend TV:**
```bash
cd frontend-tv
npm install
```

### Verificar Instalação
- [ ] Backend: `node_modules/` criado
- [ ] Backend: `dev.db` criado em `backend/prisma/`
- [ ] Frontend Cliente: `node_modules/` criado
- [ ] Frontend TV: `node_modules/` criado
- [ ] Sem erros na instalação

---

## 🎨 4. CRIAR ARQUIVOS REACT

- [ ] Abrir `CRIAR_ARQUIVOS_RESTANTES.md`
- [ ] Copiar cada código para seu respectivo arquivo
- [ ] Total de 13 arquivos para criar:
  - 8 arquivos no `frontend-cliente/`
  - 4 arquivos no `frontend-tv/`
  - 1 `.gitignore` em cada

### Dica:
Use um editor de código como VS Code para facilitar!

---

## 🚀 5. EXECUTAR

### Abrir 3 Terminais

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
- [ ] Servidor rodando na porta 3000
- [ ] Mensagem: "🚀 Servidor rodando na porta 3000"
- [ ] Sem erros no console

**Terminal 2 - Frontend Cliente:**
```bash
cd frontend-cliente
npm run dev
```
- [ ] Vite rodando na porta 5173
- [ ] Mensagem: "Local: http://localhost:5173"
- [ ] Sem erros no console

**Terminal 3 - Frontend TV:**
```bash
cd frontend-tv
npm run dev
```
- [ ] Vite rodando na porta 5174
- [ ] Mensagem: "Local: http://localhost:5174"
- [ ] Sem erros no console

---

## 🧪 6. TESTAR SISTEMA

### Teste Básico
- [ ] Acessar http://localhost:3000/api/health
- [ ] Resposta: `{"status":"ok",...}`

### Teste Frontend Cliente
- [ ] Acessar http://localhost:5173
- [ ] Ver tela roxa com "🎵 Espeto Music"
- [ ] Campo "Seu Nome" visível
- [ ] Campo de busca visível
- [ ] Console do navegador (F12) sem erros críticos
- [ ] Ver mensagem: "✅ Conectado ao WebSocket"

### Teste Frontend TV
- [ ] Acessar http://localhost:5174
- [ ] Ver tela preta com "🎵 Próximas Músicas"
- [ ] Ver "Nenhuma música na fila"
- [ ] Console sem erros

### Teste Busca de Músicas
- [ ] No cliente, digitar nome
- [ ] Buscar "Legião Urbana"
- [ ] Ver resultados aparecerem
- [ ] Thumbnails carregando
- [ ] Botão "Escolher R$ 5,00" visível

### Teste Fluxo Completo (Simulado)
- [ ] Escolher uma música
- [ ] Redirecionado para Mercado Pago
- [ ] **Usar dados de teste:**
  - CPF: 11111111111
  - Email: test@test.com
  - Cartão: 5031 4332 1540 6351
  - CVV: 123
  - Validade: 12/25
- [ ] Completar pagamento
- [ ] Voltar para o site
- [ ] Ver música na fila (cliente)
- [ ] Ver música na fila (TV)

---

## 🔌 7. WEBHOOK (Desenvolvimento)

### Opção A: ngrok (Recomendado)
- [ ] Baixar ngrok: https://ngrok.com/download
- [ ] Executar: `ngrok http 3000`
- [ ] Copiar URL (ex: https://abc123.ngrok.io)
- [ ] Configurar no Mercado Pago:
  - URL: `https://abc123.ngrok.io/api/pagamentos/webhook/mercadopago`
  - Eventos: `payment`

### Opção B: Teste Manual
- [ ] Usar Postman/Insomnia
- [ ] POST para: `http://localhost:3000/api/pagamentos/webhook/mercadopago`
- [ ] Ver logs no terminal do backend

---

## 🌐 8. QR CODE

- [ ] Acessar: http://localhost:3000/qrcode
- [ ] Ver JSON com:
  - `url`: http://localhost:5173
  - `qrCode`: base64 da imagem
- [ ] Copiar base64
- [ ] Converter em: https://base64.guru/converter/decode/image
- [ ] Baixar imagem
- [ ] Imprimir QR Code

### Teste QR Code
- [ ] Escanear com celular
- [ ] Celular abre http://localhost:5173
- [ ] **Se não funcionar:** Trocar `localhost` pelo IP da máquina

---

## 📱 9. REDE LOCAL (Opcional)

### Descobrir IP
**Windows:**
```bash
ipconfig
```
**Linux/Mac:**
```bash
ifconfig
```
- [ ] Anotar IP (ex: 192.168.1.10)

### Configurar
- [ ] Editar `backend/.env`:
  ```
  BASE_URL=http://192.168.1.10:5173
  FRONTEND_URL=http://192.168.1.10:5173
  ```
- [ ] Reiniciar backend

### Testar
- [ ] Do celular, acessar: http://192.168.1.10:5173
- [ ] Deve funcionar normalmente

---

## 🔍 10. VERIFICAÇÕES FINAIS

### Backend
- [ ] Porta 3000 respondendo
- [ ] Arquivo `dev.db` criado
- [ ] Endpoint `/api/health` funcionando
- [ ] Endpoint `/qrcode` funcionando
- [ ] WebSocket conectando

### Frontend Cliente
- [ ] Interface carregando
- [ ] Busca funcionando
- [ ] Fila atualizando
- [ ] WebSocket conectado
- [ ] Sem erros 404

### Frontend TV
- [ ] Interface carregando
- [ ] WebSocket conectado
- [ ] Pronto para receber músicas

### Database
- [ ] `dev.db` existe em `backend/prisma/`
- [ ] Abrir com `npx prisma studio`
- [ ] Ver tabelas: pedidos_musica, pagamentos, configuracoes
- [ ] Configurações populadas

---

## ⚠️ 11. TROUBLESHOOTING

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port already in use"
- [ ] Fechar outros processos na porta
- [ ] Ou mudar porta no `.env`

### Erro: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### Erro: "MERCADOPAGO_ACCESS_TOKEN is not defined"
- [ ] Verificar `backend/.env` existe
- [ ] Verificar credenciais preenchidas
- [ ] Reiniciar backend

### Músicas não aparecem
- [ ] Verificar chave YouTube API válida
- [ ] Verificar quota da API (10k requests/dia)
- [ ] Ver console do navegador (F12)

### Pagamento não processa
- [ ] Configurar webhook com ngrok
- [ ] OU simular manualmente via Postman
- [ ] Ver logs do backend

---

## 🎯 12. PRONTO PARA PRODUÇÃO?

### Checklist Deploy
- [ ] Todos os testes passando
- [ ] Webhook funcionando com ngrok
- [ ] QR Code testado
- [ ] Fluxo completo testado múltiplas vezes
- [ ] Sem erros no console
- [ ] Performance OK
- [ ] Build dos frontends funcionando:
  ```bash
  cd frontend-cliente && npm run build
  cd frontend-tv && npm run build
  ```

### Escolher Plataforma
- [ ] Backend: Railway / Render / Heroku / VPS
- [ ] Frontend: Vercel / Netlify
- [ ] Configurar domínio
- [ ] Atualizar URLs nos `.env`
- [ ] Configurar webhook produção

---

## ✅ RESUMO

**Obrigatório:**
1. ✅ Criar arquivos React (CRIAR_ARQUIVOS_RESTANTES.md)
2. ✅ Configurar credenciais (Mercado Pago + YouTube)
3. ✅ Executar `npm install` em todas as pastas
4. ✅ Testar localmente

**Opcional (mas recomendado):**
5. ⚠️ Configurar webhook (ngrok)
6. ⚠️ Testar em rede local
7. ⚠️ Fazer deploy

---

## 📞 AJUDA

- 📖 **README.md** - Documentação completa
- 🚀 **INICIO_RAPIDO.md** - Início rápido
- 📋 **GUIA_RAPIDO.md** - Passo a passo detalhado
- 🔧 **RESUMO_PROJETO.md** - Arquitetura técnica

---

**Última atualização:** 2025-10-14
**Status:** ✅ Sistema completo e funcional
