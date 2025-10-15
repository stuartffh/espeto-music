# Dockerfile Multi-Stage para Espeto Music
# Otimizado para Easypanel

# ============================================
# Stage 1: Build do Frontend Unificado
# ============================================
FROM node:20-alpine AS frontend-builder

# Build args para variáveis VITE (serão injetadas durante o build)
ARG VITE_API_URL
ARG VITE_WEBSOCKET_URL
ARG VITE_MERCADOPAGO_PUBLIC_KEY

# Expor como variáveis de ambiente para o Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_MERCADOPAGO_PUBLIC_KEY=$VITE_MERCADOPAGO_PUBLIC_KEY

WORKDIR /app

# Copiar package.json do frontend unificado
COPY frontend/package*.json ./frontend/

# Instalar dependências do frontend (incluindo devDependencies para build)
RUN cd frontend && npm install

# Copiar código fonte do frontend
COPY frontend/ ./frontend/

# Build do frontend unificado (variáveis VITE_* serão "queimadas" no código)
RUN cd frontend && npm run build

# ============================================
# Stage 2: Backend + Produção
# ============================================
FROM node:20-slim

# Instalar dependências necessárias (ffmpeg, Python3 e yt-dlp para downloads)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    openssl \
    ca-certificates \
    && pip3 install --no-cache-dir yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./backend/

# Instalar dependências do backend
WORKDIR /app/backend
RUN npm install --production

# Copiar código fonte do backend
COPY backend/ ./

# Copiar build do frontend unificado do stage anterior
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Criar diretórios necessários
RUN mkdir -p /app/backend/downloads /app/backend/prisma

# Copiar schema do Prisma se existir
COPY backend/prisma ./prisma

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:./prisma/dev.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Script de inicialização
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Comando de inicialização
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
