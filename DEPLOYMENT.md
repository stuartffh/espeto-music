# Guia de Deploy - Espeto Music

## Resumo das Alterações

Este documento descreve as mudanças realizadas para corrigir problemas de autenticação e configuração de ambiente.

### Commits Recentes

1. **6ced5ae** - Fix: Correct API port and add JWT_SECRET configuration
2. **4c3cdbc** - Fix: Use environment variables for API URL

---

## Configuração Backend (Produção)

### 1. Arquivo `.env` de Produção

No servidor de produção, adicione as seguintes variáveis ao arquivo `backend/.env`:

```env
# Configuração do Servidor
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://espeto.zapchatbr.com
TV_PANEL_URL=https://espeto.zapchatbr.com/tv

# Database
DATABASE_URL="file:./production.db"

# JWT Secret (CRÍTICO - Gere um secret forte!)
JWT_SECRET=SEU_SECRET_SUPER_SEGURO_AQUI_MINIMO_32_CARACTERES

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_token_real_aqui
MERCADOPAGO_PUBLIC_KEY=sua_chave_real_aqui

# YouTube Data API
YOUTUBE_API_KEY=sua_chave_real_aqui

# Configurações do Sistema
PRECO_MUSICA=5.00
MAX_MUSICAS_FILA=50

# URL Base para QR Codes
BASE_URL=https://espeto.zapchatbr.com
```

### 2. Criar Usuário Admin

Após configurar o `.env`, execute um dos seguintes comandos no servidor:

#### Opção A: Seed completo do banco
```bash
cd backend
npm run seed
```

#### Opção B: Apenas criar admin
```bash
cd backend
node create-admin-production.js
```

### 3. Credenciais do Admin

Após executar o seed, use estas credenciais para fazer login:

- **Username:** `admin`
- **Password:** `admin123`

**IMPORTANTE:** Altere a senha após o primeiro login!

---

## Configuração Frontend (Produção)

### 1. Arquivo `.env` de Produção

Crie o arquivo `frontend-cliente/.env.production`:

```env
VITE_API_URL=https://espeto.zapchatbr.com
```

### 2. Build de Produção

```bash
cd frontend-cliente
npm run build
```

Isso irá gerar os arquivos estáticos na pasta `dist/` usando automaticamente as variáveis do `.env.production`.

---

## Arquitetura da Solução

### URLs Hardcoded → Variáveis de Ambiente

**Antes:**
- URLs como `http://localhost:3000` e `http://localhost:3001` hardcoded nos arquivos
- Não funcionava em produção

**Depois:**
- Arquivo centralizado: `frontend-cliente/src/config/api.js`
- Usa `import.meta.env.VITE_API_URL` do Vite
- Arquivos `.env` diferentes para dev e prod

### Arquivos Modificados

1. **frontend-cliente/src/config/api.js** (NOVO)
   - Configuração centralizada da API URL
   - Helper `apiRequest` para requisições

2. **frontend-cliente/src/contexts/ThemeContext.jsx**
   - Agora importa `API_URL` de `config/api.js`
   - Linha 15: `fetch(\`${API_URL}/api/theme\`)`

3. **frontend-cliente/src/pages/AdminTheme.jsx**
   - Agora importa `API_URL` de `config/api.js`
   - Linha 58: `fetch(\`${API_URL}/api/admin/theme\`)`
   - Linha 96: `fetch(\`${API_URL}/api/admin/theme/reset\`)`

4. **backend/.env** e **backend/.env.example**
   - Adicionado `JWT_SECRET` (necessário para auth)

---

## Checklist de Deploy

### Backend

- [ ] Fazer pull das últimas alterações do Git
- [ ] Copiar `.env.example` para `.env`
- [ ] Configurar todas as variáveis de ambiente (especialmente `JWT_SECRET`)
- [ ] Executar `npm install`
- [ ] Executar `npm run seed` ou `node create-admin-production.js`
- [ ] Reiniciar o serviço backend
- [ ] Verificar se backend está rodando na porta 3000
- [ ] Testar endpoint: `https://espeto.zapchatbr.com/api/theme`

### Frontend

- [ ] Fazer pull das últimas alterações do Git
- [ ] Verificar se `.env.production` tem `VITE_API_URL=https://espeto.zapchatbr.com`
- [ ] Executar `npm install`
- [ ] Executar `npm run build`
- [ ] Fazer deploy da pasta `dist/` para o servidor web
- [ ] Testar se aplicação carrega: `https://espeto.zapchatbr.com`
- [ ] Testar login admin: `https://espeto.zapchatbr.com/admin/theme`

---

## Troubleshooting

### Erro: "Credenciais inválidas"

**Causas possíveis:**
1. Admin user não foi criado no banco de produção
2. JWT_SECRET não está configurado no `.env`
3. Backend não foi reiniciado após mudanças no `.env`

**Solução:**
```bash
# 1. Verificar se JWT_SECRET está no .env
cat backend/.env | grep JWT_SECRET

# 2. Executar seed
cd backend
node create-admin-production.js

# 3. Reiniciar backend
pm2 restart backend  # ou o comando apropriado
```

### Erro: "Failed to fetch" ou CORS

**Causas possíveis:**
1. API_URL incorreta no frontend
2. Backend não está respondendo
3. Problema de CORS

**Solução:**
```bash
# Verificar se backend está rodando
curl https://espeto.zapchatbr.com/api/theme

# Verificar variável no build
cat frontend-cliente/.env.production

# Rebuild do frontend
cd frontend-cliente
npm run build
```

### Frontend aponta para localhost em produção

**Causa:**
Build foi feito sem o arquivo `.env.production`

**Solução:**
```bash
# Criar .env.production
echo "VITE_API_URL=https://espeto.zapchatbr.com" > frontend-cliente/.env.production

# Rebuild
cd frontend-cliente
npm run build
```

---

## Comandos Úteis

### Backend
```bash
# Ver logs
pm2 logs backend

# Reiniciar
pm2 restart backend

# Status
pm2 status

# Testar banco de dados
cd backend
npx prisma studio
```

### Frontend
```bash
# Build local para testar
npm run build
npm run preview

# Ver variáveis de ambiente no build
cat dist/assets/*.js | grep -o "http[s]*://[^\"]*"
```

---

## Segurança

### JWT_SECRET

**NUNCA** use um secret simples como `"secret123"`. Gere um secret forte:

```bash
# Gerar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Senha do Admin

Após o primeiro login com `admin`/`admin123`, **ALTERE A SENHA IMEDIATAMENTE**.

---

## Suporte

Se você encontrar problemas após seguir este guia:

1. Verifique os logs do backend: `pm2 logs backend`
2. Verifique console do navegador (F12)
3. Teste a API diretamente: `curl https://espeto.zapchatbr.com/api/theme`
4. Confirme que todas as variáveis de ambiente estão configuradas

---

**Última atualização:** 2025-01-15
**Commits incluídos:** 6ced5ae, 4c3cdbc
