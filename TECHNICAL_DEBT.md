# 🔧 Technical Debt & Melhorias Técnicas

Análise de dívidas técnicas e oportunidades de melhoria no Espeto Music.

---

## 🚨 Dívidas Técnicas Críticas

### 1. Database (SQLite → PostgreSQL)

**Problema Atual:**
- SQLite não é adequado para produção multi-usuário
- Sem suporte a conexões concorrentes robustas
- Sem replicação nativa
- Limitações de performance em alta carga

**Solução:**
```javascript
// Migração gradual
// 1. Setup PostgreSQL
// 2. Dual-write (SQLite + PostgreSQL)
// 3. Verificar consistência
// 4. Migrar reads para PostgreSQL
// 5. Deprecar SQLite

// Prisma suporta facilmente:
datasource db {
  provider = "postgresql"  // Era sqlite
  url      = env("DATABASE_URL")
}
```

**Benefícios:**
- 10x+ performance em queries complexas
- Suporte a JSON nativo (JSONB)
- Full-text search nativo
- Replicação e backups

**Esforço:** 3-4 semanas
**Prioridade:** 🔴 ALTA

---

### 2. Falta de Testes

**Problema Atual:**
- 0% code coverage
- Deploy sem validação automática
- Risco de regressões
- Difícil refatorar com segurança

**Solução:**
```javascript
// Jest para testes unitários
describe('Money Value Object', () => {
  it('deve somar valores corretamente', () => {
    const a = new Money(10);
    const b = new Money(5);
    expect(a.add(b).amount).toBe(15);
  });

  it('deve rejeitar valores negativos', () => {
    expect(() => new Money(-10)).toThrow();
  });
});

// Supertest para testes de API
describe('POST /api/pedidos', () => {
  it('deve criar pedido válido', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({
        musicaTitulo: 'Test',
        musicaYoutubeId: 'dQw4w9WgXcQ',
        valor: 5.00
      });
    expect(res.status).toBe(201);
  });
});
```

**Cobertura Target:**
- Value Objects: 100%
- Entities: 90%
- Use Cases: 85%
- Controllers: 70%
- Total: 80%+

**Esforço:** 6-8 semanas
**Prioridade:** 🔴 ALTA

---

### 3. Sem CI/CD

**Problema Atual:**
- Deploy manual (propenso a erros)
- Sem validação antes de merge
- Sem ambiente de staging
- Rollback manual

**Solução:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy para staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          # Deploy para production
```

**Esforço:** 2-3 semanas
**Prioridade:** 🟡 MÉDIA-ALTA

---

## ⚠️ Dívidas Técnicas Médias

### 4. Sem Cache

**Problema:**
- Configurações lidas do DB a cada request
- Fila consultada frequentemente
- YouTube API chamada para mesmas músicas

**Solução:**
```javascript
// Redis cache
const redis = require('redis');
const client = redis.createClient();

// Cache de configurações (5min)
async function getConfig(chave) {
  const cached = await client.get(`config:${chave}`);
  if (cached) return JSON.parse(cached);

  const config = await prisma.configuracoes.findUnique({ where: { chave } });
  await client.setex(`config:${chave}`, 300, JSON.stringify(config));
  return config;
}

// Cache de busca YouTube (1h)
async function searchYouTube(query) {
  const cached = await client.get(`yt:${query}`);
  if (cached) return JSON.parse(cached);

  const results = await youtubeApi.search(query);
  await client.setex(`yt:${query}`, 3600, JSON.stringify(results));
  return results;
}
```

**Benefícios:**
- 50-90% redução de queries ao banco
- Response time 5-10x mais rápido
- Menos chamadas à API YouTube (economia)

**Esforço:** 2 semanas
**Prioridade:** 🟡 MÉDIA

---

### 5. Download Service Síncrono

**Problema:**
- Download de vídeo bloqueia request
- Timeout em músicas grandes
- Usuário espera

**Solução:**
```javascript
// Message Queue com RabbitMQ
const amqp = require('amqplib');

// Producer (quando pedido é pago)
async function enqueueDownload(pedidoId, youtubeId) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.assertQueue('downloads');

  channel.sendToQueue('downloads', Buffer.from(JSON.stringify({
    pedidoId,
    youtubeId,
    timestamp: Date.now()
  })));
}

// Consumer (worker separado)
async function processDownloads() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.assertQueue('downloads');

  channel.consume('downloads', async (msg) => {
    const { pedidoId, youtubeId } = JSON.parse(msg.content.toString());

    try {
      await downloadYouTubeVideo(youtubeId);
      await markPedidoReady(pedidoId);
      channel.ack(msg);
    } catch (error) {
      // Retry 3x, depois dead letter queue
      channel.nack(msg, false, msg.fields.deliveryTag < 3);
    }
  });
}
```

**Esforço:** 3 semanas
**Prioridade:** 🟡 MÉDIA

---

### 6. Logs Não Estruturados

**Problema:**
- console.log misturado com Winston
- Difícil buscar/filtrar
- Sem correlation IDs

**Solução:**
```javascript
// Middleware para correlation ID
app.use((req, res, next) => {
  req.correlationId = uuidv4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
});

// Logger com contexto
logger.info('Pedido criado', {
  correlationId: req.correlationId,
  pedidoId: pedido.id,
  userId: req.user?.id,
  ip: req.ip,
  userAgent: req.get('user-agent')
});

// ELK Stack para centralizar
// Elasticsearch + Logstash + Kibana
// Busca: correlationId:abc-123
```

**Esforço:** 1-2 semanas
**Prioridade:** 🟢 BAIXA-MÉDIA

---

## 💡 Melhorias de Código

### 7. Duplicação de Lógica

**Problemas:**
- Controllers antigos + novos (Clean Architecture)
- Lógica de validação duplicada
- Formatação de response duplicada

**Solução:**
```javascript
// Migração completa para Clean Architecture

// ANTES (controller antigo)
router.post('/pedidos', async (req, res) => {
  // Validação manual
  if (!req.body.musicaTitulo) {
    return res.status(400).json({ erro: 'Título obrigatório' });
  }

  // Lógica de negócio no controller
  const pedido = await prisma.pedidos_musica.create({
    data: req.body
  });

  res.json(pedido);
});

// DEPOIS (Clean Architecture)
router.post('/pedidos', async (req, res, next) => {
  const useCase = req.container.resolve('criarPedidoUseCase');
  const resultado = await useCase.execute(req.body);
  res.status(201).json(resultado);
});
```

**Plano:**
1. Migrar todas as rotas para Clean Architecture
2. Deprecar controllers antigos
3. Remover código legacy

**Esforço:** 4-6 semanas
**Prioridade:** 🟡 MÉDIA

---

### 8. Environment Variables Hardcoded

**Problema:**
```javascript
// Valores hardcoded espalhados
const VALOR_MUSICA = 5.00;
const TEMPO_SESSAO = 30 * 60 * 1000;
```

**Solução:**
```javascript
// Centralizar em config
// src/config/index.js
module.exports = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  music: {
    defaultPrice: parseFloat(process.env.MUSIC_PRICE) || 5.00,
    maxDuration: parseInt(process.env.MAX_DURATION) || 600
  },
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
};

// Uso
const config = require('../config');
const valor = config.music.defaultPrice;
```

**Esforço:** 1 semana
**Prioridade:** 🟢 BAIXA

---

## 🔒 Segurança

### 9. Rate Limiting

**Problema:**
- Sem proteção contra spam
- API aberta para abuse
- Custos descontrolados (YouTube API)

**Solução:**
```javascript
const rateLimit = require('express-rate-limit');

// Geral - 100 req/15min por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde'
}));

// Busca de músicas - 30 req/15min
app.use('/api/musicas/buscar', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
}));

// Login - 5 tentativas/15min
app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
}));
```

**Esforço:** 3 dias
**Prioridade:** 🟡 MÉDIA

---

### 10. Input Validation

**Problema:**
- Validação inconsistente
- Alguns endpoints sem Zod
- Possível SQL injection (Prisma protege, mas...)

**Solução:**
```javascript
// Aplicar Zod em TODOS os endpoints
const { validate, schemas } = require('../shared/validators');

router.post('/pedidos',
  validate(schemas.criarPedidoSchema),
  controller.criar
);

// Sanitização
const sanitize = require('sanitize-html');

function sanitizeInput(texto) {
  return sanitize(texto, {
    allowedTags: [],
    allowedAttributes: {}
  });
}
```

**Esforço:** 2 semanas
**Prioridade:** 🟡 MÉDIA

---

## 📊 Monitoramento

### 11. Alertas Proativos

**Problema:**
- Descobrimos problemas quando usuários reclamam
- Sem alertas de erros
- Sem SLA monitoring

**Solução:**
```javascript
// Sentry para error tracking
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Alertas automáticos
// - Error rate > 5%: Slack alert
// - Response time > 1s: PagerDuty
// - Memory > 80%: Email
// - Disk > 90%: Critical alert

// Prometheus + AlertManager
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        annotations:
          summary: "API error rate acima de 5%"
```

**Esforço:** 2 semanas
**Prioridade:** 🟡 MÉDIA

---

## 🏗️ Arquitetura

### 12. Monolito → Microserviços (Futuro)

**Quando migrar:**
- 10+ restaurantes simultâneos
- 100k+ usuários ativos
- Equipe > 10 desenvolvedores

**Serviços Candidatos:**
```
┌─────────────────┐
│   API Gateway   │  (Kong/AWS API Gateway)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Music │ │Payment│
│Service│ │Service│
└───┬───┘ └───┬───┘
    │         │
┌───▼───┐ ┌───▼───┐
│Player │ │ Notif │
│Service│ │Service│
└───────┘ └───────┘
```

**Vantagens:**
- Escalabilidade independente
- Deploy isolado
- Tecnologias diferentes por serviço
- Resiliência (um cai, outros continuam)

**Desvantagens:**
- Complexidade 10x maior
- Custos operacionais maiores
- Debugging distribuído difícil
- Transações distribuídas complexas

**Recomendação:** **NÃO migrar ainda**. Esperar atingir limitações do monolito.

---

## 📈 Performance

### 13. Database Query Optimization

**Problemas Comuns:**
```sql
-- N+1 Query Problem
SELECT * FROM pedidos_musica;
-- Para cada pedido:
SELECT * FROM gift_card WHERE id = ?;

-- Sem índices
SELECT * FROM pedidos_musica WHERE musica_youtube_id = ?;
-- Full table scan!
```

**Soluções:**
```javascript
// Include para evitar N+1
const pedidos = await prisma.pedidos_musica.findMany({
  include: {
    gift_card: true,
    carrinho: true
  }
});

// Índices no Prisma
model pedidos_musica {
  // ...
  @@index([musica_youtube_id])
  @@index([status_pagamento, status_musica])
  @@index([criado_em])
}

// Paginação
const pedidos = await prisma.pedidos_musica.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { criado_em: 'desc' }
});
```

**Esforço:** 1 semana
**Prioridade:** 🟡 MÉDIA

---

## 🎯 Priorização de Dívidas Técnicas

### Matriz Esforço vs Impacto

```
Alto Impacto │
             │  2. Testes    1. PostgreSQL
             │  3. CI/CD
             │                4. Cache
Impacto      │                9. Rate Limit
             │  7. Clean
             │  Architecture  5. Async Downloads
             │
Baixo Impacto│  8. Config     6. Logs
             │  10. Validation 11. Alertas
             │                13. DB Optimization
             └──────────────────────────────────
               Baixo Esforço    Alto Esforço
```

### Ordem Sugerida:

**Sprint 1-2 (4 semanas):**
1. Setup de testes básicos
2. CI/CD pipeline
3. Rate limiting
4. Input validation completa

**Sprint 3-4 (4 semanas):**
5. Migração PostgreSQL
6. Redis cache
7. Async downloads

**Sprint 5-6 (4 semanas):**
8. Logs estruturados
9. Alertas proativos
10. Clean Architecture migration

---

## 💰 Custo da Não-Ação

### Se NÃO resolver dívidas técnicas:

**Curto Prazo (3-6 meses):**
- Bugs em produção: 2-3x mais frequentes
- Tempo de deploy: 2h → 4h (manual, com medo)
- Onboarding: 2 semanas → 1 mês (código confuso)

**Médio Prazo (6-12 meses):**
- Impossível escalar além de 10k usuários
- SQLite corrompe dados
- Turnover de devs (código legacy frustrante)
- Cliente abandona por instabilidade

**Longo Prazo (12+ meses):**
- Reescrever do zero (6-12 meses, R$ 500k+)
- Perda de market share
- Reputação danificada

### ROI de Resolver Dívidas:

**Investimento:** R$ 150k (6 meses, 2 devs)

**Retorno:**
- 50% menos bugs → menos suporte → -R$ 20k/ano
- 10x mais rápido → mais usuários → +R$ 100k/ano
- Escala para 100k users → +R$ 500k/ano
- Devs felizes → menos turnover → -R$ 80k/ano

**ROI:** 4x em 1 ano

---

## ✅ Quick Wins (Fazer AGORA)

### Semana 1:
- [ ] Adicionar rate limiting (3h)
- [ ] Centralizar env vars (4h)
- [ ] Adicionar correlation IDs (2h)
- [ ] Setup Sentry (1h)

### Semana 2:
- [ ] Primeiros testes unitários (Value Objects)
- [ ] GitHub Actions básico (lint + build)
- [ ] Documentar dívidas no README

### Semana 3-4:
- [ ] Setup Redis local
- [ ] Cache de configurações
- [ ] Índices no banco

**Total:** 1 mês para quick wins
**Impacto:** 30% mais estável

---

**Última atualização:** 2025-10-20
**Próxima revisão:** 2025-11-20
