# Guia de Deploy - Espeto Music

Este guia explica como fazer deploy do Espeto Music no **Easypanel** ou em qualquer plataforma que suporte Docker.

## Arquivos de Deploy Criados

- `Dockerfile` - Container multi-stage otimizado para produção
- `.dockerignore` - Otimiza o build excluindo arquivos desnecessários
- `docker-compose.yml` - Para testes locais com Docker
- `docker-entrypoint.sh` - Script de inicialização do container

---

## Deploy no Easypanel

### Passo 1: Preparar Repositório

Certifique-se de que seu código está em um repositório Git (GitHub, GitLab, etc.) e que todos os arquivos Docker estão commitados:

```bash
git add Dockerfile .dockerignore docker-entrypoint.sh docker-compose.yml
git commit -m "Add Docker configuration for deployment"
git push
```

### Passo 2: Criar Aplicação no Easypanel

1. Acesse seu painel do Easypanel
2. Clique em **"Create Application"**
3. Escolha **"From Git Repository"**
4. Conecte seu repositório Git
5. Configure as seguintes opções:

**Build Settings:**
- Build Method: `Dockerfile`
- Dockerfile Path: `./Dockerfile` (padrão)

**Port Configuration:**
- Container Port: `3000`

**Environment Variables (opcional):**
```env
NODE_ENV=production
PORT=3000
```

### Passo 3: Configurar Volumes (Persistência de Dados)

Para persistir o banco de dados SQLite e os downloads de músicas, adicione os seguintes **Persistent Volumes**:

1. **Volume para Banco de Dados:**
   - Mount Path: `/app/backend/prisma`
   - Tamanho sugerido: 1GB

2. **Volume para Downloads:**
   - Mount Path: `/app/backend/downloads`
   - Tamanho sugerido: 10GB (ou mais, dependendo do uso)

### Passo 4: Deploy

Clique em **"Deploy"** e aguarde o build e deploy da aplicação.

### Passo 5: Acessar a Aplicação

Após o deploy, você terá acesso a:

- **Frontend Cliente**: `https://seu-dominio.easypanel.app/`
- **Frontend TV**: `https://seu-dominio.easypanel.app/tv`
- **API**: `https://seu-dominio.easypanel.app/api/*`
- **Health Check**: `https://seu-dominio.easypanel.app/api/health`

---

## Teste Local com Docker

### Build e Teste com Docker Compose

```bash
# Build e iniciar
docker-compose up --build

# Acessar:
# - Frontend Cliente: http://localhost:3000
# - Frontend TV: http://localhost:3000/tv
# - API: http://localhost:3000/api

# Parar
docker-compose down
```

### Build Manual

```bash
# Build da imagem
docker build -t espeto-music .

# Executar container
docker run -p 3000:3000 \
  -v $(pwd)/data/prisma:/app/backend/prisma \
  -v $(pwd)/data/downloads:/app/backend/downloads \
  espeto-music

# Acessar: http://localhost:3000
```

---

## Arquitetura do Container

### Multi-Stage Build

O Dockerfile usa build multi-stage para otimizar o tamanho da imagem:

1. **Stage 1 (frontend-builder)**:
   - Constrói ambos os frontends (React/Vite)
   - Gera pastas `dist/` otimizadas

2. **Stage 2 (produção)**:
   - Instala dependências do backend
   - Copia builds dos frontends do stage 1
   - Instala ffmpeg para processamento de vídeo
   - Gera Prisma Client
   - Configura entrypoint

### O que acontece no startup:

1. Executa migrações do Prisma (`prisma migrate deploy`)
2. Gera Prisma Client
3. Verifica existência dos frontends
4. Inicia servidor Express na porta 3000

---

## Variáveis de Ambiente

Configure estas variáveis no Easypanel conforme necessário:

```env
# Ambiente
NODE_ENV=production

# Porta (padrão: 3000)
PORT=3000

# Banco de dados (SQLite por padrão)
DATABASE_URL=file:./prisma/dev.db

# URLs dos frontends (se necessário para CORS)
FRONTEND_URL=https://seu-dominio.easypanel.app
TV_PANEL_URL=https://seu-dominio.easypanel.app/tv

# URL base para QR codes
BASE_URL=https://seu-dominio.easypanel.app
```

---

## Troubleshooting

### Container não inicia

Verifique os logs no Easypanel:
```bash
# O entrypoint mostra mensagens úteis de debug
🚀 Iniciando Espeto Music...
📦 Executando migrações do banco de dados...
🔧 Gerando Prisma Client...
✅ Frontend Cliente encontrado
✅ Frontend TV encontrado
🎵 Iniciando servidor...
```

### Banco de dados perde dados após restart

Certifique-se de que o volume `/app/backend/prisma` está configurado corretamente no Easypanel.

### Erro de build

1. Verifique se todos os `package.json` estão corretos
2. Confirme que os frontends têm o script `build` configurado
3. Veja os logs de build no Easypanel

### ffmpeg não encontrado

O Dockerfile já instala ffmpeg via `apk add --no-cache ffmpeg`. Se houver erro, verifique se a imagem base `node:20-alpine` está sendo usada.

---

## Health Check

O container inclui um health check automático que verifica:
- Se o servidor está respondendo na porta 3000
- Se o endpoint `/api/health` retorna status 200
- Intervalo: 30 segundos
- Timeout: 10 segundos
- Start period: 40 segundos (tempo para inicialização)

---

## Arquitetura de Produção

```
┌─────────────────────────────────────────┐
│         Easypanel / Docker Host         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Container: espeto-music       │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Backend Express (3000)    │  │  │
│  │  │   - API Routes (/api/*)     │  │  │
│  │  │   - WebSocket               │  │  │
│  │  │   - Static Files Server     │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ┌──────────┐    ┌─────────────┐ │  │
│  │  │Frontend  │    │Frontend TV  │ │  │
│  │  │Cliente   │    │(/tv)        │ │  │
│  │  │(/)       │    │             │ │  │
│  │  └──────────┘    └─────────────┘ │  │
│  │                                   │  │
│  │  Volumes:                         │  │
│  │  - /app/backend/prisma (SQLite)   │  │
│  │  - /app/backend/downloads (MP4s)  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Port Mapping: 3000:3000                │
└─────────────────────────────────────────┘
```

---

## Comandos Úteis

### Ver logs do container
```bash
docker logs -f espeto-music
```

### Acessar shell do container
```bash
docker exec -it espeto-music sh
```

### Verificar saúde do container
```bash
docker inspect --format='{{.State.Health.Status}}' espeto-music
```

### Rebuild após mudanças
```bash
docker-compose down
docker-compose up --build
```

---

## Checklist de Deploy

- [ ] Código commitado no Git
- [ ] Dockerfile e arquivos Docker commitados
- [ ] Aplicação criada no Easypanel
- [ ] Repositório conectado
- [ ] Porta 3000 configurada
- [ ] Volumes para persistência configurados
- [ ] Deploy executado com sucesso
- [ ] Health check passando
- [ ] Frontend Cliente acessível
- [ ] Frontend TV acessível
- [ ] API respondendo
- [ ] WebSocket funcionando

---

## Suporte

Para problemas ou dúvidas sobre o deploy:

1. Verifique os logs do container no Easypanel
2. Teste localmente com `docker-compose up --build`
3. Consulte a documentação do Easypanel: https://easypanel.io/docs
4. Verifique o health check: `/api/health`
