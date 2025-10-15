# Dockerfile Multi-Stage para Espeto Music
# Otimizado para Easypanel

# ============================================
# Stage 1: Build dos Frontends
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar package.json dos frontends
COPY frontend-cliente/package*.json ./frontend-cliente/
COPY frontend-tv/package*.json ./frontend-tv/

# Instalar dependências dos frontends (incluindo devDependencies para build)
RUN cd frontend-cliente && npm install
RUN cd frontend-tv && npm install

# Copiar código fonte dos frontends
COPY frontend-cliente/ ./frontend-cliente/
COPY frontend-tv/ ./frontend-tv/

# Build dos frontends
RUN cd frontend-cliente && npm run build
RUN cd frontend-tv && npm run build

# ============================================
# Stage 2: Backend + Produção
# ============================================
FROM node:20-alpine

# Instalar ffmpeg para processamento de vídeo
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./backend/

# Instalar dependências do backend
WORKDIR /app/backend
RUN npm install --production

# Copiar código fonte do backend
COPY backend/ ./

# Copiar builds dos frontends do stage anterior
COPY --from=frontend-builder /app/frontend-cliente/dist /app/frontend-cliente/dist
COPY --from=frontend-builder /app/frontend-tv/dist /app/frontend-tv/dist

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
