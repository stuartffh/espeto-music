# 🎵 Sistema de Locações Temporárias (Multi-Tenancy)

## 📋 Visão Geral

O sistema de locações permite criar instâncias temporárias e customizadas do Espeto Music para eventos, festas, casamentos, estabelecimentos temporários, etc.

Cada locação possui:
- **URL única** (ex: `/l/casamento-joao-maria`)
- **QR Code exclusivo**
- **Customizações** (nome, logo, cores, mensagens)
- **Dados isolados** (fila, pedidos, histórico)
- **Período de validade** (data início/fim)
- **Configurações próprias** (preços, moderação, etc.)

## 🏗️ Arquitetura

### **Soft Multi-Tenancy**

- Todas as locações compartilham o mesmo banco de dados
- Isolamento através do campo `locacaoId` nas tabelas
- Locação `null` = instância principal
- Locação com ID = instância temporária

### **Tabelas Modificadas**

Adicionado campo `locacaoId` em:
- `pedidos_musica` - Pedidos de músicas da locação
- `gift_cards` - Gift cards da locação
- `carrinhos` - Carrinhos de compra da locação

### **Nova Tabela: `locacoes`**

```prisma
model locacoes {
  id                     String          @id @default(uuid())
  slug                   String          @unique // URL amigável
  nomeCliente            String          // Nome do contratante
  nomeEvento             String          // Nome do evento
  emailContato           String?
  telefoneContato        String?

  // Período de locação
  dataInicio             DateTime
  dataFim                DateTime
  ativo                  Boolean         @default(true)

  // Customizações
  nomeEstabelecimento    String?         // Nome exibido na tela
  logoUrl                String?
  corTema                String?         // #hexadecimal
  mensagemBoasVindas     String?
  backgroundImageUrl     String?

  // QR Code e configurações
  qrCodeData             String?         // URL da locação
  configuracoes          String?         // JSON com configs

  // Estatísticas
  totalPedidos           Int             @default(0)
  totalArrecadado        Float           @default(0)

  observacoes            String?
  criadoEm               DateTime        @default(now())
  atualizadoEm           DateTime        @updatedAt
}
```

## 🔌 API Endpoints

### **Admin (Protegidas - Requer Auth)**

#### **Criar Locação**
```http
POST /api/admin/locacoes
Authorization: Bearer {token}

{
  "slug": "casamento-joao-maria",
  "nomeCliente": "João Silva",
  "nomeEvento": "Casamento João & Maria",
  "emailContato": "joao@email.com",
  "telefoneContato": "(11) 99999-9999",
  "dataInicio": "2025-12-20T00:00:00.000Z",
  "dataFim": "2025-12-21T23:59:59.000Z",
  "nomeEstabelecimento": "Casamento João & Maria",
  "logoUrl": "https://exemplo.com/logo.png",
  "corTema": "#FF6B6B",
  "mensagemBoasVindas": "Bem-vindo ao nosso casamento!",
  "configuracoes": {
    "PRECO_MUSICA": "10.00",
    "MODERACAO_ATIVA": "true"
  }
}
```

#### **Listar Locações**
```http
GET /api/admin/locacoes
GET /api/admin/locacoes?status=ativas
GET /api/admin/locacoes?status=expiradas
GET /api/admin/locacoes?ativo=true
```

#### **Obter Locação por ID**
```http
GET /api/admin/locacoes/{id}
```

#### **Atualizar Locação**
```http
PUT /api/admin/locacoes/{id}

{
  "nomeEstabelecimento": "Novo Nome",
  "corTema": "#00AA00"
}
```

#### **Desativar Locação**
```http
DELETE /api/admin/locacoes/{id}
```

#### **Reativar Locação**
```http
POST /api/admin/locacoes/{id}/reativar
```

#### **Estatísticas da Locação**
```http
GET /api/admin/locacoes/{id}/estatisticas
```

**Resposta:**
```json
{
  "sucesso": true,
  "estatisticas": {
    "locacao": { /* dados da locação */ },
    "totalPedidos": 50,
    "totalArrecadado": 500.00,
    "periodoDias": 2
  }
}
```

### **Públicas (Sem Auth)**

#### **Obter Locação por Slug**
```http
GET /api/public/locacao/{slug}
```

**Resposta:**
```json
{
  "sucesso": true,
  "locacao": {
    "id": "uuid",
    "slug": "casamento-joao-maria",
    "nomeEvento": "Casamento João & Maria",
    "nomeEstabelecimento": "Casamento João & Maria",
    "logoUrl": "https://...",
    "corTema": "#FF6B6B",
    "mensagemBoasVindas": "Bem-vindo!",
    "qrCodeData": "https://espeto.zapchatbr.com/l/casamento-joao-maria",
    "isAtiva": true,
    "isExpirada": false,
    "isPendente": false,
    "configuracoesParsed": {
      "PRECO_MUSICA": "10.00"
    }
  }
}
```

## 💻 Uso no Frontend

### **Página do Cliente**

Criar rota `/l/:slug` que:
1. Busca locação via `GET /api/public/locacao/:slug`
2. Aplica customizações (logo, cores, nome)
3. Exibe QR Code único da locação
4. Usa configurações específicas da locação

### **Painel Admin**

Criar página de gestão que permite:
- ✅ Listar todas as locações
- ✅ Ver status (ativa, expirada, pendente)
- ✅ Criar nova locação
- ✅ Editar locação existente
- ✅ Desativar/reativar locação
- ✅ Ver estatísticas (pedidos, faturamento)
- ✅ Imprimir/baixar QR Code

## 🎨 Customizações Disponíveis

- **Nome do Estabelecimento** - Exibido na tela de descanso
- **Logo** - Logo personalizada do evento
- **Cor do Tema** - Cor principal da interface (#hexadecimal)
- **Mensagem de Boas-Vindas** - Mensagem customizada
- **Imagem de Fundo** - Background personalizado
- **Configurações** - Override de qualquer config do sistema

## 🔐 Isolamento de Dados

### **Como Funciona**

1. Cliente acessa `/l/casamento-joao-maria`
2. Frontend identifica locação pelo slug
3. Todas as requisições incluem `locacaoId` no contexto
4. Backend filtra dados automaticamente por `locacaoId`

### **Middleware (TODO)**

Criar middleware que:
1. Detecta se URL é de locação (`/l/:slug`)
2. Busca locação e valida se está ativa
3. Injeta `locacaoId` em `req.locacao`
4. Repositories usam automaticamente `locacaoId` nos filtros

## 📊 Status da Locação

A locação pode ter 4 status:

| Status | Descrição | ativo | Período |
|--------|-----------|-------|---------|
| **Ativa** | Em andamento | true | dentro do período |
| **Expirada** | Período encerrado | - | após dataFim |
| **Pendente** | Ainda não iniciou | - | antes de dataInicio |
| **Inativa** | Desativada manualmente | false | - |

## 🚀 Próximos Passos

### **Backend (Concluído)**
- ✅ Schema do banco (migração)
- ✅ Entities e Value Objects
- ✅ Repositories
- ✅ Use Cases
- ✅ Controllers
- ✅ Rotas
- ✅ Container DI

### **Frontend (Pendente)**
- ⏳ Página admin de gestão (`/admin/locacoes`)
- ⏳ Página customizada do cliente (`/l/:slug`)
- ⏳ Middleware de contexto de locação
- ⏳ Geração de QR Code
- ⏳ Interface de customização

### **Melhorias Futuras**
- ⏳ Expir ação automática (job diário)
- ⏳ Notificações (email/SMS ao contratante)
- ⏳ Relatórios de faturamento
- ⏳ Templates de locação (casamento, festa, etc.)
- ⏳ Subdomínios (casamento.espeto.com)
- ⏳ WhatsApp integration para pedidos

## 📝 Exemplo de Fluxo Completo

1. **Admin cria locação**
   - Acessa `/admin/locacoes`
   - Clica em "Nova Locação"
   - Preenche dados (nome, período, customizações)
   - Sistema gera QR Code e URL única

2. **Admin imprime QR Code**
   - Imprime QR Code em cartazes
   - Coloca nos locais do evento

3. **Cliente escaneia QR Code**
   - É redirecionado para `/l/casamento-joao-maria`
   - Vê interface customizada (logo, cores, nome)
   - Pode pedir músicas normalmente
   - Todos os dados ficam isolados nesta locação

4. **Admin monitora**
   - Vê pedidos em tempo real
   - Acompanha faturamento
   - Modera músicas se necessário

5. **Locação expira automaticamente**
   - Após dataFim, locação fica inativa
   - Dados permanecem no banco para histórico
   - Admin pode reativar se necessário

## 💰 Modelo de Negócio

### **Preço Sugerido**
- R$ 150-300/dia por locação
- QR Code personalizado
- Suporte durante o evento
- Relatórios pós-evento

### **Casos de Uso**
- 🎉 Festas de aniversário
- 💍 Casamentos
- 🏢 Eventos corporativos
- 🍺 Bares/restaurantes temporários
- 🎤 Shows e apresentações
- 🏖️ Beach clubs
- 🎪 Feiras e exposições

---

**Desenvolvido com Clean Architecture + DDD**
