# 📋 Guia de Migração de Configurações

Este guia explica como aplicar as mudanças de configuração do sistema Espeto Music em diferentes ambientes.

## 📦 O que mudou?

### Configurações Renomeadas
- `MODO_GRATUITO` (boolean) → `MODO_FILA` (text: "gratuito" ou "pago")
- `PERMITIR_MUSICAS_DUPLICADAS` → `PERMITIR_DUPLICADAS`

### Novas Configurações Adicionadas (17 novas)

#### 🎵 Fila e Operação
- `TEMPO_MAXIMO_ESPERA`: Tempo máximo de espera na fila em minutos

#### 🛡️ Moderação (4 novas)
- `NIVEL_MODERACAO`: Nível de moderação automática (leve, medio, severo, desativado)
- `MODERAR_NOME_CLIENTE`: Ativar moderação no nome do cliente
- `MODERAR_TITULO_MUSICA`: Ativar moderação no título da música
- `REJEITAR_AUTO`: Rejeitar automaticamente conteúdo inapropriado

#### 🖥️ Painel TV (3 novas)
- `VIDEO_DESCANSO_URL`: URL do vídeo de descanso quando a fila está vazia
- `MOSTRAR_ANUNCIOS`: Mostrar anúncios no painel TV
- `INTERVALO_ANUNCIOS`: Intervalo entre anúncios em minutos

#### 🏢 Estabelecimento (2 novas)
- `LOGO_URL`: URL da logo do estabelecimento
- `COR_TEMA`: Cor principal do tema (hexadecimal)

#### 📱 Interface Cliente (2 novas)
- `EXIBIR_PRECO_FRONTEND`: Exibir preço no frontend do cliente
- `MENSAGEM_BOAS_VINDAS`: Mensagem de boas-vindas no frontend

#### 🔧 Técnicas (2 novas)
- `ATIVAR_LOGS_DETALHADOS`: Ativar logs detalhados no backend
- `WEBHOOK_URL`: URL para receber webhooks de eventos

---

## 🔧 AMBIENTE DE DESENVOLVIMENTO

### Opção 1: Reset Completo (Recomendado)

Use esta opção se você pode perder os dados de desenvolvimento:

```bash
cd backend
npx prisma migrate reset --force
```

Isso irá:
1. Deletar o banco de dados
2. Criar um novo banco
3. Executar o seed.js atualizado
4. Criar todas as 26 configurações

### Opção 2: Migração Incremental

Se você quer preservar alguns dados:

```bash
cd backend
node migrate-configs.js
```

---

## 🚀 AMBIENTE DE PRODUÇÃO

### ⚠️ IMPORTANTE: Faça backup antes!

```bash
# Backup do banco de dados SQLite
cp backend/prisma/dev.db backend/prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)
```

### Passo 1: Fazer backup

```bash
cd backend
cp prisma/dev.db prisma/dev.db.backup
```

### Passo 2: Executar migração

```bash
node migrate-configs.js
```

### Passo 3: Verificar resultados

O script irá mostrar um resumo:
- Quantas configurações foram convertidas
- Quantas foram adicionadas
- Status das configurações críticas

### Passo 4: Reiniciar servidor

```bash
# Se usando PM2
pm2 restart espeto-music-backend

# Se usando systemd
sudo systemctl restart espeto-music

# Ou parar e iniciar manualmente
npm run start
```

---

## 🧪 Validação Pós-Migração

### 1. Verificar no Dashboard Admin

1. Acesse o dashboard admin
2. Verifique se todas as 26 configurações aparecem
3. Teste alterar `MODO_FILA` entre "gratuito" e "pago"
4. Verifique se a mudança persiste após reload

### 2. Verificar no Frontend Cliente

1. Acesse a página do cliente
2. Se `MODO_FILA = "pago"`, deve mostrar preços
3. Se `MODO_FILA = "gratuito"`, não deve mostrar preços

### 3. Verificar Logs

```bash
# Ver logs do backend
tail -f logs/backend.log

# Ou se usando PM2
pm2 logs espeto-music-backend
```

Procure por:
- `✅ Configuração criada:` (no seed)
- `🔄 Emitindo atualização de configuração:` (no controller)
- `📡 Config atualizada via WebSocket:` (no frontend)

---

## 🔍 Troubleshooting

### Problema: Migração falhou

**Solução**: Restaurar backup
```bash
cd backend
cp prisma/dev.db.backup prisma/dev.db
```

### Problema: MODO_FILA não aparece no dashboard

**Possíveis causas**:
1. Migração não executada
2. Cache do navegador

**Solução**:
```bash
# 1. Verificar no banco
cd backend
npx prisma studio
# Ir em "configuracao" e procurar por "MODO_FILA"

# 2. Limpar cache do navegador
# Ctrl+Shift+R (Chrome/Edge)
# Cmd+Shift+R (Mac)
```

### Problema: Configurações não persistem

**Possíveis causas**:
1. WebSocket não conectado
2. Token expirado

**Solução**:
```bash
# Ver logs do WebSocket no console do navegador
# Deve aparecer: "🔌 Conectando WebSocket do Dashboard Admin..."
# E: "📡 Config atualizada via WebSocket:"
```

### Problema: Modo gratuito/pago não muda no frontend

**Verificar**:
1. O valor no banco está correto? (use `npx prisma studio`)
2. O frontend está buscando `MODO_FILA` ou `MODO_GRATUITO`?
3. O cache do frontend está limpo?

---

## 📊 Estrutura de Configurações

### Antes (9 configs)
```
MODO_GRATUITO (boolean)
PRECO_MUSICA
MAX_MUSICAS_FILA
TEMPO_EXPIRACAO_PAGAMENTO
PERMITIR_MUSICAS_DUPLICADAS
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY
NOME_ESTABELECIMENTO
TEMPO_MAXIMO_MUSICA
```

### Depois (26 configs organizadas)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 FILA E OPERAÇÃO (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO_FILA (text: "gratuito" ou "pago")
MAX_MUSICAS_FILA
PERMITIR_DUPLICADAS
TEMPO_MAXIMO_MUSICA
TEMPO_MAXIMO_ESPERA ⭐ NOVA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PAGAMENTO (4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRECO_MUSICA
TEMPO_EXPIRACAO_PAGAMENTO
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ MODERAÇÃO (4) ⭐ TODAS NOVAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NIVEL_MODERACAO
MODERAR_NOME_CLIENTE
MODERAR_TITULO_MUSICA
REJEITAR_AUTO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ PAINEL TV (3) ⭐ TODAS NOVAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIDEO_DESCANSO_URL
MOSTRAR_ANUNCIOS
INTERVALO_ANUNCIOS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 ESTABELECIMENTO (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOME_ESTABELECIMENTO
LOGO_URL ⭐ NOVA
COR_TEMA ⭐ NOVA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 INTERFACE CLIENTE (2) ⭐ TODAS NOVAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXIBIR_PRECO_FRONTEND
MENSAGEM_BOAS_VINDAS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 TÉCNICAS (2) ⭐ TODAS NOVAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATIVAR_LOGS_DETALHADOS
WEBHOOK_URL
```

---

## 🎯 Resumo dos Comandos

### Desenvolvimento (pode perder dados)
```bash
cd backend
npx prisma migrate reset --force
```

### Produção (preserva dados)
```bash
cd backend
cp prisma/dev.db prisma/dev.db.backup
node migrate-configs.js
pm2 restart espeto-music-backend
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do backend
2. Verifique o console do navegador
3. Use `npx prisma studio` para inspecionar o banco
4. Restaure o backup se necessário

**Logs importantes para verificar**:
- Backend: `🔄 Emitindo atualização de configuração`
- Frontend: `📡 Config atualizada via WebSocket`
- Dashboard: `✅ X configurações salvas com sucesso`
