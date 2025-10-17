# 📋 Gerenciamento de Configurações - Espeto Music

## 🎯 Visão Geral

O sistema Espeto Music agora permite gerenciar **todas as configurações importantes através do Painel Admin**, eliminando a necessidade de editar manualmente o arquivo `.env` para a maioria das configurações.

---

## 🔧 Como Funciona

### 1. **Configurações no Banco de Dados**

As configurações são armazenadas na tabela `configuracoes` do banco de dados e podem ser editadas em tempo real através do Painel Admin, sem necessidade de reiniciar o servidor.

### 2. **Cache Inteligente**

- Sistema usa cache de **2 minutos** para otimizar performance
- Cache é automaticamente invalidado quando você atualiza uma configuração
- Reduz consultas ao banco de dados sem comprometer atualizações

### 3. **Fallback para .env**

Se uma configuração não existir no banco, o sistema tenta buscar no `.env` como fallback.

---

## 🚀 Como Configurar

### **Passo 1: Configurar Credenciais do Mercado Pago**

#### Via Painel Admin (RECOMENDADO):

1. Acesse: `http://localhost:5173/admin`
2. Faça login com suas credenciais
3. Vá em **Configurações**
4. Localize as configurações:
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `MERCADOPAGO_PUBLIC_KEY`
5. Cole suas credenciais obtidas em: https://www.mercadopago.com.br/developers/panel
6. Clique em **Salvar**

#### Tipos de Token:

**Para Testes:**
```
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890...
MERCADOPAGO_PUBLIC_KEY=TEST-abcd1234...
```

**Para Produção:**
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890...
MERCADOPAGO_PUBLIC_KEY=APP_USR-abcd1234...
```

---

### **Passo 2: Outras Configurações Importantes**

Você pode configurar através do Painel Admin:

#### 💰 **Pagamento**
- `PRECO_MUSICA` - Preço por música (em R$)
- `modo_gratuito` - Ativar modo gratuito (true/false)

#### 🎵 **Fila de Músicas**
- `MAX_MUSICAS_FILA` - Máximo de músicas na fila
- `TEMPO_MAXIMO_MUSICA` - Duração máxima em minutos
- `PERMITIR_MUSICAS_REPETIDAS` - Permitir duplicadas

#### 🛡️ **Moderação**
- `MODERACAO_ATIVA` - Ativar/desativar moderação
- `NIVEL_MODERACAO` - Nível (LEVE, MEDIA, SEVERA)

#### 🎨 **Visual**
- `NOME_ESTABELECIMENTO` - Nome do seu negócio
- `COR_TEMA` - Cor principal (hexadecimal)
- `LOGO_URL` - URL da logo
- `VIDEO_DESCANSO_URL` - Vídeo quando fila vazia

---

## 🔐 Variáveis que DEVEM ficar no .env

Algumas configurações **críticas** devem permanecer no `.env`:

```env
# Obrigatórias no .env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
TV_PANEL_URL=http://localhost:5174
DATABASE_URL="file:./dev.db"
JWT_SECRET=espeto-music-secret-key-2024
BASE_URL=http://localhost:3000
```

---

## 🔄 Comandos Úteis

### Resetar Configurações
```bash
npm run seed:config
```
Este comando:
- Cria usuário admin padrão (username: `admin`, senha: `admin123`)
- Popula todas as configurações com valores padrão
- **NÃO apaga** configurações existentes, apenas cria as que faltam

### Resetar Tudo (Cuidado!)
```bash
npm run seed
```
Este comando:
- **APAGA TODOS OS DADOS** do banco
- Recria configurações padrão
- Use apenas em desenvolvimento

---

## 📊 Fluxo de Busca de Configurações

```
1. Verificar CACHE (válido por 2 minutos)
   ↓ Se não encontrar
2. Buscar no BANCO DE DADOS
   ↓ Se não encontrar
3. Buscar no .ENV como fallback
   ↓ Se não encontrar
4. Retornar valor padrão (null)
```

---

## 🐛 Solução de Problemas

### ❌ Erro: "Token do Mercado Pago não configurado"

**Causa:** Token não está configurado no banco ou está vazio.

**Solução:**
1. Acesse o Painel Admin > Configurações
2. Configure `MERCADOPAGO_ACCESS_TOKEN` com um token válido
3. Teste criando um pedido de música

### ❌ Erro: "invalid_token" do Mercado Pago

**Causa:** Token configurado é inválido ou expirou.

**Solução:**
1. Verifique se o token começa com `TEST-` (teste) ou `APP_USR-` (produção)
2. Copie o token corretamente (sem espaços extras)
3. Verifique se não expirou no painel do Mercado Pago

### 🔄 Cache não está atualizando

**Causa:** Cache ainda válido (2 minutos).

**Solução:**
- Aguarde 2 minutos
- OU reinicie o servidor backend
- OU use o endpoint de atualização (invalida cache automaticamente)

---

## 💡 Boas Práticas

1. ✅ **Configure credenciais sensíveis no Painel Admin**, não no código
2. ✅ **Use tokens de TEST** durante desenvolvimento
3. ✅ **Nunca comite** tokens reais no Git
4. ✅ **Teste pagamentos** em modo teste antes de ativar produção
5. ✅ **Faça backup** do banco antes de executar seeds
6. ✅ **Documente** alterações importantes de configuração

---

## 📚 Recursos Adicionais

- **Painel do Mercado Pago:** https://www.mercadopago.com.br/developers/panel
- **Documentação Mercado Pago:** https://www.mercadopago.com.br/developers/pt/docs
- **Suporte:** Abra uma issue no repositório do projeto

---

## 🎉 Vantagens do Novo Sistema

✅ Configurações em tempo real (sem reiniciar servidor)
✅ Interface amigável no Painel Admin
✅ Cache inteligente para melhor performance
✅ Histórico de alterações no banco
✅ Menos risco de erros (validação na interface)
✅ Mais seguro (credenciais no banco, não no código)

---

**Desenvolvido com ❤️ para o Espeto Music**
