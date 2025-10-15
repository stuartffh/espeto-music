# Configuração de Variáveis de Ambiente

## Arquivo Unificado (.env)

O Espeto Music agora utiliza um **arquivo .env único na raiz do projeto** que configura tanto o backend quanto os frontends.

### Para Desenvolvimento Local

1. Copie o arquivo `.env.example` para `.env` na raiz do projeto:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais reais

3. Os frontends e backend lerão automaticamente do mesmo arquivo `.env` da raiz

### Para Deploy no Easypanel

No Easypanel, você pode configurar as variáveis de ambiente diretamente no painel:

1. Vá em **Settings** > **Environment Variables**
2. Adicione todas as variáveis do arquivo `.env.example`
3. Preencha com suas credenciais de produção

**Variáveis OBRIGATÓRIAS para produção:**

```env
# Ambiente
NODE_ENV=production
PORT=3000

# URLs (substitua por seu domínio)
FRONTEND_URL=https://seu-dominio.com
TV_PANEL_URL=https://seu-dominio.com/tv
BASE_URL=https://seu-dominio.com

# Database
DATABASE_URL=file:./prisma/dev.db

# Mercado Pago (obtenha em https://www.mercadopago.com.br/developers/panel)
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui

# YouTube API (obtenha em https://console.cloud.google.com/apis/credentials)
YOUTUBE_API_KEY=sua_api_key_aqui

# Configurações
PRECO_MUSICA=5.00
MAX_MUSICAS_FILA=50

# Frontend - APIs (substitua por seu domínio)
VITE_API_URL=https://seu-dominio.com
VITE_WEBSOCKET_URL=https://seu-dominio.com
VITE_MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui
```

## Como Funcionam as Variáveis

### Backend (Node.js)
O backend lê as variáveis diretamente de `process.env`. Todas as variáveis estão disponíveis.

### Frontends (Vite)
O Vite só expõe variáveis que começam com `VITE_` para o frontend. Por isso:
- `VITE_API_URL` - URL da API backend
- `VITE_WEBSOCKET_URL` - URL do WebSocket
- `VITE_MERCADOPAGO_PUBLIC_KEY` - Chave pública do Mercado Pago

## Estrutura de Arquivos

```
Espeto Music/
├── .env                    # Arquivo com suas credenciais (NÃO COMMITAR)
├── .env.example            # Template com valores de exemplo
├── backend/
│   ├── .env               # (opcional) sobrescreve o .env da raiz
│   └── ...
├── frontend-cliente/
│   ├── .env               # (opcional) sobrescreve o .env da raiz
│   └── ...
└── frontend-tv/
    ├── .env               # (opcional) sobrescreve o .env da raiz
    └── ...
```

**Nota:** Se existir um `.env` específico dentro de `backend/`, `frontend-cliente/` ou `frontend-tv/`, ele terá prioridade sobre o `.env` da raiz.

## Segurança

- ✅ O arquivo `.env` está no `.gitignore` - nunca será commitado
- ✅ Use valores de teste (prefixo `TEST-`) em desenvolvimento
- ✅ Use credenciais de produção apenas no Easypanel
- ⚠️ Nunca exponha `MERCADOPAGO_ACCESS_TOKEN` no frontend
- ⚠️ Nunca exponha `YOUTUBE_API_KEY` no frontend

## Troubleshooting

### As variáveis não estão sendo lidas

1. Verifique se o arquivo `.env` está na raiz do projeto
2. Reinicie os serviços após alterar o `.env`
3. No Docker, certifique-se de que as variáveis estão configuradas no Easypanel

### Frontends não conseguem acessar a API

Verifique se `VITE_API_URL` e `VITE_WEBSOCKET_URL` estão corretos:
- **Desenvolvimento**: `http://localhost:3000`
- **Produção**: `https://seu-dominio.com` (seu domínio do Easypanel)
