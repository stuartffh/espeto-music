# 🚀 PLANO DE MIGRAÇÃO PARA SAAS MULTI-TENANT

## 📋 VISÃO GERAL

Transformar o Espeto Music de sistema single-tenant para **SaaS multi-tenant**, permitindo:
- **1 Super Admin** gerenciar todos estabelecimentos
- **Múltiplos Estabelecimentos** isolados
- **Múltiplas TVs** por estabelecimento
- **Clientes** acessam via QR Code específico do estabelecimento

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│              SUPER ADMIN (superadmin.espeto.com)         │
│  - Cria estabelecimentos                                 │
│  - Gerencia planos                                       │
│  - Visualiza estatísticas globais                        │
│  - Configura limites por plano                          │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Estabelec. │  │  Estabelec. │  │  Estabelec. │
    │      1      │  │      2      │  │      N      │
    │─────────────│  │─────────────│  │─────────────│
    │ Admin Local │  │ Admin Local │  │ Admin Local │
    │ Config      │  │ Config      │  │ Config      │
    │ Tema        │  │ Tema        │  │ Tema        │
    │─────────────│  │─────────────│  │─────────────│
    │ TV 1, TV 2  │  │ TV 1        │  │ TV 1, 2, 3  │
    │─────────────│  │─────────────│  │─────────────│
    │ Clientes    │  │ Clientes    │  │ Clientes    │
    │ (QR Code)   │  │ (QR Code)   │  │ (QR Code)   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🗄️ MUDANÇAS NO BANCO DE DADOS

### ✅ Novos Models

#### 1. **SuperAdmin**
```prisma
model SuperAdmin {
  id       String @id @default(uuid())
  username String @unique
  password String
  nome     String
  email    String @unique
  ativo    Boolean @default(true)
}
```

#### 2. **Estabelecimento** (Tenant)
```prisma
model Estabelecimento {
  id                String @id @default(uuid())
  nome              String
  slug              String @unique // URL amigável
  codigo            String @unique // Código de acesso rápido
  email             String?
  ativo             Boolean @default(true)
  plano             String @default("basico")
  limiteTVs         Int @default(2)
  limiteMusicasMes  Int @default(1000)
  adminNome         String
  adminEmail        String
}
```

#### 3. **TV** (Terminal)
```prisma
model TV {
  id                   String @id @default(uuid())
  estabelecimentoId    String
  nome                 String
  codigo               String @unique // Para autenticação
  ativo                Boolean @default(true)
  online               Boolean @default(false)
  ultimaConexao        DateTime?
}
```

### 🔄 Models Modificados (adicionam `estabelecimentoId`)

Todos os models abaixo ganham FK para `Estabelecimento`:
- ✅ `PedidoMusica`
- ✅ `Pagamento`
- ✅ `Configuracao`
- ✅ `EstadoPlayer`
- ✅ `GiftCard`
- ✅ `Sugestao`
- ✅ `HistoricoBusca`
- ✅ `PalavraProibida`
- ✅ `Tema`
- ✅ `Carrinho`
- ✅ `Admin` (vira admin do estabelecimento)

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### 1. **Super Admin**
- Acessa painel em `/super-admin`
- Credenciais únicas no sistema
- Pode criar/editar/desativar estabelecimentos
- Visualiza todas as métricas

### 2. **Admin do Estabelecimento**
- Acessa painel em `/admin/:slug` ou `/admin/:codigo`
- Username único DENTRO do estabelecimento
- Gerencia apenas seu estabelecimento
- Configurações, TVs, Gift Cards, Moderação

### 3. **TV (Terminal)**
- Autentica via WebSocket com `codigo` único
- Recebe apenas dados do próprio estabelecimento
- Socket room: `estabelecimento:{id}`

### 4. **Cliente**
- Acessa via QR Code: `/:slug/cliente` ou `/:codigo/cliente`
- Não precisa login
- Vê apenas fila do estabelecimento

---

## 📡 ISOLAMENTO DE DADOS (Multi-tenancy)

### Middleware de Tenant Context

```javascript
// middleware/tenantContext.js
async function extractTenant(req, res, next) {
  // Opção 1: Via subdomínio (espeto1.espeto.com)
  const subdomain = req.hostname.split('.')[0];

  // Opção 2: Via slug na URL (/espeto1/admin)
  const slug = req.params.slug || req.query.slug;

  // Opção 3: Via código (/ESP001/cliente)
  const codigo = req.params.codigo;

  // Opção 4: Via TV code (WebSocket)
  const tvCode = req.headers['x-tv-code'];

  // Buscar estabelecimento
  const estabelecimento = await prisma.estabelecimento.findFirst({
    where: {
      OR: [
        { slug },
        { codigo },
        { tvs: { some: { codigo: tvCode } } }
      ],
      ativo: true
    }
  });

  if (!estabelecimento) {
    return res.status(404).json({ error: 'Estabelecimento não encontrado' });
  }

  // Adicionar ao contexto
  req.estabelecimentoId = estabelecimento.id;
  req.estabelecimento = estabelecimento;

  next();
}
```

### Aplicar em Todas as Queries

```javascript
// Antes (single-tenant)
const pedidos = await prisma.pedidoMusica.findMany({
  where: { status: 'pago' }
});

// Depois (multi-tenant)
const pedidos = await prisma.pedidoMusica.findMany({
  where: {
    estabelecimentoId: req.estabelecimentoId,
    status: 'pago'
  }
});
```

---

## 🔄 WEBSOCKET COM MULTI-TENANCY

### Socket Rooms por Estabelecimento

```javascript
// socketHandler.js
socket.on('tv-authenticate', async (data) => {
  const { tvCode } = data;

  // Buscar TV e estabelecimento
  const tv = await prisma.tv.findUnique({
    where: { codigo: tvCode },
    include: { estabelecimento: true }
  });

  if (!tv || !tv.ativo) {
    return socket.emit('auth-failed');
  }

  // Marcar como online
  await prisma.tv.update({
    where: { id: tv.id },
    data: { online: true, ultimaConexao: new Date() }
  });

  // Entrar na room do estabelecimento
  socket.join(`estabelecimento:${tv.estabelecimentoId}`);

  socket.tvId = tv.id;
  socket.estabelecimentoId = tv.estabelecimentoId;

  socket.emit('auth-success', {
    estabelecimento: tv.estabelecimento.nome
  });
});

// Emitir eventos apenas para estabelecimento
function emitirParaEstabelecimento(estabelecimentoId, evento, dados) {
  io.to(`estabelecimento:${estabelecimentoId}`).emit(evento, dados);
}
```

---

## 🎨 FRONTEND - MUDANÇAS

### 1. **Novo: Super Admin Dashboard**
- Página: `/super-admin`
- Funcionalidades:
  - Listar estabelecimentos
  - Criar estabelecimento (form completo)
  - Editar estabelecimento
  - Ativar/Desativar
  - Ver estatísticas globais
  - Gerenciar planos

### 2. **Admin Dashboard (modificado)**
- Página: `/admin/:slug` ou `/admin/:codigo`
- Detecta estabelecimento pela URL
- Gerencia apenas seu estabelecimento
- Nova seção: Gerenciar TVs
  - Listar TVs
  - Criar nova TV (gera código)
  - Ver status online/offline
  - Ver última conexão

### 3. **TV Player (modificado)**
- Página: `/tv/:codigo`
- Autentica com código da TV
- Recebe apenas eventos do estabelecimento
- WebSocket room: `estabelecimento:{id}`

### 4. **Cliente (modificado)**
- Página: `/:slug/cliente` ou `/:codigo/cliente`
- Detecta estabelecimento pela URL
- QR Code gerado com URL específica
- Vê apenas fila do estabelecimento

---

## 📊 SISTEMA DE PLANOS

### Planos Disponíveis

| Plano | TVs | Músicas/Mês | Preço |
|-------|-----|-------------|-------|
| **Básico** | 2 | 1.000 | R$ 99/mês |
| **Pro** | 5 | 5.000 | R$ 249/mês |
| **Enterprise** | Ilimitado | Ilimitado | R$ 599/mês |

### Verificação de Limites

```javascript
// middleware/checkLimits.js
async function checkLimits(req, res, next) {
  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { id: req.estabelecimentoId }
  });

  // Verificar expiração
  if (estabelecimento.dataExpiracao && estabelecimento.dataExpiracao < new Date()) {
    return res.status(403).json({ error: 'Plano expirado' });
  }

  // Verificar limite de músicas
  if (estabelecimento.totalMusicasMes >= estabelecimento.limiteMusicasMes) {
    return res.status(403).json({ error: 'Limite de músicas atingido' });
  }

  next();
}
```

---

## 🔧 MIGRAÇÃO PASSO A PASSO

### Fase 1: Preparação (Sem Breaking Changes)
1. ✅ Criar `schema-saas.prisma` (já feito)
2. ✅ Documentar plano completo (este arquivo)
3. ⏳ Criar scripts de migração
4. ⏳ Criar seed para dados iniciais

### Fase 2: Backend
1. ⏳ Aplicar novo schema
2. ⏳ Criar middleware de tenant context
3. ⏳ Atualizar todos controllers
4. ⏳ Atualizar socketHandler
5. ⏳ Criar rotas do super admin
6. ⏳ Criar sistema de limites

### Fase 3: Frontend
1. ⏳ Criar painel Super Admin
2. ⏳ Modificar Admin Dashboard
3. ⏳ Modificar TV Player (autenticação)
4. ⏳ Modificar Cliente (detecção estabelecimento)
5. ⏳ Atualizar rotas

### Fase 4: Testes
1. ⏳ Testar isolamento de dados
2. ⏳ Testar autenticação múltipla
3. ⏳ Testar WebSocket por estabelecimento
4. ⏳ Testar limites de plano

### Fase 5: Deploy
1. ⏳ Migrar banco de dados
2. ⏳ Deploy backend
3. ⏳ Deploy frontend
4. ⏳ Criar primeiro estabelecimento

---

## 📝 SCRIPT DE MIGRAÇÃO DE DADOS

```javascript
// migrate-to-saas.js
async function migrarParaSaaS() {
  // 1. Criar Super Admin
  const superAdmin = await prisma.superAdmin.create({
    data: {
      username: 'superadmin',
      password: await bcrypt.hash('super123', 10),
      nome: 'Super Administrador',
      email: 'admin@espeto.com',
      ativo: true
    }
  });

  // 2. Criar Estabelecimento Padrão (migrar dados existentes)
  const estabelecimento = await prisma.estabelecimento.create({
    data: {
      nome: 'Espeto Music Demo',
      slug: 'demo',
      codigo: 'DEMO001',
      email: 'demo@espeto.com',
      ativo: true,
      plano: 'pro',
      limiteTVs: 5,
      limiteMusicasMes: 5000,
      adminNome: 'Admin Demo',
      adminEmail: 'admin@demo.com'
    }
  });

  // 3. Migrar Admin existente
  const adminAntigo = await prisma.admin.findFirst();
  if (adminAntigo) {
    await prisma.admin.update({
      where: { id: adminAntigo.id },
      data: { estabelecimentoId: estabelecimento.id }
    });
  }

  // 4. Criar TV padrão
  const tv = await prisma.tv.create({
    data: {
      estabelecimentoId: estabelecimento.id,
      nome: 'TV Principal',
      codigo: crypto.randomUUID().substring(0, 8).toUpperCase(),
      ativo: true
    }
  });

  // 5. Migrar todos os dados existentes
  await prisma.pedidoMusica.updateMany({
    data: { estabelecimentoId: estabelecimento.id }
  });

  await prisma.pagamento.updateMany({
    data: { estabelecimentoId: estabelecimento.id }
  });

  // ... migrar todos os outros models

  console.log('✅ Migração concluída!');
  console.log('Estabelecimento:', estabelecimento.slug);
  console.log('Código TV:', tv.codigo);
}
```

---

## 🌐 ESTRUTURA DE URLs

### Super Admin
- `https://superadmin.espeto.com/` → Painel Super Admin
- `https://superadmin.espeto.com/estabelecimentos` → Lista
- `https://superadmin.espeto.com/estabelecimentos/novo` → Criar

### Estabelecimento (Admin)
- `https://espeto.com/admin/:slug` → Painel Admin
- `https://espeto.com/admin/:slug/tvs` → Gerenciar TVs
- `https://espeto.com/admin/:slug/configuracoes` → Configurações

### TV
- `https://espeto.com/tv/:codigo` → Player da TV

### Cliente
- `https://espeto.com/:slug/cliente` → Interface Cliente
- `https://espeto.com/:codigo/cliente` → Acesso por código

---

## ✅ PRÓXIMOS PASSOS

1. ✅ **Revisar este plano** com o time
2. ⏳ **Aprovar mudanças** no schema
3. ⏳ **Criar branch** `feature/saas-multi-tenant`
4. ⏳ **Implementar Fase 2** (Backend)
5. ⏳ **Implementar Fase 3** (Frontend)
6. ⏳ **Testar em ambiente de dev**
7. ⏳ **Deploy em produção**

---

## 📞 CONSIDERAÇÕES FINAIS

### Vantagens do Multi-Tenant
- ✅ Escalabilidade
- ✅ Isolamento de dados
- ✅ Personalização por estabelecimento
- ✅ Gestão centralizada
- ✅ Modelo de receita recorrente

### Desafios
- ⚠️ Complexidade aumentada
- ⚠️ Migração de dados existentes
- ⚠️ Testes mais complexos
- ⚠️ Necessidade de bom middleware

### Recomendações
- 🔒 Implementar testes de isolamento
- 📊 Monitorar performance por tenant
- 🔐 Validar sempre `estabelecimentoId`
- 📝 Documentar bem as queries
- 🧪 Criar fixtures de teste

---

**Versão:** 1.0
**Data:** 2025-01-17
**Autor:** Claude Code + Equipe Espeto Music
