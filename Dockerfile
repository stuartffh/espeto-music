# ============================================
# Multi-Stage Dockerfile para Espeto Music
# Otimizado para produção
# ============================================

# ============================================
# Stage 1: Build Frontend (Completo: Cliente + Admin + TV)
# ============================================
FROM node:20-alpine AS frontend-builder

# Build args para variáveis VITE
ARG VITE_API_URL=https://espeto.zapchatbr.com

ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/frontend

# Copiar package files
COPY frontend/package*.json ./

# Instalar dependências
RUN npm install --production=false

# Copiar código fonte
COPY frontend/ ./

# Criar .env.production
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production

# Build do frontend
RUN npm run build

# ============================================
# Stage 2: Produção (Backend + Frontend)
# ============================================
FROM node:20-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    openssl \
    ca-certificates \
    curl \
    && pip3 install --break-system-packages --no-cache-dir yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar apenas dependências de produção
RUN npm install --only=production

# Copiar código fonte do backend
COPY backend/ ./

# Copiar build do frontend para o local correto (backend espera em ../frontend/dist)
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Criar diretórios necessários
RUN mkdir -p /app/backend/downloads \
    && mkdir -p /app/backend/prisma \
    && mkdir -p /app/backend/uploads

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:./prisma/production.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Script de inicialização
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Comando de inicialização
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
