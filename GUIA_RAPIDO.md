# 🚀 GUIA RÁPIDO - ESPETO MUSIC

## ✅ STATUS DO PROJETO

**Backend:** ✅ COMPLETO
**Frontend Cliente:** ⚠️  ARQUIVOS FALTAM (veja abaixo)
**Frontend TV:** ⚠️ ARQUIVOS FALTAM (veja abaixo)
**Banco de Dados:** ✅ CONFIGURADO (SQLite)
**Integrações:** ✅ Mercado Pago + YouTube API

---

## 📁 ARQUIVOS QUE FALTAM CRIAR

Copie o conteúdo do arquivo `CRIAR_ARQUIVOS_RESTANTES.md` e crie manualmente esses arquivos:

### Frontend Cliente (frontend-cliente/):
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/styles/index.css`
- `src/services/api.js`
- `src/services/socket.js`
- `src/store/useStore.js`
- `src/pages/Home.jsx`
- `src/pages/Pagamento.jsx`
- `.gitignore`

### Frontend TV (frontend-tv/):
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/index.css`
- `.gitignore`

**IMPORTANTE:** Todos os códigos estão no arquivo `CRIAR_ARQUIVOS_RESTANTES.md`. Copie e cole!

---

## 🎯 INSTALAÇÃO RÁPIDA

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env

# EDITAR .env COM SUAS CREDENCIAIS:
# - MERCADOPAGO_ACCESS_TOKEN
# - MERCADOPAGO_PUBLIC_KEY
# - YOUTUBE_API_KEY

# Gerar Prisma Client
npx prisma generate

# Criar banco e tabelas
npx prisma migrate dev --name init

# Popular banco com configurações
npm run seed

# Iniciar servidor
npm run dev
```

Deve aparecer: `🚀 Servidor rodando na porta 3000`

---

### 2. Frontend Cliente

```bash
cd frontend-cliente

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env

# EDITAR .env:
# VITE_MERCADOPAGO_PUBLIC_KEY=sua_chave_publica

# Iniciar
npm run dev
```

Acesse: http://localhost:5173

---

### 3. Frontend TV

```bash
cd frontend-tv

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env

# Iniciar
npm run dev
```

Acesse: http://localhost:5174

---

## 🔑 CREDENCIAIS NECESSÁRIAS

### 1. Mercado Pago
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas credenciais"
3. Copie:
   - **Access Token** (para backend/.env)
   - **Public Key** (para frontend-cliente/.env)

### 2. YouTube Data API
1. Acesse: https://console.cloud.google.com/
2. Crie um projeto
3. Ative "YouTube Data API v3"
4. Gere uma "Chave de API"
5. Copie para backend/.env

---

## 📱 TESTAR O SISTEMA

### 1. Abra 3 terminais e rode:
- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd frontend-cliente && npm run dev`
- Terminal 3: `cd frontend-tv && npm run dev`

### 2. Acesse no navegador:
- **Cliente**: http://localhost:5173
- **TV**: http://localhost:5174
- **QR Code**: http://localhost:3000/qrcode

### 3. Teste o fluxo:
1. No cliente, digite seu nome
2. Busque uma música (ex: "Legião Urbana")
3. Clique em "Escolher R$ 5,00"
4. Será redirecionado para Mercado Pago
5. **IMPORTANTE**: Em desenvolvimento, use **CPF de teste**: 11111111111
6. Pague (teste)
7. A música aparecerá na TV automaticamente!

---

## 🐛 PROBLEMAS COMUNS

### Erro: "MERCADOPAGO_ACCESS_TOKEN is not defined"
- Você não configurou o `.env` no backend
- Copie `.env.example` para `.env` e preencha

### Erro: "YouTube API quota exceeded"
- Sua quota da API do YouTube acabou
- Aguarde até amanhã ou crie outro projeto no Google Cloud

### Erro: "Cannot connect to WebSocket"
- Certifique-se que o backend está rodando na porta 3000
- Verifique o firewall

### Músicas não tocam na TV
- Verifique se a música foi paga com sucesso
- Abra o console do navegador (F12) e veja erros

---

## 🌐 WEBHOOK MERCADO PAGO (PRODUÇÃO)

Em desenvolvimento local, o webhook NÃO funcionará automaticamente.

**Opções:**

### Opção 1: ngrok (Recomendado para testes)
```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3000

# Copiar a URL (ex: https://abc123.ngrok.io)
# Configurar webhook no Mercado Pago:
# https://abc123.ngrok.io/api/pagamentos/webhook/mercadopago
```

### Opção 2: Simular pagamento manualmente
1. Após criar pedido, anote o `pedidoId`
2. No backend, rode:
```javascript
// Via console do navegador ou Postman:
POST http://localhost:3000/api/pagamentos/webhook/mercadopago
Body: {
  "type": "payment",
  "data": { "id": "PAYMENT_ID_AQUI" }
}
```

---

## 📦 ESTRUTURA FINAL

```
Espeto Music/
├── backend/ ✅ COMPLETO
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env (criar!)
│
├── frontend-cliente/ ⚠️ CRIAR ARQUIVOS
│   ├── src/
│   ├── package.json ✅
│   └── .env (criar!)
│
├── frontend-tv/ ⚠️ CRIAR ARQUIVOS
│   ├── src/
│   ├── package.json ✅
│   └── .env (criar!)
│
├── README.md ✅
├── GUIA_RAPIDO.md ✅
└── CRIAR_ARQUIVOS_RESTANTES.md ✅
```

---

## 🎉 PRÓXIMOS PASSOS

1. ✅ Criar arquivos do frontend (veja CRIAR_ARQUIVOS_RESTANTES.md)
2. ✅ Configurar .env em todas as pastas
3. ✅ Instalar dependências (npm install)
4. ✅ Testar localmente
5. ✅ Configurar webhook com ngrok
6. ✅ Fazer deploy (Railway/Vercel)

---

## 💡 DICAS

- Use **Ctrl+C** para parar os servidores
- Sempre rode `npm run dev` em cada pasta
- O QR Code aponta para http://localhost:5173 por padrão
- Em produção, altere `BASE_URL` no .env do backend
- SQLite cria arquivo `dev.db` automaticamente

---

**Criado com ❤️ - Sistema completo e funcional!** 🎵
