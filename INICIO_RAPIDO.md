# ⚡ INÍCIO RÁPIDO - 5 MINUTOS

## 🎯 O QUE VOCÊ TEM AGORA

✅ **Backend 100% completo e funcional**
✅ **Frontend configurado (package.json, vite, tailwind)**
⚠️ **Faltam apenas os arquivos React (.jsx)**

---

## 🚀 PASSO A PASSO

### 1️⃣ COPIAR CÓDIGOS REACT (2 minutos)

Abra o arquivo `CRIAR_ARQUIVOS_RESTANTES.md` e copie os códigos para os arquivos abaixo:

#### Frontend Cliente (9 arquivos):
```
frontend-cliente/
├── index.html                 ← COPIAR código
├── src/
│   ├── main.jsx              ← COPIAR código
│   ├── App.jsx               ← COPIAR código
│   ├── styles/
│   │   └── index.css         ← COPIAR código
│   ├── services/
│   │   ├── api.js            ← COPIAR código
│   │   └── socket.js         ← COPIAR código
│   ├── store/
│   │   └── useStore.js       ← COPIAR código
│   └── pages/
│       ├── Home.jsx          ← COPIAR código
│       └── Pagamento.jsx     ← COPIAR código
└── .gitignore                ← COPIAR código
```

#### Frontend TV (5 arquivos):
```
frontend-tv/
├── index.html                 ← COPIAR código
├── src/
│   ├── main.jsx              ← COPIAR código
│   ├── App.jsx               ← COPIAR código
│   └── index.css             ← COPIAR código
└── .gitignore                ← COPIAR código
```

**DICA:** Use um editor de código (VS Code) para facilitar!

---

### 2️⃣ CONFIGURAR CREDENCIAIS (2 minutos)

#### A) Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login
3. Vá em "Suas credenciais"
4. Copie:
   - **Access Token**
   - **Public Key**

#### B) YouTube API

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use existente)
3. Ative "YouTube Data API v3"
4. Crie uma "Chave de API"
5. Copie a chave

#### C) Configurar Backend
```bash
cd backend
cp .env.example .env
```

Edite `backend/.env`:
```env
MERCADOPAGO_ACCESS_TOKEN=cole_seu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=cole_sua_public_key_aqui
YOUTUBE_API_KEY=cole_sua_youtube_api_key_aqui
```

#### D) Configurar Frontend Cliente
```bash
cd frontend-cliente
cp .env.example .env
```

Edite `frontend-cliente/.env`:
```env
VITE_MERCADOPAGO_PUBLIC_KEY=cole_sua_public_key_aqui
```

#### E) Configurar Frontend TV
```bash
cd frontend-tv
cp .env.example .env
```
(Arquivo padrão já funciona!)

---

### 3️⃣ INSTALAR E RODAR (1 minuto)

Abra **3 terminais** (ou abas):

#### Terminal 1 - Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Aguarde aparecer:
```
🎵 ═══════════════════════════════════════════════════════
   ESPETO MUSIC - Backend Server
   ═══════════════════════════════════════════════════════
   🚀 Servidor rodando na porta 3000
```

#### Terminal 2 - Frontend Cliente
```bash
cd frontend-cliente
npm install
npm run dev
```

Aguarde aparecer:
```
VITE ready in XXX ms
➜ Local: http://localhost:5173
```

#### Terminal 3 - Frontend TV
```bash
cd frontend-tv
npm install
npm run dev
```

Aguarde aparecer:
```
VITE ready in XXX ms
➜ Local: http://localhost:5174
```

---

### 4️⃣ TESTAR! (30 segundos)

1. Abra no navegador: http://localhost:5173
2. Digite seu nome
3. Busque uma música (ex: "Legião Urbana")
4. Clique em "Escolher R$ 5,00"
5. Será redirecionado para Mercado Pago

**⚠️ IMPORTANTE EM TESTE:**
- Use CPF de teste: **11111111111**
- Use cartão de teste: **5031 4332 1540 6351**
- CVV: qualquer (123)
- Validade: futura (12/25)

6. Complete o pagamento
7. Abra http://localhost:5174 (TV)
8. Veja a música aparecer e tocar!

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### ✅ Backend OK:
```bash
curl http://localhost:3000/api/health
```
Deve retornar: `{"status":"ok",...}`

### ✅ Frontend Cliente OK:
Abra http://localhost:5173 - deve aparecer tela roxa com "Espeto Music"

### ✅ Frontend TV OK:
Abra http://localhost:5174 - deve aparecer tela preta com "Próximas Músicas"

### ✅ WebSocket OK:
Abra console do navegador (F12) e veja:
```
✅ Conectado ao WebSocket
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ "Cannot find module"
```bash
# Instalar dependências
cd backend && npm install
cd ../frontend-cliente && npm install
cd ../frontend-tv && npm install
```

### ❌ "MERCADOPAGO_ACCESS_TOKEN is not defined"
- Você não configurou o `.env`
- Verifique se copiou `.env.example` para `.env`
- Verifique se preencheu as credenciais

### ❌ "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID NUMERO_DO_PID /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### ❌ "YouTube API quota exceeded"
- Sua cota diária acabou (10.000 requests/dia)
- Aguarde até amanhã OU
- Crie outro projeto no Google Cloud

### ❌ Pagamento não processa
**Em desenvolvimento local, webhook NÃO funciona automaticamente.**

**Solução: Use ngrok**
```bash
# Baixe: https://ngrok.com/download
ngrok http 3000

# Copie URL (ex: https://abc123.ngrok.io)
# Configure no Mercado Pago:
# URL: https://abc123.ngrok.io/api/pagamentos/webhook/mercadopago
```

---

## 📱 GERAR QR CODE

Acesse: http://localhost:3000/qrcode

Você receberá:
```json
{
  "url": "http://localhost:5173",
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "message": "Escaneie este QR Code..."
}
```

- Copie o `qrCode` (base64)
- Cole em: https://base64.guru/converter/decode/image
- Baixe a imagem
- Imprima!

**Em rede local:** Substitua `localhost` pelo IP da máquina (ex: `192.168.1.10:5173`)

---

## 🌐 ACESSAR DE OUTRO DISPOSITIVO (mesma rede WiFi)

### 1. Descubra seu IP:
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```
Procure por algo como: `192.168.1.X`

### 2. Altere backend/.env:
```env
BASE_URL=http://192.168.1.X:5173
FRONTEND_URL=http://192.168.1.X:5173
```

### 3. Reinicie o backend:
```bash
cd backend
npm run dev
```

### 4. Acesse do celular:
```
http://192.168.1.X:5173
```

---

## 📊 MONITORAR EM TEMPO REAL

### Ver banco de dados:
```bash
cd backend
npx prisma studio
```
Abre interface visual em: http://localhost:5555

### Ver logs do backend:
- Terminal do backend mostra todas as requisições
- Procure por: `POST /api/musicas`, `WebSocket conectado`, etc.

### Ver logs do frontend:
- Abra console do navegador (F12)
- Aba "Console"
- Veja conexões WebSocket, requests, etc.

---

## 🎉 PRONTO!

**Seu sistema está rodando!**

- ✅ Backend respondendo
- ✅ Cliente escolhendo músicas
- ✅ Pagamentos funcionando (com teste)
- ✅ TV exibindo fila
- ✅ WebSocket sincronizando tudo

### Próximos passos:
1. Testar fluxo completo várias vezes
2. Configurar webhook com ngrok para testes reais
3. Personalizar cores/preços
4. Fazer deploy para produção

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **README.md** - Documentação geral
- **GUIA_RAPIDO.md** - Guia detalhado
- **RESUMO_PROJETO.md** - Visão técnica completa
- **CRIAR_ARQUIVOS_RESTANTES.md** - Códigos React

---

## 🆘 PRECISA DE AJUDA?

1. Leia o **README.md**
2. Confira o **GUIA_RAPIDO.md**
3. Veja **RESUMO_PROJETO.md** para entender a arquitetura
4. Verifique documentação oficial das tecnologias

---

**Desenvolvido com ❤️ - Bora fazer música!** 🎵🚀
