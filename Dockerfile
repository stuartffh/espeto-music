# ============================================
# Multi-Stage Dockerfile para Espeto Music
# Otimizado para produção
# ============================================

# ============================================
# Stage 1: Build Frontend Cliente
# ============================================
FROM node:20-alpine AS frontend-cliente-builder

# Build args para variáveis VITE
ARG VITE_API_URL=https://espeto.zapchatbr.com

ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/frontend-cliente

# Copiar package files
COPY frontend-cliente/package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY frontend-cliente/ ./

# Criar .env.production
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production

# Build do frontend cliente
RUN npm run build

# ============================================
# Stage 2: Build Frontend TV
# ============================================
FROM node:20-alpine AS frontend-tv-builder

# Build args para variáveis VITE
ARG VITE_API_URL=https://espeto.zapchatbr.com

ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/frontend-tv

# Copiar package files
COPY frontend-tv/package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY frontend-tv/ ./

# Build do frontend TV
RUN npm run build

# ============================================
# Stage 3: Produção (Backend + Frontends)
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
RUN npm ci --only=production

# Copiar código fonte do backend
COPY backend/ ./

# Copiar build dos frontends
COPY --from=frontend-cliente-builder /app/frontend-cliente/dist /app/frontend-cliente/dist
COPY --from=frontend-tv-builder /app/frontend-tv/dist /app/frontend-tv/dist

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
