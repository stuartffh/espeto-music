# 🎵 Espeto Music - Visão Geral do Projeto

**Jukebox Digital para Restaurantes - Sistema Completo de Pedidos de Música**

---

## 📋 Índice

1. [Sobre o Projeto](#sobre-o-projeto)
2. [Arquitetura Atual](#arquitetura-atual)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Recursos Principais](#recursos-principais)
6. [Documentação](#documentação)
7. [Como Começar](#como-começar)
8. [Próximos Passos](#próximos-passos)

---

## 🎯 Sobre o Projeto

### O Problema

Restaurantes querem oferecer música personalizada aos clientes, mas:
- DJs são caros e limitados
- Playlists fixas são repetitivas
- Clientes querem escolher músicas

### A Solução

**Espeto Music** é um jukebox digital que permite:
- ✅ Clientes escolhem músicas do YouTube via QR Code
- ✅ Pagamento instantâneo via Mercado Pago
- ✅ Fila automática de reprodução
- ✅ TV exibe músicas e dedicatórias
- ✅ Admin gerencia tudo remotamente

### Valor de Negócio

**Para Restaurantes:**
- 💰 Nova fonte de receita (R$ 5-10 por música)
- 🎉 Engajamento dos clientes
- 📊 Analytics de preferências musicais
- ⚙️ Gestão simples via Admin Panel

**Para Clientes:**
- 🎵 Músicas favoritas no ambiente
- 💝 Dedicatórias públicas
- 📱 Experiência mobile-first
- 🎁 Gift cards para grupos

---

## 🏗️ Arquitetura Atual

### Visão Geral

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   Backend   │◀────│    Admin    │
│   (React)   │     │  (Node.js)  │     │   (React)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │     TV    │ │Database │
              │  (React)  │ │(SQLite) │
              └───────────┘ └─────────┘
```

### Fluxo Principal

1. **Cliente** escaneia QR Code da mesa
2. Busca música no YouTube
3. Adiciona ao carrinho
4. Paga via Mercado Pago / Gift Card
5. **Backend** processa e adiciona à fila
6. **TV** exibe música e dedicatória
7. **Admin** monitora em tempo real

### Comunicação

- **HTTP/REST**: API RESTful para operações CRUD
- **WebSocket**: Atualizações em tempo real (fila, player)
- **Webhooks**: Mercado Pago notifica pagamentos

---

## 🛠️ Stack Tecnológica

### Backend

```json
{
  "runtime": "Node.js v18+",
  "framework": "Express.js",
  "database": "SQLite (migrar para PostgreSQL)",
  "orm": "Prisma",
  "websocket": "Socket.io",
  "logging": "Winston",
  "monitoring": "Prometheus",
  "validation": "Zod",
  "di": "Awilix",
  "docs": "Swagger/OpenAPI 3.0"
}
```

### Frontend

```json
{
  "framework": "React 18",
  "routing": "React Router v6",
  "state": "Context API + Hooks",
  "styling": "CSS Modules + Tailwind (futuro)",
  "http": "Fetch API",
  "websocket": "socket.io-client",
  "build": "Vite"
}
```

### Infraestrutura

```json
{
  "hosting": "VPS / Cloud (AWS/GCP)",
  "container": "Docker",
  "reverse-proxy": "Nginx",
  "ci-cd": "GitHub Actions (a implementar)",
  "monitoring": "Grafana + Prometheus",
  "logs": "Winston → Files (ELK futuro)"
}
```

---

## 📁 Estrutura do Projeto

```
espeto-music/
├── backend/
│   ├── src/
│   │   ├── domain/              # Clean Architecture - Domínio
│   │   │   ├── entities/        # Pedido, Fila, GiftCard
│   │   │   ├── value-objects/   # Money, YouTubeId, Duration
│   │   │   └── repositories/    # Interfaces
│   │   ├── application/         # Casos de Uso
│   │   │   └── use-cases/       # Lógica de negócio
│   │   ├── infrastructure/      # Implementações
│   │   │   ├── database/        # Repositories Prisma
│   │   │   └── container/       # DI Container
│   │   ├── interfaces/          # Adaptadores
│   │   │   └── http/            # Controllers
│   │   ├── shared/              # Utilitários
│   │   │   ├── utils/           # Logger, helpers
│   │   │   ├── errors/          # Error classes
│   │   │   ├── validators/      # Zod schemas
│   │   │   ├── events/          # Event Bus
│   │   │   └── monitoring/      # Metrics
│   │   ├── controllers/         # Controllers legados
│   │   ├── routes/              # Rotas da API
│   │   ├── middlewares/         # Middlewares
│   │   ├── services/            # Serviços externos
│   │   ├── config/              # Configurações
│   │   ├── docs/                # Swagger docs
│   │   └── server.js            # Entry point
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── downloads/               # Músicas baixadas
│   ├── logs/                    # Winston logs
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Páginas
│   │   │   ├── Client/          # Interface cliente
│   │   │   ├── TV/              # Tela de TV
│   │   │   └── Admin/           # Painel admin
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # API calls
│   │   ├── utils/               # Helpers
│   │   └── App.jsx              # Root component
│   ├── public/
│   └── package.json
│
├── docs/                        # Documentação geral
├── ROADMAP.md                   # Plano futuro
├── TECHNICAL_DEBT.md            # Dívidas técnicas
├── PROJECT_OVERVIEW.md          # Este arquivo
└── README.md                    # Getting started
```

---

## ✨ Recursos Principais

### 1. Sistema de Pedidos
- Busca de músicas no YouTube
- Carrinho de compras
- Validação de duração (max 10min)
- Moderação de conteúdo
- Gift cards para múltiplas músicas

### 2. Pagamentos
- Mercado Pago (PIX, Cartão)
- Webhooks para confirmação
- Gift cards pré-pagos
- Histórico de transações

### 3. Fila Inteligente
- Ordenação automática (FIFO)
- Preview da próxima música
- Skip manual (admin)
- Status em tempo real

### 4. Player
- YouTube iframe API
- Controles (play, pause, stop, skip)
- Ajuste de volume
- Auto-play da próxima música
- Tela de descanso com vídeo de fundo

### 5. Moderação
- Lista de palavras proibidas
- Moderação automática de dedicatórias
- Whitelist/blacklist de canais
- Aprovação manual (futuro)

### 6. Admin Panel
- Dashboard com métricas
- Gestão de pedidos
- Controle do player
- Configurações do sistema
- Gestão de gift cards
- Histórico completo

### 7. Multi-Mesa (futuro)
- QR Code único por mesa
- Identificação automática
- Estatísticas por mesa

---

## 📚 Documentação

### Para Desenvolvedores

| Documento | Descrição | Link |
|-----------|-----------|------|
| **README.md** | Getting started, instalação | [README.md](./README.md) |
| **CLEAN_ARCHITECTURE.md** | Arquitetura do backend | [backend/CLEAN_ARCHITECTURE.md](./backend/CLEAN_ARCHITECTURE.md) |
| **Swagger API** | Documentação interativa | http://localhost:3000/api-docs |
| **TECHNICAL_DEBT.md** | Dívidas técnicas | [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) |

### Para Product/Negócio

| Documento | Descrição | Link |
|-----------|-----------|------|
| **PROJECT_OVERVIEW.md** | Visão geral (este arquivo) | [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) |
| **ROADMAP.md** | Planejamento futuro | [ROADMAP.md](./ROADMAP.md) |
| **MELHORIAS_IMPLEMENTADAS.md** | Histórico de melhorias | [backend/MELHORIAS_IMPLEMENTADAS.md](./backend/MELHORIAS_IMPLEMENTADAS.md) |

---

## 🚀 Como Começar

### Pré-requisitos

```bash
Node.js >= 18
npm >= 9
Git
```

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/stuartffh/espeto-music.git
cd espeto-music

# 2. Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed  # (opcional) dados de teste

# 3. Frontend
cd ../frontend
npm install

# 4. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Edite .env com suas chaves (Mercado Pago, YouTube)

# 5. Executar
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Acessar

- **Cliente**: http://localhost:5173
- **Admin**: http://localhost:5173/admin (user: admin, senha: admin123)
- **TV**: http://localhost:5173/tv
- **API Docs**: http://localhost:3000/api-docs
- **API**: http://localhost:3000/api

---

## 📊 Métricas Atuais

### Código

```
Total Lines: ~25,000
  Backend:   ~15,000 (Clean Architecture)
  Frontend:  ~10,000 (React)

Files: ~200
  Components: 45
  Routes: 16
  Use Cases: 5
  Entities: 3
  Controllers: 20
```

### API

```
Endpoints: 40+
Schemas: 9
Tags: 10
Authentication: JWT
Real-time: WebSocket
```

### Performance (Atual)

```
Response Time: ~150ms (p95)
Uptime: 99%+ (estimado)
Concurrent Users: ~50 (testado)
Database: SQLite (10k records ok)
```

---

## 🎯 Próximos Passos

### Imediato (1-2 semanas)
1. ✅ Implementar testes unitários básicos
2. ✅ Setup CI/CD com GitHub Actions
3. ✅ Adicionar rate limiting
4. ✅ Migrar para PostgreSQL

### Curto Prazo (1-3 meses)
1. Cache com Redis
2. PWA para cliente
3. Analytics dashboard
4. Multi-payment gateways

### Médio Prazo (3-6 meses)
1. Mobile apps (React Native)
2. IA para recomendações
3. Multi-tenant (SaaS)
4. Integrações (Spotify, etc)

### Longo Prazo (6-12+ meses)
1. Microserviços (se necessário)
2. Kubernetes deployment
3. Marketplace de temas
4. Expansão internacional

**Veja detalhes em:** [ROADMAP.md](./ROADMAP.md)

---

## 🤝 Como Contribuir

### Para Bugs
1. Abra uma issue descrevendo o problema
2. Inclua steps to reproduce
3. Screenshots se aplicável

### Para Features
1. Verifique o [ROADMAP.md](./ROADMAP.md)
2. Discuta na issue antes de implementar
3. Siga Clean Architecture pattern
4. Adicione testes
5. Atualize Swagger docs

### Code Style
```bash
# Lint
npm run lint

# Format
npm run format

# Testes
npm test
```

---

## 📞 Suporte

### Documentação
- Swagger: http://localhost:3000/api-docs
- GitHub Wiki: (a criar)

### Contato
- **Issues**: https://github.com/stuartffh/espeto-music/issues
- **Email**: suporte@espetomusic.com
- **Discord**: (a criar)

---

## 📜 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes

---

## 🏆 Status do Projeto

```
Versão Atual: v1.0.0
Status: ✅ Em Produção (Beta)
Última Atualização: 2025-10-20
Próximo Release: v1.1.0 (2025-11-01)
```

### Roadmap de Versões

- **v1.0.0** (Atual) - MVP funcional
- **v1.1.0** (Nov 2025) - Testes + CI/CD + PostgreSQL
- **v1.2.0** (Dez 2025) - Cache + PWA + Analytics
- **v2.0.0** (Q1 2026) - Mobile Apps + Multi-tenant
- **v3.0.0** (Q3 2026) - IA + Microserviços

---

## 🎉 Conquistas

✅ Clean Architecture implementada
✅ Swagger completo (40+ endpoints)
✅ WebSocket real-time
✅ Event-Driven Architecture
✅ Monitoramento (Prometheus + Winston)
✅ Dependency Injection
✅ 100% TypeScript-ready (Zod validation)

---

**Mantido por:** [@stuartffh](https://github.com/stuartffh)
**Contribuidores:** Veja [CONTRIBUTORS.md](./CONTRIBUTORS.md) (a criar)

---

_"Transformando restaurantes em experiências musicais interativas"_ 🎵
