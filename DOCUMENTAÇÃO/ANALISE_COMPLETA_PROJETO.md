# 🎵 ESPETO MUSIC - DOCUMENTAÇÃO INSTITUCIONAL COMPLETA

> **Sistema de Jukebox Digital Multi-Tenant com Pagamentos Integrados**
> Versão 2.0 | Última atualização: Outubro 2025

---

## 📋 ÍNDICE

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura & Tecnologias](#2-arquitetura--tecnologias)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [Funcionalidades Principais](#5-funcionalidades-principais)
6. [API & Rotas](#6-api--rotas)
7. [Comunicação Real-Time](#7-comunicação-real-time)
8. [Fluxos de Negócio](#8-fluxos-de-negócio)
9. [Frontend & Componentes](#9-frontend--componentes)
10. [Deployment & DevOps](#10-deployment--devops)
11. [Segurança & Monitoramento](#11-segurança--monitoramento)
12. [Guia de Configuração](#12-guia-de-configuração)

---

## 1. VISÃO GERAL DO PROJETO

### 1.1 O Que É?

**Espeto Music** é uma plataforma completa de jukebox digital projetada para restaurantes, bares e eventos. Permite que clientes solicitem músicas através de seus smartphones, com pagamento integrado via PIX, e exibição em tempo real em painéis de TV.

### 1.2 Principais Diferenciais

- ✅ **Multi-Tenant**: Suporte a locações temporárias isoladas
- ✅ **Real-Time**: WebSocket para sincronização instantânea
- ✅ **Pagamento Digital**: Integração completa com Mercado Pago (PIX/Cartão/Boleto)
- ✅ **Clean Architecture**: Código organizado e manutenível
- ✅ **Admin Completo**: Painel administrativo com controle total
- ✅ **Escalável**: Preparado para crescimento com Docker

### 1.3 Casos de Uso

1. **Restaurante Fixo**: Sistema principal para pedidos de música
2. **Eventos Temporários**: Casamentos, festas, corporativos
3. **Bares/Pubs**: Sistema de entretenimento interativo
4. **Estabelecimentos Multi-Unidade**: Gestão centralizada

### 1.4 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| **Total de Arquivos Backend** | ~90 arquivos JavaScript |
| **Total de Componentes React** | ~40 componentes |
| **Rotas API** | 17 grupos de endpoints |
| **Tabelas no Banco** | 15 tabelas principais |
| **Eventos WebSocket** | 12+ eventos |
| **Linhas de Código** | ~25.000+ LOC |

---

## 2. ARQUITETURA & TECNOLOGIAS

### 2.1 Stack Tecnológico

#### Backend (Node.js)

```yaml
Framework: Express.js v4.18.2
ORM: Prisma v5.7.1
Database: SQLite (dev) / PostgreSQL (prod planejado)
Real-Time: Socket.io v4.6.0
Autenticação: JWT + Bcrypt
Pagamentos: Mercado Pago SDK v2.0.9
YouTube: @distube/ytdl-core v4.16.12
Download: yt-dlp + FFmpeg
Logging: Winston v3.18.3
Metrics: Prometheus (prom-client v15.1.3)
DI Container: Awilix v12.0.5
Validation: Zod + express-validator
```

#### Frontend (React)

```yaml
Framework: React v18.2.0
Build Tool: Vite v5.0.8
Routing: React Router v6.20.1
State: Zustand v4.4.7
HTTP: Axios v1.6.2
WebSocket: Socket.io-client v4.6.0
Styling: Tailwind CSS v3.3.6
Animation: Framer Motion v12.23.24
Icons: Lucide React + React Icons
QR Codes: qrcode.react v4.2.0
```

#### DevOps & Infraestrutura

```yaml
Containerização: Docker + Docker Compose
Reverse Proxy: Nginx (recomendado)
Process Manager: PM2 (opcional)
Monitoring: Prometheus + Grafana (planejado)
CI/CD: Não implementado ainda
```

### 2.2 Arquitetura Clean (Camadas)

```
┌──────────────────────────────────────────────┐
│  INTERFACE LAYER                             │
│  ├─ Routes (Express endpoints)               │
│  ├─ Controllers (Request/Response handling)  │
│  └─ Middlewares (Auth, Error, Validation)    │
├──────────────────────────────────────────────┤
│  APPLICATION LAYER                           │
│  ├─ Use Cases (Business logic orchestration) │
│  └─ DTOs (Data Transfer Objects)             │
├──────────────────────────────────────────────┤
│  DOMAIN LAYER                                │
│  ├─ Entities (Core business objects)         │
│  ├─ Value Objects (Immutable types)          │
│  └─ Repository Interfaces                    │
├──────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                        │
│  ├─ Prisma Repositories (DB implementations) │
│  ├─ External Services (YouTube, Mercado Pago)│
│  └─ DI Container (Awilix)                    │
└──────────────────────────────────────────────┘
```

**Fluxo de Dados:**
```
Request → Route → Controller → Use Case → Repository → Database
                                  ↓
                            Domain Entity
                                  ↓
Response ← Controller ← Use Case ← Repository ← Database
```

### 2.3 Padrões de Design Implementados

- **Repository Pattern**: Abstração de acesso a dados
- **Dependency Injection**: Awilix container
- **Value Objects**: Money, YouTubeId, Duration (imutáveis)
- **Factory Pattern**: Criação de entidades complexas
- **Observer Pattern**: WebSocket events
- **Singleton Pattern**: Prisma client, Socket.io instance
- **Strategy Pattern**: Player modes (embed vs download)

---

## 3. ESTRUTURA DO PROJETO

### 3.1 Organização de Diretórios (Backend)

```
backend/
├── src/
│   ├── application/          # Camada de Aplicação
│   │   ├── dto/             # Data Transfer Objects
│   │   └── use-cases/       # Casos de uso de negócio
│   │       ├── CriarPedidoUseCase.js
│   │       ├── ProcessarPagamentoPedidoUseCase.js
│   │       ├── ObterFilaUseCase.js
│   │       ├── UsarGiftCardUseCase.js
│   │       └── locacoes/    # Multi-tenancy use cases
│   │
│   ├── domain/              # Camada de Domínio
│   │   ├── entities/        # Entidades de negócio
│   │   │   ├── Pedido.js
│   │   │   ├── Fila.js
│   │   │   ├── GiftCard.js
│   │   │   └── Locacao.js
│   │   ├── repositories/    # Interfaces de repositório
│   │   └── value-objects/   # Objetos de valor imutáveis
│   │       ├── Money.js
│   │       ├── YouTubeId.js
│   │       └── Duration.js
│   │
│   ├── infrastructure/      # Camada de Infraestrutura
│   │   ├── container/       # Dependency Injection
│   │   ├── database/
│   │   │   └── repositories/ # Implementações Prisma
│   │   └── external/        # Serviços externos
│   │
│   ├── config/             # Configurações
│   │   ├── database.js     # Prisma Client
│   │   ├── mercadopago.js  # Integração MP
│   │   └── youtube.js      # YouTube API
│   │
│   ├── controllers/        # 17 Controllers
│   ├── routes/             # 17 Routers
│   ├── services/           # 12 Serviços principais
│   ├── middlewares/        # Auth, Error, Metrics
│   ├── utils/              # Utilitários
│   └── server.js           # Entry point
│
├── prisma/
│   ├── schema.prisma       # Modelo de dados
│   └── migrations/         # Histórico de migrações
│
├── scripts/                # Seed e utilitários
├── downloads/              # Cache de vídeos
├── uploads/                # Arquivos upload
└── package.json
```

### 3.2 Organização de Diretórios (Frontend)

```
frontend/
├── src/
│   ├── pages/              # Páginas principais
│   │   ├── Cliente/
│   │   │   ├── Home.jsx              # Busca e pedidos
│   │   │   ├── Pagamento.jsx         # Checkout
│   │   │   └── LocacaoCliente.jsx    # Wrapper com customização
│   │   ├── Admin/
│   │   │   ├── Dashboard.jsx         # Stats e controle
│   │   │   ├── Locacoes.jsx          # CRUD locações
│   │   │   └── Login.jsx             # Autenticação
│   │   └── TV/
│   │       └── Panel.jsx             # Display para TV
│   │
│   ├── components/         # 30+ Componentes reutilizáveis
│   │   ├── ui/            # Primitivos (Button, Card, Input...)
│   │   ├── MusicCard.jsx
│   │   ├── QueueItem.jsx
│   │   ├── CarrinhoModal.jsx
│   │   └── AdminSidebar.jsx
│   │
│   ├── store/             # State Management (Zustand)
│   │   ├── authStore.js
│   │   ├── carrinhoStore.js
│   │   └── useStore.js
│   │
│   ├── contexts/          # React Contexts
│   │   ├── LocacaoContext.jsx  # Multi-tenancy
│   │   └── ThemeContext.jsx    # Dark/Light mode
│   │
│   ├── services/
│   │   ├── api.js         # Axios + endpoints
│   │   └── socket.js      # Socket.io singleton
│   │
│   ├── hooks/             # Custom hooks
│   ├── utils/
│   └── main.jsx           # Entry point
│
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # Service Worker
│   ├── tv-player.html     # Player standalone
│   └── icons/
│
└── package.json
```

### 3.3 Principais Arquivos (Hot Paths)

| Arquivo | Responsabilidade | LOC |
|---------|------------------|-----|
| `backend/src/server.js` | Entry point, setup Express + Socket.io | ~150 |
| `backend/src/services/playerService.js` | Controle do player, autoplay, sync | ~700 |
| `backend/src/utils/socketHandler.js` | WebSocket events, rooms | ~400 |
| `backend/prisma/schema.prisma` | Modelo de dados completo | ~500 |
| `frontend/src/App.jsx` | Rotas e providers | ~100 |
| `frontend/src/pages/TV/Panel.jsx` | Display TV (fila, player) | ~1500 |
| `frontend/src/pages/Cliente/Home.jsx` | Cliente (busca, carrinho) | ~1200 |
| `frontend/src/contexts/LocacaoContext.jsx` | Multi-tenancy | ~150 |

---

## 4. MODELO DE DADOS

### 4.1 Diagrama ER Simplificado

```
┌─────────────────┐
│   locacoes      │
│ (Multi-Tenant)  │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐     ┌──────────────┐
│ pedidos_musica  │────→│  pagamentos  │
│   (Core)        │  1:1│ (Mercado Pago)│
└────────┬────────┘     └──────────────┘
         │ 1:1
         ▼
┌─────────────────┐     ┌──────────────┐
│historico_musicas│     │ gift_cards   │
│ (Analytics)     │     │ (Promo)      │
└─────────────────┘     └──────┬───────┘
                               │
                               │ 1:1
                               ▼
                        ┌──────────────┐
                        │ carrinhos    │
                        │ (Sessions)   │
                        └──────────────┘
```

### 4.2 Tabelas Principais

#### `pedidos_musica` (Core)

```prisma
model pedidos_musica {
  id                String    @id @default(uuid())
  locacaoId         String?   // Multi-tenancy
  nomeCliente       String
  musicaTitulo      String
  musicaYoutubeId   String
  musicaThumbnail   String?
  musicaDuracao     Int?
  status            String    // pendente|pago|na_fila|tocando|tocada|cancelado
  valor             Float     @default(0)
  pagamentoId       String?   @unique
  prioridade        Boolean   @default(false)
  dedicatoria       String?
  dedicatoriaDe     String?
  posicaoFila       Int?
  criadoEm          DateTime  @default(now())
  atualizadoEm      DateTime  @updatedAt

  @@index([locacaoId])
  @@index([status])
  @@index([criadoEm])
}
```

**Status Flow:**
```
pendente → pago → na_fila → tocando → tocada
                           ↓
                      cancelado
```

#### `locacoes` (Multi-Tenancy)

```prisma
model locacoes {
  id                    String    @id @default(uuid())
  slug                  String    @unique
  nomeEvento            String
  nomeCliente           String
  emailContato          String?
  dataInicio            DateTime
  dataFim               DateTime
  ativo                 Boolean   @default(true)

  // Customização
  nomeEstabelecimento   String?
  logoUrl               String?
  corTema               String?   @default("#FF6B6B")
  mensagemBoasVindas    String?
  backgroundImageUrl    String?

  // QR Code
  qrCodeData            String?

  // Configurações (JSON)
  configuracoes         Json?

  // Stats
  totalPedidos          Int       @default(0)
  totalArrecadado       Float     @default(0)

  criadoEm              DateTime  @default(now())
  atualizadoEm          DateTime  @updatedAt
}
```

#### `pagamentos` (Mercado Pago)

```prisma
model pagamentos {
  id                      String    @id @default(uuid())
  mercadoPagoPaymentId    String?   @unique
  mercadoPagoPreferenceId String?
  status                  String    // pending|approved|rejected
  valor                   Float
  metodoPagamento         String?   // pix|credit_card|boleto

  // Pix específico
  qrCode                  String?
  qrCodeText              String?
  pixExpirationDate       DateTime?

  // Webhook data
  webhookData             Json?
  lastWebhookUpdate       DateTime?

  criadoEm                DateTime  @default(now())
  atualizadoEm            DateTime  @updatedAt

  @@index([status])
}
```

#### `gift_cards` (Promoções)

```prisma
model gift_cards {
  id                String    @id @default(uuid())
  locacaoId         String?
  codigo            String    @unique
  valor             Float?
  quantidadeMusicas Int?
  usado             Boolean   @default(false)
  ativo             Boolean   @default(true)
  dataExpiracao     DateTime?
  usadoEm           DateTime?
  usadoPor          String?
  pedidoMusicaId    String?

  criadoEm          DateTime  @default(now())

  @@index([codigo])
  @@index([locacaoId])
}
```

#### `carrinhos` (Sessões)

```prisma
model carrinhos {
  id               String    @id @default(uuid())
  locacaoId        String?
  sessionId        String    @unique
  nomeCliente      String?

  // JSON Arrays
  musicasTitulos   Json      // ["Música 1", ...]
  musicasIds       Json      // ["youtubeId1", ...]
  musicasThumbs    Json
  musicasDuracoes  Json

  valorTotal       Float     @default(0)
  quantidadeItens  Int       @default(0)
  expiraEm         DateTime  // 30 minutos

  criadoEm         DateTime  @default(now())
  atualizadoEm     DateTime  @updatedAt

  @@index([sessionId])
  @@index([expiraEm])
}
```

### 4.3 Relacionamentos & Índices

**Principais Índices (Performance):**
```sql
-- Busca de fila por locação
CREATE INDEX pedidos_musica_locacaoId_idx ON pedidos_musica(locacaoId);
CREATE INDEX pedidos_musica_status_idx ON pedidos_musica(status);

-- Busca de locações ativas
CREATE INDEX locacoes_ativo_idx ON locacoes(ativo);
CREATE INDEX locacoes_dataFim_idx ON locacoes(dataFim);

-- Gift cards por código
CREATE INDEX gift_cards_codigo_idx ON gift_cards(codigo);

-- Carrinhos expirados
CREATE INDEX carrinhos_expiraEm_idx ON carrinhos(expiraEm);
```

---

## 5. FUNCIONALIDADES PRINCIPAIS

### 5.1 Sistema de Pedidos de Música

#### Fluxo Completo

1. **Busca de Música**
   - Cliente busca por termo (ex: "Bohemian Rhapsody")
   - Sistema consulta YouTube API ou yt-search
   - Retorna: Título, Thumbnail, Duração, Canal

2. **Seleção e Carrinho**
   - Cliente seleciona música
   - Adiciona dedicatória (opcional)
   - Adiciona ao carrinho (session-based)
   - Pode adicionar múltiplas músicas

3. **Checkout**
   - Cliente fornece nome
   - Sistema calcula total
   - Cria pedidos + preferência Mercado Pago
   - Retorna QR Code PIX

4. **Pagamento**
   - Cliente escaneia QR Code
   - Paga via app do banco
   - Webhook notifica backend

5. **Confirmação**
   - Backend marca pedidos como "pago"
   - Adiciona à fila automaticamente
   - Broadcast via WebSocket
   - Cliente vê confirmação

6. **Fila e Reprodução**
   - Sistema ordena por prioridade + timestamp
   - Autoplay inicia automaticamente
   - TV exibe música tocando
   - Quando termina, avança para próxima

#### Prioridade de Músicas

```javascript
// Ordem na fila:
1. Prioridade: true → R$ 10,00
   ↓
2. Prioridade: false → R$ 5,00
   ↓
3. Dentro de cada nível: FIFO (First In, First Out)
```

#### Moderação Automática

```javascript
// Palavras proibidas por categoria
{
  categoria: "PALAVRAO",
  severidade: "ALTA",
  ativo: true
}

// Rejeição automática se:
- Título contém palavra proibida
- Dedicatória contém palavra proibida
- Severidade >= configurado
```

### 5.2 Player de Música

#### Modos de Operação

**Modo 1: Embed (Padrão)**
```javascript
// Iframe do YouTube direto
<iframe
  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
  allow="autoplay"
/>

// Vantagens:
+ Sem necessidade de download
+ Qualidade adaptativa automática
+ Sem storage local

// Desvantagens:
- Depende de conexão
- Ads podem aparecer
```

**Modo 2: Download**
```javascript
// Download via yt-dlp + FFmpeg
const video = await ytdlp.download(youtubeId, {
  format: 'best[height<=720]',
  output: '/downloads/%(id)s.%(ext)s'
});

// Vantagens:
+ Offline playback
+ Sem ads
+ Cache local

// Desvantagens:
- Requer storage (5GB limite)
- Processamento CPU
- Tempo de download
```

#### Controle do Player

```javascript
// Estado em memória (por locação)
const estadosMemoria = {
  'global': {
    musicaAtual: { id, titulo, youtubeId, ... },
    status: 'playing', // playing|paused|stopped
    tempoAtual: 120,   // segundos
    volume: 80,
    ultimaAtualizacao: Date.now()
  },
  'locacao:uuid-123': { ... }
};

// Operações disponíveis:
playerService.tocarMusica(pedido, locacaoId);
playerService.pausar(locacaoId);
playerService.retomar(locacaoId);
playerService.pular(locacaoId);
playerService.ajustarVolume(nivel, locacaoId);
playerService.buscarTempo(tempo, locacaoId);
```

#### Autoplay Robusto

```javascript
// Verificação periódica (5s)
setInterval(() => {
  const estado = getEstadoMemoria(locacaoId);

  if (estado.status !== 'playing') {
    // Buscar próxima música na fila
    const proxima = await musicaService.buscarProximaMusica(locacaoId);

    if (proxima) {
      await playerService.tocarMusica(proxima, locacaoId);
    }
  }
}, 5000);
```

### 5.3 Sistema de Pagamento (Mercado Pago)

#### Integração PIX

```javascript
// 1. Criar preferência
const preference = await mercadopago.preferences.create({
  items: [{
    title: `${quantidade} música(s) - Espeto Music`,
    quantity: 1,
    unit_price: valorTotal
  }],
  payment_methods: {
    excluded_payment_types: [
      { id: 'credit_card' },
      { id: 'debit_card' }
    ]
  },
  back_urls: {
    success: `${BASE_URL}/pagamento/sucesso`,
    failure: `${BASE_URL}/pagamento/falha`
  },
  notification_url: `${BASE_URL}/api/webhooks/mercadopago`
});

// 2. Retornar QR Code
return {
  qrCode: payment.point_of_interaction.transaction_data.qr_code_base64,
  qrCodeText: payment.point_of_interaction.transaction_data.qr_code,
  expirationDate: payment.date_of_expiration
};

// 3. Webhook recebe confirmação
POST /api/webhooks/mercadopago
{
  type: "payment",
  data: {
    id: "payment-id"
  }
}

// 4. Backend verifica e processa
const payment = await mercadopago.payment.get(paymentId);
if (payment.status === 'approved') {
  // Marcar pedidos como pagos
  // Adicionar à fila
  // Broadcast atualização
}
```

### 5.4 Gift Cards

#### Criação e Uso

```javascript
// Admin cria gift card
POST /api/admin/gifts/criar
{
  locacaoId: "uuid-123",
  valor: 50.00,
  quantidadeMusicas: 10,
  dataExpiracao: "2025-12-31"
}
↓
Response: {
  codigo: "GIFT-ABC123DEF", // Gerado automaticamente
  valor: 50.00,
  quantidadeMusicas: 10
}

// Cliente valida e usa
GET /api/gifts/validar/GIFT-ABC123DEF
↓
Response: {
  valido: true,
  valor: 50.00,
  quantidadeMusicas: 10,
  usado: false
}

POST /api/gifts/usar
{
  codigo: "GIFT-ABC123DEF",
  pedidoMusicaId: "pedido-uuid",
  nomeCliente: "João"
}
↓
// Marca gift card como usado
// Marca pedido como pago
// Adiciona à fila
```

### 5.5 Multi-Tenancy (Locações)

#### Isolamento de Dados

```javascript
// Todas queries filtradas por locacaoId
const fila = await prisma.pedidos_musica.findMany({
  where: {
    status: 'pago',
    locacaoId: locacaoId || null // null = global
  },
  orderBy: [
    { prioridade: 'desc' },
    { criadoEm: 'asc' }
  ]
});

// WebSocket rooms separadas
const roomName = locacaoId ? `locacao:${locacaoId}` : 'global';
io.to(roomName).emit('fila:atualizada', fila);
```

#### Customização por Locação

```javascript
// Cliente acessa /l/casamento-joao-maria
const locacao = await obterLocacaoPorSlug('casamento-joao-maria');

// Apply customizações
document.body.style.setProperty('--cor-tema', locacao.corTema);
document.body.style.backgroundImage = `url(${locacao.backgroundImageUrl})`;
document.title = locacao.nomeEvento;

// Exibir logo
<img src={locacao.logoUrl} alt={locacao.nomeEstabelecimento} />

// Mensagem de boas-vindas
<h1>{locacao.mensagemBoasVindas}</h1>
```

---

## 6. API & ROTAS

### 6.1 Rotas Públicas

```
GET  /api/public/config/:chave
     └─ Buscar configuração pública
     └─ Ex: /api/public/config/PRECO_MUSICA_NORMAL

GET  /api/public/locacao/:slug
     └─ Buscar dados de locação por slug
     └─ Ex: /api/public/locacao/casamento-joao

GET  /api/public/sugestoes/:categoria
     └─ Buscar sugestões de músicas
     └─ Ex: /api/public/sugestoes/rock

GET  /api/public/painel/:slugPainelTV
     └─ Buscar locação para painel TV
     └─ Ex: /api/public/painel/painel-festa-123
```

### 6.2 Rotas de Música

```
GET  /api/musicas/buscar
     ├─ Query: q (termo de busca)
     ├─ Query: maxResults (padrão: 10)
     └─ Busca no YouTube API ou yt-search

GET  /api/musicas/detalhes/:videoId
     └─ Detalhes de vídeo específico

POST /api/musicas
     ├─ Body: { musicaTitulo, musicaYoutubeId, nomeCliente, ... }
     └─ Criar pedido de música

GET  /api/musicas/fila
     ├─ Query: locacaoId (opcional)
     └─ Listar fila de músicas

GET  /api/musicas/atual
     ├─ Query: locacaoId (opcional)
     └─ Música tocando no momento

GET  /api/musicas/historico
     └─ Histórico de músicas tocadas
```

### 6.3 Rotas de Pagamento

```
POST /api/pagamentos/criar
     ├─ Body: { pedidoId }
     └─ Criar preferência Mercado Pago

POST /api/pagamentos/pix
     ├─ Body: { pedidoId, emailPagador, cpfPagador, nomePagador }
     └─ Criar pagamento PIX com QR Code

GET  /api/pagamentos/:id
     └─ Status do pagamento

GET  /api/pagamentos/check/:pedidoId
     └─ Verificar status de pedido
```

### 6.4 Rotas de Carrinho

```
GET  /api/carrinho
     └─ Ver carrinho da sessão

POST /api/carrinho/adicionar
     ├─ Body: { musicaTitulo, musicaYoutubeId, ... }
     └─ Adicionar música ao carrinho

POST /api/carrinho/remover/:youtubeId
     └─ Remover música do carrinho

PATCH /api/carrinho/nome
     ├─ Body: { nomeCliente }
     └─ Definir nome do cliente

POST /api/carrinho/finalizar
     ├─ Body: { emailPagador, cpfPagador, nomePagador }
     └─ Checkout com PIX

DELETE /api/carrinho
     └─ Limpar carrinho
```

### 6.5 Rotas de Gift Cards

```
GET  /api/gifts/validar/:codigo
     └─ Validar código de gift card

POST /api/gifts/usar
     ├─ Body: { codigo, pedidoMusicaId, nomeCliente }
     └─ Usar gift card em pedido

GET  /api/gifts (Admin)
     └─ Listar todos gift cards

POST /api/gifts (Admin)
     ├─ Body: { valor, quantidadeMusicas, dataExpiracao, ... }
     └─ Criar novo gift card

DELETE /api/gifts/:id (Admin)
     └─ Deletar gift card
```

### 6.6 Rotas de Admin

```
POST /api/auth/login
     ├─ Body: { username, password }
     └─ Autenticar admin (retorna JWT)

GET  /api/auth/me
     └─ Dados do admin autenticado

GET  /api/admin/dashboard
     └─ Estatísticas gerais

GET  /api/admin/locacoes
     └─ Listar locações

POST /api/admin/locacoes
     ├─ Body: { slug, nomeEvento, dataInicio, dataFim, ... }
     └─ Criar nova locação

PUT  /api/admin/locacoes/:id
     └─ Atualizar locação

DELETE /api/admin/locacoes/:id
     └─ Deletar locação

GET  /api/config
     └─ Listar todas configurações

PUT  /api/config/:chave
     ├─ Body: { valor }
     └─ Atualizar configuração
```

### 6.7 Rotas de Player (Admin)

```
GET  /api/player/estado
     └─ Estado atual do player

POST /api/player/pausar
     └─ Pausar música

POST /api/player/retomar
     └─ Retomar música pausada

POST /api/player/pular
     └─ Pular para próxima música

POST /api/player/volume
     ├─ Body: { volume: 0-100 }
     └─ Ajustar volume

POST /api/player/seek
     ├─ Body: { tempo: segundos }
     └─ Ir para posição específica
```

### 6.8 Rotas de Monitoramento

```
GET  /api/health
     └─ Health check (DB, downloads, memory)
     └─ Response: { status: "healthy|degraded", checks: {...} }

GET  /api/metrics
     └─ Prometheus metrics
     └─ Response: Formato Prometheus
```

### 6.9 Webhooks

```
POST /api/webhooks/mercadopago
     ├─ Body: { type, data: { id } }
     └─ Confirmação de pagamento do Mercado Pago
```

---

## 7. COMUNICAÇÃO REAL-TIME

### 7.1 Sistema de Rooms WebSocket

#### Estrutura de Rooms

```javascript
// Server mantém rooms separadas
Server
├── Room: 'global'
│   ├── Socket: cliente-web-1
│   ├── Socket: cliente-web-2
│   ├── Socket: tv-panel-global
│   └── Socket: admin-dashboard
│
├── Room: 'locacao:uuid-festa-123'
│   ├── Socket: cliente-festa-1
│   ├── Socket: cliente-festa-2
│   └── Socket: tv-panel-festa
│
└── Room: 'locacao:uuid-casamento-456'
    ├── Socket: cliente-casamento-1
    └── Socket: tv-panel-casamento
```

#### Cliente Entra em Room

```javascript
// Frontend
import { joinRoom } from './services/socket';

// Ao carregar locação
useEffect(() => {
  if (locacaoId) {
    joinRoom(locacaoId); // Entra em 'locacao:uuid'
  } else {
    joinRoom(null);      // Entra em 'global'
  }
}, [locacaoId]);

// Backend
socket.on('join:room', (data) => {
  const { locacaoId } = data;
  const roomName = locacaoId ? `locacao:${locacaoId}` : 'global';

  // Sair de room anterior
  socket.leave(socket.currentRoom);

  // Entrar em nova room
  socket.join(roomName);
  socket.currentRoom = roomName;
  socket.locacaoId = locacaoId;

  console.log(`Cliente ${socket.id} entrou na room: ${roomName}`);

  // Enviar estado inicial
  const estado = await obterEstadoInicial(locacaoId);
  socket.emit('estado:inicial', estado);
});
```

### 7.2 Eventos WebSocket

#### Cliente → Servidor

```javascript
// Solicitar estado inicial
socket.emit('request:estado-inicial', { locacaoId });

// Solicitar fila
socket.emit('request:fila', { locacaoId });

// Notificar música terminou (TV)
socket.emit('musica:terminou', {
  youtubeId: 'dQw4w9WgXcQ',
  locacaoId
});

// Notificar pedido pago (webhook)
socket.emit('pedido:pago', {
  pedidoId: 'uuid',
  locacaoId
});

// Comando de controle remoto (admin)
socket.emit('remote-control-command', {
  command: 'play|pause|skip',
  data: { ... }
});
```

#### Servidor → Cliente

```javascript
// Estado inicial (fila + música atual)
socket.on('estado:inicial', (data) => {
  setFila(data.fila);
  setMusicaAtual(data.musicaAtual);
});

// Fila atualizada
socket.on('fila:atualizada', (data) => {
  setFila(data.fila);
});

// Música atual mudou
socket.on('musica:atual', (data) => {
  setMusicaAtual(data.musica);
});

// Player: Iniciar música
socket.on('player:iniciar', (data) => {
  const { musica, estado } = data;
  // Iniciar reprodução no iframe YouTube
  playerRef.current.playVideo(musica.musicaYoutubeId);
});

// Player: Pausar
socket.on('player:pausar', (data) => {
  playerRef.current.pauseVideo();
});

// Player: Retomar
socket.on('player:retomar', (data) => {
  playerRef.current.playVideo();
});

// Player: Parar
socket.on('player:parar', (data) => {
  playerRef.current.stopVideo();
});

// Player: Sincronização de tempo
socket.on('player:sync', (data) => {
  const { tempo, status } = data;
  if (Math.abs(playerRef.current.getCurrentTime() - tempo) > 2) {
    playerRef.current.seekTo(tempo);
  }
});

// Configuração atualizada
socket.on('config:atualizada', (data) => {
  const { chave, valor } = data;
  updateConfig(chave, valor);
});
```

#### Broadcasting para Rooms

```javascript
// Backend - Broadcast apenas para room específica
const roomName = getRoomName(locacaoId); // 'global' ou 'locacao:uuid'

// Atualizar fila
io.to(roomName).emit('fila:atualizada', {
  fila: await musicaService.buscarFilaMusicas(locacaoId)
});

// Iniciar música
io.to(roomName).emit('player:iniciar', {
  musica: musicaAtual,
  estado: estadoPlayer
});

// Broadcast global (raríssimo)
io.emit('config:atualizada', {
  chave: 'MODO_GRATUITO',
  valor: 'true'
});
```

### 7.3 Axios Interceptor (Auto locacaoId)

```javascript
// Setup no main.jsx
import { setupLocacaoInterceptor } from './contexts/LocacaoContext';
setupLocacaoInterceptor();

// Implementação
axios.interceptors.request.use((config) => {
  const locacaoId = sessionStorage.getItem('locacaoId');

  if (locacaoId) {
    // POST/PUT: Adiciona no body
    if (['post', 'put'].includes(config.method)) {
      config.data = {
        ...config.data,
        locacaoId
      };
    }

    // GET/DELETE: Adiciona nos query params
    if (['get', 'delete'].includes(config.method)) {
      config.params = {
        ...config.params,
        locacaoId
      };
    }

    // Header customizado
    config.headers['X-Locacao-Id'] = locacaoId;
  }

  return config;
});

// Agora todas requests incluem locacaoId automaticamente!
```

---

## 8. FLUXOS DE NEGÓCIO

### 8.1 Fluxo Completo de Pedido

```
┌─────────────────────────────────────────────────────────┐
│ 1. CLIENTE BUSCA MÚSICA                                 │
│    GET /api/musicas/buscar?q=bohemian+rhapsody          │
│    Response: [{ id, titulo, thumbnail, duracao }]       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CLIENTE ADICIONA AO CARRINHO                         │
│    POST /api/carrinho/adicionar                         │
│    Body: { musicaTitulo, musicaYoutubeId, ... }         │
│    Response: { carrinho atualizado }                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CLIENTE FINALIZA COMPRA                              │
│    PATCH /api/carrinho/nome { nomeCliente }             │
│    POST /api/carrinho/finalizar { dados pagador }       │
│    Response: { pedidos, qrCode, valor }                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CLIENTE PAGA VIA PIX                                 │
│    - Escaneia QR Code                                   │
│    - Paga via app do banco                              │
│    - Mercado Pago processa                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. WEBHOOK CONFIRMA PAGAMENTO                           │
│    POST /api/webhooks/mercadopago                       │
│    Body: { type: "payment", data: { id } }              │
│    Backend: Marca pedidos como "pago"                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. BROADCAST FILA ATUALIZADA                            │
│    io.to(roomName).emit('fila:atualizada', fila)        │
│    Todos clientes na room recebem atualização           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. AUTOPLAY INICIA MÚSICA                               │
│    playerService.garantirAutoplay(locacaoId)            │
│    - Busca primeira música "pago" na fila               │
│    - Marca como "tocando"                               │
│    - Broadcast player:iniciar                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 8. TV EXIBE MÚSICA                                      │
│    - Recebe player:iniciar via WebSocket                │
│    - Inicia iframe YouTube                              │
│    - Exibe dedicatória, cliente, thumbnail              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 9. MÚSICA TERMINA                                       │
│    - TV emit('musica:terminou', { youtubeId })          │
│    - Backend: playerService.concluirMusica()            │
│    - Marca como "tocada"                                │
│    - Busca próxima na fila                              │
│    - Broadcast player:iniciar com próxima               │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Fluxo de Criação de Locação

```
┌─────────────────────────────────────────────────────────┐
│ 1. ADMIN ACESSA PAINEL                                  │
│    - Faz login: POST /api/auth/login                    │
│    - Recebe JWT token                                   │
│    - Navega para /admin/locacoes                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. ADMIN CRIA NOVA LOCAÇÃO                              │
│    POST /api/admin/locacoes                             │
│    Body: {                                              │
│      slug: "casamento-joao-maria",                      │
│      nomeEvento: "Casamento João & Maria",              │
│      nomeCliente: "João Silva",                         │
│      emailContato: "joao@email.com",                    │
│      dataInicio: "2025-11-01T18:00:00Z",                │
│      dataFim: "2025-11-02T02:00:00Z",                   │
│      nomeEstabelecimento: "Buffet Exemplo",             │
│      logoUrl: "https://...",                            │
│      corTema: "#FF69B4",                                │
│      mensagemBoasVindas: "Bem-vindos ao casamento!"     │
│    }                                                    │
│                                                         │
│    Backend:                                             │
│    - Valida dados                                       │
│    - Cria registro em "locacoes"                        │
│    - Gera QR Code apontando para /l/{slug}              │
│    - Retorna dados completos                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ADMIN COMPARTILHA QR CODE                            │
│    - Baixa imagem do QR Code                            │
│    - Compartilha com convidados                         │
│    - Ou imprime para colocar no local                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CONVIDADO ESCANEIA QR CODE                           │
│    - Acessa /l/casamento-joao-maria                     │
│    - Frontend: LocacaoCliente.jsx                       │
│    - GET /api/public/locacao/casamento-joao-maria       │
│    - Recebe dados da locação                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. APLICAR CUSTOMIZAÇÕES                                │
│    sessionStorage.setItem('locacaoId', locacao.id)      │
│    document.title = locacao.nomeEvento                  │
│    body.style.setProperty('--cor-tema', locacao.corTema)│
│    socket.emit('join:room', { locacaoId })              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. CONVIDADO USA SISTEMA ISOLADO                        │
│    - Busca músicas                                      │
│    - Adiciona ao carrinho                               │
│    - Paga via PIX                                       │
│    - TODAS requests incluem locacaoId automaticamente   │
│    - TODOS eventos WebSocket vão para room específica   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. TV EXIBE APENAS MÚSICAS DA LOCAÇÃO                   │
│    - Acessa /tv/painel-casamento-joao-maria-xxx         │
│    - Entra na room 'locacao:uuid-123'                   │
│    - Recebe apenas eventos dessa room                   │
│    - Fila completamente separada de outras locações     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 8. LOCAÇÃO EXPIRA                                       │
│    - Cron job verifica dataFim                          │
│    - Marca ativo=false quando expira                    │
│    - Novos clientes: Redirect para home global          │
│    - Dados mantidos para estatísticas                   │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Fluxo de Moderação

```
┌─────────────────────────────────────────────────────────┐
│ 1. ADMIN CONFIGURA PALAVRAS PROIBIDAS                   │
│    POST /api/admin/moderacao/palavras                   │
│    Body: {                                              │
│      palavra: "palavrao",                               │
│      categoria: "PALAVRAO",                             │
│      severidade: "ALTA",                                │
│      ativo: true                                        │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CLIENTE TENTA PEDIR MÚSICA                           │
│    POST /api/musicas                                    │
│    Body: {                                              │
│      musicaTitulo: "Música com palavrao",               │
│      dedicatoria: "Para meu amigo palavrao"             │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SISTEMA VALIDA COM MODERAÇÃO                         │
│    moderationService.validarPedido(dados)               │
│    - Carrega palavras proibidas do cache                │
│    - Verifica título                                    │
│    - Verifica dedicatória                               │
│    - Normaliza texto (lowercase, remove acentos)        │
│    - Busca matches exatos ou parciais                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. PALAVRA ENCONTRADA → REJEIÇÃO                        │
│    Response: 400 Bad Request                            │
│    {                                                    │
│      error: "Conteúdo inadequado detectado",            │
│      campo: "dedicatoria",                              │
│      palavrasEncontradas: ["palavrao"]                  │
│    }                                                    │
│                                                         │
│    Backend registra log:                                │
│    logger.warn('Pedido rejeitado pela moderação', {     │
│      nomeCliente, musicaTitulo, palavrasEncontradas     │
│    })                                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. FRONTEND EXIBE ERRO AO CLIENTE                       │
│    showToast('Conteúdo inadequado detectado', 'error')  │
│    - Cliente revisa pedido                              │
│    - Corrige texto problemático                         │
│    - Tenta novamente                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 9. FRONTEND & COMPONENTES

### 9.1 Hierarquia de Componentes

```
<App />
│
├── <ThemeProvider>                  # Context para dark/light mode
│   └── <LocacaoProvider>            # Context para multi-tenancy
│       │
│       ├── <ProtectedRoute>         # HOC para rotas admin
│       │   ├── <Dashboard />
│       │   │   ├── <AdminSidebar />
│       │   │   ├── <StatsCard />
│       │   │   ├── <AdminMusicControl />
│       │   │   └── UI primitivos
│       │   │
│       │   └── <Locacoes />
│       │       ├── <Card />
│       │       ├── <Input />
│       │       ├── <Modal />
│       │       └── <QRCodeCanvas />
│       │
│       ├── <Home />                 # Cliente
│       │   ├── <SearchBar />
│       │   ├── <CategoryCard />
│       │   ├── <MusicCard />
│       │   ├── <CarrinhoButton />
│       │   ├── <CarrinhoModal>
│       │   │   ├── <QueueItem />
│       │   │   └── <CheckoutPix />
│       │   ├── <Modal />
│       │   ├── <Toast />
│       │   └── <ConfettiEffect />
│       │
│       ├── <LocacaoCliente />       # Wrapper com customização
│       │   ├── Header customizado
│       │   ├── <QRCodeCanvas />
│       │   └── <Home locacao={locacao} />
│       │
│       └── <TVPanel />              # Display TV
│           ├── Música tocando (grande)
│           ├── <QueueItem /> x10
│           ├── <EqualizerAnimation />
│           └── <FullscreenOverlay />
│
└── <OfflineIndicator />             # PWA offline status
```

### 9.2 UI Components (Primitivos)

#### Button.jsx
```jsx
<Button
  variant="primary|secondary|outline|danger"
  size="sm|md|lg"
  loading={boolean}
  disabled={boolean}
  onClick={handler}
>
  Texto
</Button>

// Variantes:
- primary: Gradiente rosa/roxo
- secondary: Cinza
- outline: Borda sem preenchimento
- danger: Vermelho
```

#### Card.jsx
```jsx
<Card>
  <Card.Header>
    <h3>Título</h3>
  </Card.Header>
  <Card.Body>
    Conteúdo
  </Card.Body>
  <Card.Footer>
    Ações
  </Card.Footer>
</Card>

// Features:
- Sombra suave
- Border radius
- Padding consistente
```

#### Modal.jsx
```jsx
<Modal
  isOpen={boolean}
  onClose={handler}
  title="Título"
  size="sm|md|lg|full"
>
  Conteúdo
</Modal>

// Features:
- Overlay escuro
- Fecha com ESC
- Fecha clicando fora
- Animação de entrada/saída (Framer Motion)
```

#### Toast.jsx
```jsx
const { showToast } = useToast();

showToast('Mensagem de sucesso!', 'success');
showToast('Atenção!', 'warning');
showToast('Erro ao processar', 'error');
showToast('Informação', 'info');

// Auto-dismiss após 5s
// Posição: top-right
```

### 9.3 State Management (Zustand)

#### authStore.js
```javascript
const useAuthStore = create((set, get) => ({
  // State
  admin: null,
  token: localStorage.getItem('token'),
  loading: false,

  // Actions
  login: async (username, password) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { admin, token } = response.data;

      localStorage.setItem('token', token);
      set({ admin, token, loading: false });

      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.error };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ admin: null, token: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ admin: response.data.admin });
    } catch (error) {
      get().logout();
    }
  }
}));
```

#### carrinhoStore.js
```javascript
const useCarrinhoStore = create((set, get) => ({
  // State
  carrinho: null,
  loading: false,

  // Actions
  carregarCarrinho: async () => {
    set({ loading: true });
    const response = await api.get('/carrinho');
    set({ carrinho: response.data.carrinho, loading: false });
  },

  adicionarMusica: async (musica) => {
    set({ loading: true });
    const response = await api.post('/carrinho/adicionar', musica);
    set({ carrinho: response.data.carrinho, loading: false });
  },

  removerMusica: async (youtubeId) => {
    set({ loading: true });
    const response = await api.post(`/carrinho/remover/${youtubeId}`);
    set({ carrinho: response.data.carrinho, loading: false });
  },

  limparCarrinho: async () => {
    await api.delete('/carrinho');
    set({ carrinho: null });
  },

  finalizarCarrinho: async (dadosPagador) => {
    const response = await api.post('/carrinho/finalizar', dadosPagador);
    return response.data; // { pedidos, qrCode, ... }
  }
}));
```

### 9.4 Custom Hooks

#### useMediaQuery.js
```javascript
// Detecta breakpoints responsivos
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');
const isDesktop = useMediaQuery('(min-width: 1025px)');

// Renderização condicional
{isMobile ? <MobileView /> : <DesktopView />}
```

#### useLocalStorage.js
```javascript
// Persistência local com sync
const [theme, setTheme] = useLocalStorage('theme', 'light');

setTheme('dark'); // Salva automaticamente
// localStorage.setItem('theme', 'dark')
```

#### useToast.js
```javascript
const { toast, showToast, hideToast } = useToast();

showToast('Música adicionada!', 'success');
// Auto-dismiss após 5s
```

---

## 10. DEPLOYMENT & DEVOPS

### 10.1 Dockerfile (Multi-Stage)

```dockerfile
# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar package files
COPY frontend/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY frontend/ ./

# Build para produção
RUN npm run build

# ============================================
# Stage 2: Build Backend + Produção
# ============================================
FROM node:20-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar dependências do backend
RUN npm ci --only=production

# Copiar código do backend
COPY backend/ ./

# Copiar frontend buildado do stage anterior
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# Gerar Prisma Client
RUN npx prisma generate

# Criar diretórios necessários
RUN mkdir -p downloads uploads prisma

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Copiar entrypoint script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Comando padrão
CMD ["npm", "start"]
```

### 10.2 docker-entrypoint.sh

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando Espeto Music..."

# Aguardar banco de dados (se externo)
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Aguardando banco de dados..."
  sleep 5
fi

# Executar migrations
echo "🔄 Executando migrations..."
cd /app/backend
npx prisma migrate deploy

# Verificar se admin existe
ADMIN_EXISTS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM admins;")

if [ "$ADMIN_EXISTS" = "0" ]; then
  echo "👤 Criando admin padrão..."
  node scripts/create-admin-production.js
fi

# Seed de configurações (se necessário)
if [ "$AUTO_SEED" = "true" ]; then
  echo "🌱 Executando seed..."
  npm run seed
fi

echo "✅ Setup completo!"
echo "🎵 Iniciando servidor..."

# Executar comando passado
exec "$@"
```

### 10.3 docker-compose.yml (Produção)

```yaml
version: '3.8'

services:
  espeto-music:
    build:
      context: .
      dockerfile: Dockerfile

    container_name: espeto-music

    ports:
      - "3000:3000"

    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=file:./prisma/production.db
      - JWT_SECRET=${JWT_SECRET}
      - MERCADOPAGO_ACCESS_TOKEN=${MERCADOPAGO_ACCESS_TOKEN}
      - MERCADOPAGO_PUBLIC_KEY=${MERCADOPAGO_PUBLIC_KEY}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - FRONTEND_URL=https://espeto.zapchatbr.com
      - BASE_URL=https://espeto.zapchatbr.com
      - AUTO_SEED=false
      - LOG_LEVEL=info
      - PLAYER_MODE=embed

    volumes:
      # Persistir banco de dados
      - ./data/prisma:/app/backend/prisma

      # Cache de downloads
      - ./data/downloads:/app/backend/downloads

      # Uploads
      - ./data/uploads:/app/backend/uploads

      # Logs
      - ./data/logs:/app/backend/logs

    restart: unless-stopped

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    networks:
      - espeto-network

networks:
  espeto-network:
    driver: bridge
```

### 10.4 Variáveis de Ambiente

#### .env.example

```bash
# ============================================
# CONFIGURAÇÃO BÁSICA
# ============================================
NODE_ENV=production
PORT=3000

# ============================================
# DATABASE
# ============================================
DATABASE_URL=file:./prisma/production.db
# PostgreSQL (produção recomendado):
# DATABASE_URL=postgresql://user:password@localhost:5432/espeto_music

# ============================================
# SEGURANÇA
# ============================================
JWT_SECRET=gerar-string-aleatoria-segura-min-32-chars
# Gerar com: openssl rand -base64 32

# ============================================
# URLS
# ============================================
FRONTEND_URL=https://espeto.zapchatbr.com
BASE_URL=https://espeto.zapchatbr.com

# ============================================
# MERCADO PAGO
# ============================================
MERCADOPAGO_ACCESS_TOKEN=seu-token-aqui
MERCADOPAGO_PUBLIC_KEY=sua-public-key-aqui

# ============================================
# YOUTUBE API (Opcional)
# ============================================
YOUTUBE_API_KEY=sua-api-key-aqui
# Se não fornecido, usa yt-search (sem API key)

# ============================================
# PLAYER
# ============================================
PLAYER_MODE=embed
# Options: embed (padrão) | download

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
# Options: error | warn | info | debug

# ============================================
# SETUP INICIAL
# ============================================
AUTO_SEED=false
# true = Executa seed automático no primeiro deploy

# ============================================
# ADMIN PADRÃO (Primeira instalação)
# ============================================
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
# ⚠️ TROCAR APÓS PRIMEIRO LOGIN!
```

### 10.5 Deploy Steps

#### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/espeto-music.git
cd espeto-music

# 2. Configure variáveis de ambiente
cp .env.example .env
nano .env  # Editar com valores reais

# 3. Crie diretórios de dados
mkdir -p data/{prisma,downloads,uploads,logs}

# 4. Build e start
docker-compose up -d --build

# 5. Verificar logs
docker-compose logs -f

# 6. Acessar
# http://localhost:3000
```

#### Opção 2: Deploy Manual

```bash
# 1. Build frontend
cd frontend
npm install
npm run build

# 2. Setup backend
cd ../backend
npm install
npx prisma generate
npx prisma migrate deploy

# 3. Criar admin
node scripts/create-admin-production.js

# 4. Seed (opcional)
npm run seed

# 5. Start com PM2
pm2 start src/server.js --name espeto-music
pm2 save
pm2 startup
```

#### Opção 3: Deploy com Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/espeto-music
server {
    listen 80;
    server_name espeto.zapchatbr.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name espeto.zapchatbr.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/espeto.zapchatbr.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/espeto.zapchatbr.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/espeto-music-access.log;
    error_log /var/log/nginx/espeto-music-error.log;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/espeto-music /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obter certificado SSL
sudo certbot --nginx -d espeto.zapchatbr.com
```

---

## 11. SEGURANÇA & MONITORAMENTO

### 11.1 Autenticação & Autorização

#### Admin (JWT)

```javascript
// Login
POST /api/auth/login
{
  username: "admin",
  password: "senha-segura"
}
↓
Response: {
  admin: { id, username, nome, email },
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Uso em rotas protegidas
router.get('/admin/dashboard', authMiddleware, controller.dashboard);
```

#### Cliente (Session ID)

```javascript
// Geração de session ID
const getSessionId = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  return `session_${ip}`;
};

// Rastreamento de carrinho
const carrinho = await prisma.carrinhos.findUnique({
  where: { sessionId: getSessionId(req) }
});
```

### 11.2 Validação de Input

```javascript
// Com Zod (Use Cases)
const CriarPedidoSchema = z.object({
  musicaTitulo: z.string().min(1).max(200),
  musicaYoutubeId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  nomeCliente: z.string().min(2).max(100),
  prioridade: z.boolean().optional(),
  dedicatoria: z.string().max(500).optional(),
});

// Com express-validator (Controllers)
router.post('/musicas',
  body('musicaTitulo').trim().notEmpty().isLength({ max: 200 }),
  body('musicaYoutubeId').matches(/^[a-zA-Z0-9_-]{11}$/),
  body('nomeCliente').trim().notEmpty().isLength({ max: 100 }),
  validationMiddleware, // Check errors
  controller.criar
);
```

### 11.3 Rate Limiting

```javascript
// Por IP
const rateLimitMap = new Map();

const rateLimitMiddleware = (limit = 100, window = 60000) => {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + window });
      return next();
    }

    const data = rateLimitMap.get(ip);

    if (now > data.resetAt) {
      data.count = 1;
      data.resetAt = now + window;
      return next();
    }

    if (data.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests'
      });
    }

    data.count++;
    next();
  };
};

// Aplicar em rotas sensíveis
router.post('/musicas', rateLimitMiddleware(10, 60000), controller.criar);
```

### 11.4 Security Headers (Helmet)

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["https://www.youtube.com"],
      connectSrc: ["'self'", "wss:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 11.5 CORS

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://espeto.zapchatbr.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Locacao-Id']
}));
```

### 11.6 Logging (Winston)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console (desenvolvimento)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // Arquivo de erros
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),

    // Arquivo geral
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Uso
logger.info('Servidor iniciado', { port: 3000 });
logger.error('Erro ao processar pagamento', { error, pedidoId });
logger.warn('Rate limit atingido', { ip });
logger.debug('Debug info', { data });
```

### 11.7 Health Check

```javascript
GET /api/health
↓
Response: {
  "status": "healthy",        // healthy | degraded
  "timestamp": "2025-10-25T15:30:00.000Z",
  "uptime": 3600,             // segundos
  "serverStartTime": 1729868400000,
  "checks": {
    "database": true,         // Conexão com DB OK
    "downloads": true,        // Serviço de downloads OK
    "memory": true            // Memória dentro do limite
  },
  "memory": {
    "heapUsed": "120 MB",
    "heapTotal": "256 MB",
    "rss": "350 MB"
  },
  "database": {
    "connected": true,
    "responseTime": "15ms"
  }
}
```

### 11.8 Prometheus Metrics

```javascript
const promClient = require('prom-client');
const register = new promClient.Registry();

// Metrics padrão
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const totalRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware para coletar
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);

    totalRequests
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });

  next();
});

// Endpoint
app.get('/api/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

---

## 12. GUIA DE CONFIGURAÇÃO

### 12.1 Configurações Dinâmicas (Admin)

| Chave | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `MODO_GRATUITO` | boolean | true | Sistema grátis ou pago |
| `PRECO_MUSICA_NORMAL` | float | 5.00 | Preço música normal (R$) |
| `PRECO_MUSICA_PRIORITARIA` | float | 10.00 | Preço música prioritária (R$) |
| `TEMPO_MAXIMO_MUSICA` | int | 8 | Duração máxima (minutos) |
| `PERMITIR_DEDICATORIA` | boolean | true | Permitir dedicatórias |
| `SEARCH_FILTER_KEYWORD` | string | "musica" | Palavra adicionada em buscas |
| `MODERACAO_ATIVA` | boolean | true | Ativar filtro de palavras |
| `MAX_MUSICAS_FILA` | int | 50 | Limite da fila |
| `RENOVAR_SUGESTOES` | int | 24 | Renovar sugestões (horas) |
| `NOME_ESTABELECIMENTO` | string | "Espeto Music" | Nome do local |
| `LOGO_URL` | string | null | URL do logo |
| `MENSAGEM_BOAS_VINDAS` | string | "Bem-vindo!" | Mensagem inicial |
| `VIDEO_DESCANSO_URL` | string | null | Vídeo quando sem músicas |
| `VIDEO_DESCANSO_ATIVO` | boolean | false | Ativar vídeo de descanso |
| `SLOGAN` | string | "Seu Jukebox Digital" | Slogan do sistema |
| `COR_TEMA` | string | "#FF6B6B" | Cor primária (hex) |

### 12.2 Gerenciar Configurações

#### Via API

```javascript
// Listar todas
GET /api/config
Response: [
  { chave: "MODO_GRATUITO", valor: "true", descricao: "...", tipo: "boolean" },
  { chave: "PRECO_MUSICA_NORMAL", valor: "5.00", descricao: "...", tipo: "float" },
  ...
]

// Atualizar uma
PUT /api/config/MODO_GRATUITO
Body: { valor: "false" }
Response: { chave: "MODO_GRATUITO", valor: "false" }

// Broadcast via WebSocket
io.emit('config:atualizada', { chave: 'MODO_GRATUITO', valor: 'false' });
```

#### Via Painel Admin

```
1. Login em /admin
2. Navegar para "Configurações"
3. Editar valor desejado
4. Salvar
5. Broadcast automático para todos clientes
```

#### Via Banco de Dados (Emergência)

```sql
-- Ver todas
SELECT * FROM configuracoes;

-- Atualizar
UPDATE configuracoes
SET valor = 'false'
WHERE chave = 'MODO_GRATUITO';
```

### 12.3 Palavras Proibidas (Moderação)

```javascript
// Adicionar palavra
POST /api/admin/moderacao/palavras
{
  palavra: "palavrao",
  categoria: "PALAVRAO",
  severidade: "ALTA",
  ativo: true
}

// Severidades:
- LEVE: Aviso, mas permite
- MEDIA: Bloqueia se configurado
- ALTA: Sempre bloqueia

// Categorias sugeridas:
- PALAVRAO
- OFENSIVO
- SPAM
- INAPROPRIADO
```

### 12.4 Primeiro Deploy

```bash
# 1. Setup inicial
docker-compose up -d --build

# 2. Acessar container
docker exec -it espeto-music bash

# 3. Criar admin manualmente (se auto-seed=false)
node scripts/create-admin-production.js

# 4. Seed de configurações
npm run seed:config

# 5. Seed de palavras proibidas
npm run seed:moderation

# 6. Verificar saúde
curl http://localhost:3000/api/health

# 7. Acessar sistema
# http://localhost:3000

# 8. Login admin
# /admin
# Username: admin
# Password: admin123 (TROCAR IMEDIATAMENTE!)

# 9. Configurar Mercado Pago
# Admin Panel > Configurações > Adicionar tokens

# 10. Testar fluxo completo
# Buscar música > Adicionar > Pagar (modo teste) > Verificar fila
```

---

## 📚 REFERÊNCIAS ADICIONAIS

### Documentação Complementar

- `LOCACOES.md` - Sistema de multi-tenancy detalhado
- `backend/CLEAN_ARCHITECTURE.md` - Padrões arquiteturais
- `DOCKER_DEPLOY.md` - Containerização
- `backend/WEBHOOK.md` - Integração Mercado Pago
- `TECHNICAL_DEBT.md` - Dívida técnica
- `ROADMAP.md` - Próximos passos

### Links Úteis

- **GitHub**: https://github.com/stuartffh/espeto-music
- **Mercado Pago Docs**: https://www.mercadopago.com.br/developers
- **YouTube API**: https://developers.google.com/youtube/v3
- **Prisma**: https://www.prisma.io/docs
- **Socket.io**: https://socket.io/docs/v4
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

---

## ✅ CHECKLIST DE DEPLOY

```
PRÉ-DEPLOY:
☐ Configurar .env com valores de produção
☐ Trocar JWT_SECRET para valor seguro
☐ Configurar tokens do Mercado Pago
☐ Definir URLs corretas (FRONTEND_URL, BASE_URL)
☐ Configurar SSL/HTTPS
☐ Revisar configurações de CORS

DEPLOY:
☐ Build Docker image
☐ Executar migrations (prisma migrate deploy)
☐ Criar admin inicial
☐ Seed de configurações
☐ Verificar health check
☐ Testar WebSocket connectivity

PÓS-DEPLOY:
☐ Trocar senha do admin padrão
☐ Configurar backup automático do banco
☐ Configurar monitoramento (Prometheus/Grafana)
☐ Testar fluxo completo de pedido
☐ Testar pagamento em ambiente de produção
☐ Verificar logs sem erros
☐ Configurar alertas de erro

SEGURANÇA:
☐ Ativar rate limiting
☐ Configurar firewall
☐ Ativar logs de auditoria
☐ Revisar permissões de arquivos
☐ Configurar HTTPS obrigatório
☐ Ativar moderação de conteúdo

OTIMIZAÇÃO:
☐ Configurar CDN para assets estáticos
☐ Ativar gzip/brotli no Nginx
☐ Configurar cache de queries
☐ Limitar tamanho de uploads
☐ Configurar limpeza automática de cache
```

---

## 🎯 CONCLUSÃO

**Espeto Music** é uma aplicação robusta, escalável e bem arquitetada que implementa:

✅ **Clean Architecture** com separação clara de responsabilidades
✅ **Multi-tenancy** para eventos temporários isolados
✅ **Real-time** com WebSocket e sistema de rooms
✅ **Pagamento integrado** com Mercado Pago (PIX/Cartão/Boleto)
✅ **Admin completo** com controle total do sistema
✅ **Moderação** automática de conteúdo
✅ **PWA** com suporte offline (opcional)
✅ **Docker** para deploy simplificado
✅ **Monitoramento** com Health Check e Prometheus
✅ **Documentação** completa e atualizada

### Próximos Passos Recomendados

1. **Migração para PostgreSQL** (Prioridade: ALTA)
2. **Implementação de Testes** (Prioridade: ALTA)
3. **CI/CD Pipeline** (Prioridade: ALTA)
4. **TypeScript** (Prioridade: MÉDIA)
5. **Analytics Avançado** (Prioridade: MÉDIA)

---

**Versão**: 2.0
**Última Atualização**: Outubro 2025
**Mantenedor**: Equipe Espeto Music

Para dúvidas ou suporte, consulte a documentação técnica complementar ou abra uma issue no GitHub.
