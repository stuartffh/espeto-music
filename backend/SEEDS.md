# 🌱 Sistema de Seeds - Espeto Music

## 📋 Visão Geral

O sistema possui seeds automáticos que preparam o banco de dados com todos os dados necessários para começar a usar o sistema imediatamente.

---

## 🚀 Seeds Disponíveis

### 1. **seed-config.js** - Configurações e Admin
Cria:
- ✅ Usuário administrador padrão
- ✅ 35+ configurações do sistema
- ✅ Credenciais do Mercado Pago (vazias, para configurar depois)
- ✅ Configurações de moderação, tema, fila, etc.

### 2. **seed-moderation.js** - Sistema de Moderação
Cria:
- ✅ 38 palavras proibidas categorizadas
- ✅ 3 níveis de severidade (LEVE, MEDIA, SEVERA)
- ✅ Configurações de moderação ativa

### 3. **seed-all.js** - Seed Completo
Executa todos os seeds acima na ordem correta.

### 4. **auto-seed.js** - Seed Automático
Executado automaticamente no `npm install` se o banco estiver vazio.

---

## 🎯 Comandos Disponíveis

### Seed Completo (Recomendado)
```bash
npm run seed:all
```
Executa todos os seeds na ordem correta.

### Seed Específico

**Apenas Configurações:**
```bash
npm run seed:config
```

**Apenas Moderação:**
```bash
npm run seed:moderation
```

**Seed Original (CUIDADO - apaga tudo):**
```bash
npm run seed
```
⚠️ Este comando **APAGA TODOS OS DADOS** do banco.

---

## ⚙️ Seed Automático no Deploy

O sistema está configurado para executar seed automático:

### **1. Durante npm install**
```bash
cd backend
npm install
```

O hook `postinstall` no `package.json` executa:
1. `prisma generate` - Gera o Prisma Client
2. `node auto-seed.js` - Verifica e semeia se necessário

### **2. Lógica do Auto-Seed**

O `auto-seed.js` verifica:
- ✅ Se o banco de dados existe
- ✅ Se há dados nas tabelas (configurações e admin)
- ✅ Executa seed completo apenas se banco vazio
- ✅ Não falha o processo se houver erros (apenas avisa)

---

## 📊 Dados Criados

### Após Seed Completo:

| Tabela | Quantidade | Descrição |
|--------|------------|-----------|
| `configuracoes` | 38 | Todas as configurações do sistema |
| `admins` | 1 | Usuário admin padrão |
| `palavras_proibidas` | 38 | Palavras para moderação |

### Credenciais Criadas:

**Admin:**
- Username: `admin`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha após primeiro acesso!

---

## 🔄 Fluxo de Deploy

### **Desenvolvimento Local:**
```bash
# 1. Clone o repositório
git clone https://github.com/stuartffh/espeto-music.git

# 2. Entre no backend
cd espeto-music/backend

# 3. Instale dependências (seed automático executará)
npm install

# 4. Execute migrações se necessário
npx prisma migrate dev

# 5. Inicie o servidor
npm start
```

### **Produção:**
```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npm run prisma:generate

# 3. Executar migrações
npm run prisma:deploy

# 4. Seed automático (se necessário)
npm run seed:all

# 5. Iniciar servidor
npm start
```

---

## 🛠️ Solução de Problemas

### ❌ Seed não executou automaticamente

**Causa:** Banco já possui dados ou erro no postinstall.

**Solução:**
```bash
npm run seed:all
```

### ❌ Erro: "Admin já existe"

**Causa:** Seed foi executado anteriormente.

**Solução:** Normal! O seed é idempotente (pode rodar múltiplas vezes).

### ❌ Erro: "Table does not exist"

**Causa:** Migrações do Prisma não foram executadas.

**Solução:**
```bash
npx prisma migrate dev
```

### 🔄 Resetar Banco Completamente

⚠️ **CUIDADO:** Isso apaga TODOS os dados!

```bash
# Resetar e recriar
npx prisma migrate reset

# Ou manualmente
rm backend/dev.db
npx prisma migrate dev
npm run seed:all
```

---

## 📝 Configurações Importantes

### Configuradas Automaticamente:

✅ `PRECO_MUSICA` = 5.00
✅ `modo_gratuito` = false
✅ `MAX_MUSICAS_FILA` = 50
✅ `TEMPO_MAXIMO_MUSICA` = 10 minutos
✅ `MODERACAO_ATIVA` = true
✅ `NIVEL_MODERACAO` = MEDIA
✅ E mais 30+ configurações...

### Precisam Configurar Manualmente:

❌ `MERCADOPAGO_ACCESS_TOKEN` - Vazio (configure no painel)
❌ `MERCADOPAGO_PUBLIC_KEY` - Vazio (configure no painel)
❌ `YOUTUBE_API_KEY` - Vazio (opcional)

**Configure em:** Painel Admin > Configurações

---

## 🎯 Boas Práticas

### ✅ Faça:

1. Execute `npm run seed:all` após clonar o repositório
2. Verifique se as configurações foram criadas
3. Configure credenciais do Mercado Pago no painel admin
4. Altere a senha do admin após primeiro acesso
5. Faça backup do banco antes de rodar `npm run seed`

### ❌ Não Faça:

1. Não use `npm run seed` em produção (apaga tudo)
2. Não comite o arquivo `dev.db` no Git
3. Não deixe a senha padrão do admin em produção
4. Não execute seeds manualmente sem backup

---

## 📚 Referências

- **Configurações:** Veja `CONFIGURACOES.md`
- **Prisma:** https://www.prisma.io/docs
- **Migrações:** https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## 🎉 Resumo

✅ Seeds automáticos no `npm install`
✅ Script unificado `seed-all.js`
✅ Idempotente (pode rodar múltiplas vezes)
✅ Não falha o deploy se houver erro
✅ 38 configurações + admin + moderação
✅ Pronto para uso após seed

**Desenvolvido com ❤️ para o Espeto Music**
