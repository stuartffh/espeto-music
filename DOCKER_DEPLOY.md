# Deploy com Docker - Espeto Music

Guia completo para fazer deploy da aplicação usando Docker.

## 🚀 Quick Start (Produção)

```bash
# 1. Clone o repositório
git clone https://github.com/stuartffh/espeto-music.git
cd espeto-music

# 2. Configurar variáveis de ambiente
cp .env.docker .env
nano .env  # Edite com suas credenciais

# 3. Build e Start
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f

# 5. Acessar aplicação
# Frontend: https://espeto.zapchatbr.com
# Admin Login: https://espeto.zapchatbr.com/admin/login
# Admin Theme: https://espeto.zapchatbr.com/admin/theme
```

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Porta 3000 disponível
- Domínio configurado (opcional para produção)

## 🔧 Configuração Detalhada

### 1. Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# JWT Secret (OBRIGATÓRIO)
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters-here

# Mercado Pago (Opcional)
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_chave_aqui

# YouTube API (Opcional)
YOUTUBE_API_KEY=sua_chave_aqui

# Sistema
PRECO_MUSICA=5.00
MAX_MUSICAS_FILA=50
```

**Gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Build da Imagem

```bash
# Build padrão (produção)
docker-compose build

# Build com cache limpo
docker-compose build --no-cache

# Build com URL customizada
docker-compose build --build-arg VITE_API_URL=https://seu-dominio.com
```

### 3. Executar Containers

```bash
# Modo daemon (background)
docker-compose up -d

# Modo interativo (ver logs)
docker-compose up

# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## 📊 Gerenciamento

### Ver Logs

```bash
# Todos os logs
docker-compose logs

# Logs em tempo real
docker-compose logs -f

# Últimas 100 linhas
docker-compose logs --tail=100
```

### Status dos Containers

```bash
# Ver status
docker-compose ps

# Ver recursos utilizados
docker stats espeto-music
```

### Executar Comandos no Container

```bash
# Acessar shell
docker-compose exec espeto-music sh

# Executar Prisma Studio
docker-compose exec espeto-music npx prisma studio

# Ver banco de dados
docker-compose exec espeto-music ls -la /app/backend/prisma/

# Criar admin manualmente
docker-compose exec espeto-music node create-admin-production.js
```

## 🗄️ Persistência de Dados

Os dados são salvos em volumes locais:

```
./data/
├── prisma/          # Banco de dados SQLite
│   └── production.db
├── downloads/       # Músicas baixadas
└── uploads/         # Arquivos enviados
```

**Backup:**
```bash
# Backup completo
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restaurar backup
tar -xzf backup-20250115.tar.gz
```

## 🔄 Atualizações

### Atualizar Aplicação

```bash
# 1. Fazer pull das alterações
git pull

# 2. Rebuild da imagem
docker-compose build

# 3. Recriar containers
docker-compose up -d

# 4. Verificar saúde
docker-compose ps
curl http://localhost:3000/api/health
```

### Migrations do Prisma

Migrations são aplicadas automaticamente na inicialização. Para executar manualmente:

```bash
docker-compose exec espeto-music npx prisma migrate deploy
```

## 🌐 Nginx Reverse Proxy

Para expor a aplicação via HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name espeto.zapchatbr.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend Cliente
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket (se necessário)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs espeto-music

# Verificar health check
docker inspect --format='{{.State.Health.Status}}' espeto-music

# Testar build localmente
docker build -t espeto-test .
docker run -it espeto-test sh
```

### Erro "Credenciais inválidas"

```bash
# Verificar se JWT_SECRET está configurado
docker-compose exec espeto-music printenv | grep JWT_SECRET

# Recriar admin user
docker-compose exec espeto-music node create-admin-production.js

# Reiniciar container
docker-compose restart
```

### Banco de dados corrompido

```bash
# 1. Parar container
docker-compose down

# 2. Backup do banco atual
cp data/prisma/production.db data/prisma/production.db.bak

# 3. Resetar banco (CUIDADO: apaga dados)
rm data/prisma/production.db

# 4. Reiniciar (cria novo banco)
docker-compose up -d
```

### Espaço em disco cheio

```bash
# Limpar images antigas
docker image prune -a

# Limpar volumes não utilizados
docker volume prune

# Limpar tudo (CUIDADO)
docker system prune -a --volumes
```

## 📈 Monitoramento

### Health Check

O container possui health check automático:

```bash
# Ver status de saúde
docker inspect espeto-music | grep -A 10 Health

# Endpoint de health
curl http://localhost:3000/api/health
```

### Logs Estruturados

```bash
# Filtrar erros
docker-compose logs | grep -i error

# Filtrar por timestamp
docker-compose logs --since 30m

# Exportar logs
docker-compose logs > logs-$(date +%Y%m%d).txt
```

## 🔒 Segurança

### Melhores Práticas

1. **SEMPRE** use JWT_SECRET forte (min 32 caracteres)
2. **NUNCA** commite o arquivo `.env` no Git
3. Use HTTPS em produção
4. Mantenha Docker e imagens atualizados
5. Limite recursos do container se necessário

### Limitar Recursos

```yaml
# docker-compose.yml
services:
  espeto-music:
    # ... outras configurações
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Teste health check: `curl http://localhost:3000/api/health`
3. Verifique variáveis: `docker-compose config`
4. Consulte este documento para mais detalhes sobre deployment

## 📚 Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Credenciais Admin Padrão:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!
