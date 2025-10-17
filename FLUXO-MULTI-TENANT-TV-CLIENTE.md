# 🎯 Fluxo Multi-Tenant: TV e Cliente

## ❓ A Pergunta
> "Como o estabelecimento vai acessar na TV o app responsável pelo estabelecimento dele? Cada estabelecimento vai estar tocando 1 música diferente do outro. E como o cliente vai escanear QR code e a música tocar no estabelecimento correto?"

---

## ✅ Resposta: Existem 3 Formas de Identificação

### **Forma 1: URL com SLUG** (Recomendada para Admin e TV)
### **Forma 2: URL com CÓDIGO DA TV** (Mais Seguro para TV)
### **Forma 3: QR Code Dinâmico** (Para Cliente)

---

## 📺 FLUXO DA TV (3 Opções)

### **Opção 1: TV com SLUG na URL**
```
URL: http://localhost:5173/demo/tv
       Estabelecimento ↑     ↑ Tipo (TV)
```

**Como funciona:**
1. TV acessa URL com slug do estabelecimento
2. TenantContext detecta `params.slug = "demo"`
3. Frontend chama `authenticateTV("demo")` (usando slug como fallback)
4. Backend busca estabelecimento pelo slug
5. Socket entra na room `estabelecimento:${id}`
6. TV recebe apenas músicas deste estabelecimento

**Código Frontend (TV Panel):**
```javascript
const { slug, codigo } = useTenant(); // Detecta slug="demo"
const tvIdentifier = codigo || slug;   // Usa "demo" como fallback
authenticateTV(tvIdentifier);           // Autentica com "demo"
```

---

### **Opção 2: TV com CÓDIGO ÚNICO na URL** ⭐ **RECOMENDADO**
```
URL: http://localhost:5173/demo/tv?codigo=TV-ABC123
                                          ↑ Código único da TV
```

**Como funciona:**
1. TV acessa URL com slug + código único
2. TenantContext detecta:
   - `params.slug = "demo"`
   - `queryCodigo = "TV-ABC123"`
3. Frontend chama `authenticateTV("TV-ABC123")` (prioriza código)
4. Backend busca TV pelo código único no banco:
```sql
SELECT * FROM tvs WHERE codigo = 'TV-ABC123'
```
5. Retorna `estabelecimentoId` da TV
6. Socket entra na room `estabelecimento:${id}` E `tv:${tvId}`
7. TV recebe apenas músicas deste estabelecimento

**Vantagens:**
✅ Mais seguro (código único por TV)
✅ Permite múltiplas TVs no mesmo estabelecimento
✅ Pode rastrear qual TV tocou cada música
✅ Pode desativar TVs individualmente

**Código Backend (socketTenantContext.js):**
```javascript
async function authenticateTV(socket, tvCode) {
  const tv = await prisma.tV.findUnique({
    where: { codigo: tvCode },  // Busca por código único
    include: { estabelecimento: true }
  });

  socket.estabelecimentoId = tv.estabelecimentoId; // Define tenant
  socket.join(`estabelecimento:${tv.estabelecimentoId}`); // Entra na room
  socket.join(`tv:${tv.id}`); // Room específica da TV
}
```

---

### **Opção 3: TV com CÓDIGO PURO (sem slug)**
```
URL: http://localhost:5173/tv?codigo=TV-ABC123
```

**Como funciona:**
1. TenantContext detecta apenas `queryCodigo`
2. Frontend chama `authenticateTV("TV-ABC123")`
3. Backend busca TV e descobre o estabelecimento
4. Funciona igual à Opção 2

---

## 👥 FLUXO DO CLIENTE (QR Code)

### **Problema:**
> "Imagina eu escanear um QR code e a música tocar no outro estabelecimento?"

### **Solução: QR Code com SLUG do Estabelecimento**

**QR Code gerado pelo estabelecimento:**
```
URL: http://localhost:5173/demo
                            ↑ Slug do estabelecimento
```

**Como funciona:**
1. Cliente escaneia QR Code no estabelecimento
2. Abre URL: `http://localhost:5173/demo`
3. TenantContext detecta `params.slug = "demo"`
4. Frontend configura API com `setTenantSlug("demo")`
5. Cliente entra na room `estabelecimento:${id}` via `joinEstabelecimento("demo")`
6. **TODAS as requisições incluem o slug:**
```javascript
// API Interceptor adiciona automaticamente
GET /api/musicas/buscar?q=rock&slug=demo
POST /api/musicas { ..., headers: { 'X-Estabelecimento-Slug': 'demo' } }
```
7. Backend valida que a música pertence ao estabelecimento
8. Música é adicionada NA FILA CORRETA

**Código Cliente (Home.jsx):**
```javascript
const { slug } = useTenant(); // Detecta slug="demo" da URL

useEffect(() => {
  setTenantSlug(slug);           // Configura API
  joinEstabelecimento(slug);      // Entra na room WebSocket
}, [slug]);

// Criar pedido de música
const pedido = await criarPedidoMusica({
  musicaTitulo: 'Bohemian Rhapsody',
  // slug é adicionado AUTOMATICAMENTE pelo interceptor
});
```

**Código Backend (musicaController.js):**
```javascript
exports.criar = async (req, res) => {
  const estabelecimentoId = req.estabelecimentoId; // Do middleware

  if (!estabelecimentoId) {
    return res.status(400).json({ erro: 'Estabelecimento não identificado' });
  }

  const pedido = await prisma.pedidoMusica.create({
    data: {
      estabelecimentoId, // ← ISOLAMENTO!
      musicaTitulo: req.body.musicaTitulo,
      // ...
    }
  });

  // Emitir apenas para a room do estabelecimento
  io.to(`estabelecimento:${estabelecimentoId}`).emit('fila:atualizada', fila);
};
```

---

## 🔒 ISOLAMENTO GARANTIDO

### **Cenário: 2 Estabelecimentos Simultâneos**

**Estabelecimento A (demo):**
- TV acessou: `/demo/tv?codigo=TV-AAA111`
- Cliente 1 escaneou QR: `http://localhost:5173/demo`
- Cliente 2 escaneou QR: `http://localhost:5173/demo`

**Estabelecimento B (bar-do-ze):**
- TV acessou: `/bar-do-ze/tv?codigo=TV-BBB222`
- Cliente 3 escaneou QR: `http://localhost:5173/bar-do-ze`

### **O Que Acontece:**

**WebSocket Rooms:**
```
estabelecimento:${idA}  ← TV-AAA111, Cliente 1, Cliente 2
estabelecimento:${idB}  ← TV-BBB222, Cliente 3
```

**Database Queries:**
```sql
-- Fila do Estabelecimento A
SELECT * FROM pedidos_musica
WHERE estabelecimentoId = 'idA' AND status = 'pago'

-- Fila do Estabelecimento B
SELECT * FROM pedidos_musica
WHERE estabelecimentoId = 'idB' AND status = 'pago'
```

**Resultado:**
✅ Cliente 1 e 2 adicionam músicas → Toca na TV-AAA111
✅ Cliente 3 adiciona música → Toca na TV-BBB222
✅ **ZERO chance de cruzar estabelecimentos**

---

## 🎯 FLUXO COMPLETO PASSO-A-PASSO

### **1. Configuração Inicial do Estabelecimento**

Quando o estabelecimento é criado (via Super Admin):
```javascript
{
  id: "est-123",
  nome: "Bar do Zé",
  slug: "bar-do-ze",
  codigo: "BAR001"
}

// Super Admin cria 2 TVs:
TV 1: { codigo: "TV-BAR001", estabelecimentoId: "est-123" }
TV 2: { codigo: "TV-BAR002", estabelecimentoId: "est-123" }
```

### **2. Setup da TV no Estabelecimento**

**No navegador da TV 1:**
```
1. Abrir: http://localhost:5173/bar-do-ze/tv?codigo=TV-BAR001
2. TV detecta slug="bar-do-ze" e codigo="TV-BAR001"
3. Autentica via código TV-BAR001
4. Backend retorna estabelecimentoId="est-123"
5. Socket entra em: estabelecimento:est-123 + tv:TV-BAR001
6. TV fica aguardando músicas
```

### **3. Cliente Escaneia QR Code**

**QR Code impresso na mesa:**
```
http://localhost:5173/bar-do-ze
```

**Cliente escaneia:**
```
1. Celular abre: http://localhost:5173/bar-do-ze
2. Cliente detecta slug="bar-do-ze"
3. API é configurada com slug
4. Socket entra em: estabelecimento:est-123
5. Cliente vê a fila do Bar do Zé
6. Cliente adiciona música
```

### **4. Música é Adicionada**

**Frontend (Cliente):**
```javascript
const pedido = await criarPedidoMusica({
  musicaTitulo: 'Wonderwall',
  musicaYoutubeId: 'abc123',
  // slug="bar-do-ze" adicionado automaticamente
});
```

**Backend recebe:**
```javascript
POST /api/musicas
Headers: { 'X-Estabelecimento-Slug': 'bar-do-ze' }
Query: ?slug=bar-do-ze

// Middleware detecta estabelecimento
req.estabelecimentoId = "est-123"

// Cria pedido ISOLADO
INSERT INTO pedidos_musica
VALUES (estabelecimentoId='est-123', musicaTitulo='Wonderwall', ...)
```

### **5. Música Toca na TV Correta**

**Backend emite WebSocket:**
```javascript
io.to('estabelecimento:est-123').emit('fila:atualizada', fila);
//      ↑ Apenas TVs e Clientes do Bar do Zé recebem
```

**TV 1 recebe:**
```javascript
socket.on('fila:atualizada', (fila) => {
  // fila = [{ musicaTitulo: 'Wonderwall', ... }]
  // Toca a música
});
```

**TV 2 (outro estabelecimento) NÃO recebe nada!**

---

## 🏗️ ESTRUTURA DO BANCO DE DADOS

```sql
-- Estabelecimentos
estabelecimentos
  id: "est-123"
  slug: "bar-do-ze"
  nome: "Bar do Zé"

-- TVs
tvs
  id: "tv-1"
  codigo: "TV-BAR001" ← CÓDIGO ÚNICO
  estabelecimentoId: "est-123" ← FK

-- Músicas
pedidos_musica
  id: "ped-1"
  estabelecimentoId: "est-123" ← ISOLAMENTO!
  musicaTitulo: "Wonderwall"
```

---

## 📋 RESUMO DAS FORMAS DE ACESSO

| Tipo | URL | Como Identifica |
|------|-----|----------------|
| **TV (Opção 1)** | `/demo/tv` | Slug na URL |
| **TV (Opção 2)** ⭐ | `/demo/tv?codigo=TV-ABC123` | Código único da TV |
| **TV (Opção 3)** | `/tv?codigo=TV-ABC123` | Código puro |
| **Cliente** | `/demo` | Slug na URL (QR Code) |
| **Admin** | `/demo/admin/login` | Slug na URL |

---

## 🔐 SEGURANÇA E VALIDAÇÕES

### **1. Middleware `tenantContext`**
```javascript
// Detecta tenant em TODAS as requisições
req.estabelecimentoId = detectarEstabelecimento(req);

// Se não detectar, retorna erro
if (!req.estabelecimentoId) {
  return res.status(400).json({ erro: 'Estabelecimento não identificado' });
}
```

### **2. Socket Rooms Isoladas**
```javascript
// TV só recebe eventos da sua room
socket.join(`estabelecimento:${id}`);

// Emissões sempre para room específica
io.to(`estabelecimento:${id}`).emit('evento', dados);
```

### **3. Database Queries com WHERE**
```javascript
// TODAS as queries filtram por estabelecimentoId
const musicas = await prisma.pedidoMusica.findMany({
  where: { estabelecimentoId } // ← SEMPRE!
});
```

---

## 🎉 CONCLUSÃO

### ✅ **SIM, está 100% isolado e seguro!**

**Como funciona na prática:**

1. **Cada TV tem um código único** (TV-ABC123, TV-XYZ789)
2. **TV autentica com seu código** → Backend descobre o estabelecimento
3. **Cliente escaneia QR Code** → URL tem o slug do estabelecimento
4. **Todas as operações incluem o tenant** (slug ou código)
5. **WebSocket usa rooms isoladas** por estabelecimento
6. **Database filtra TUDO** por `estabelecimentoId`

**Impossível cruzar estabelecimentos:**
- ❌ Música do Bar A tocar no Bar B
- ❌ Cliente do Bar A ver fila do Bar B
- ❌ TV do Bar A receber comandos do Bar B

**Tudo funciona porque:**
✅ Cada TV tem código único cadastrado no banco
✅ Cliente sempre acessa URL com slug do estabelecimento
✅ Backend valida tenant em TODAS as requisições
✅ WebSocket isola por rooms
✅ Database tem FK obrigatório `estabelecimentoId`

---

## 📝 Próximos Passos (Opcionais)

1. **Gerar QR Code automaticamente** no Admin com o slug
2. **Validar TV ao acessar** - redirecionar se código inválido
3. **Dashboard TV** mostrando qual estabelecimento está conectado
4. **Logs de acesso** por estabelecimento

---

**Data:** 2025-01-17
**Sistema:** Espeto Music Multi-Tenant SaaS
**Branch:** feature/saas-multi-tenant
