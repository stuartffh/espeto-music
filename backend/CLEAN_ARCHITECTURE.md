# 🏗️ Clean Architecture - Espeto Music

Este documento descreve a implementação de Clean Architecture no backend do Espeto Music.

## 📐 Estrutura de Camadas

```
src/
├── domain/                      # Camada de Domínio (regras de negócio)
│   ├── entities/               # Entidades com comportamento
│   │   ├── Pedido.js
│   │   ├── Fila.js
│   │   └── GiftCard.js
│   ├── value-objects/          # Objetos de valor imutáveis
│   │   ├── Money.js
│   │   ├── YouTubeId.js
│   │   └── Duration.js
│   └── repositories/           # Interfaces de repositório
│       ├── IPedidoRepository.js
│       ├── IFilaRepository.js
│       └── IGiftCardRepository.js
│
├── application/                 # Camada de Aplicação (casos de uso)
│   ├── use-cases/
│   │   ├── CriarPedidoUseCase.js
│   │   ├── ProcessarPagamentoPedidoUseCase.js
│   │   ├── ObterFilaUseCase.js
│   │   ├── UsarGiftCardUseCase.js
│   │   └── CriarGiftCardUseCase.js
│   └── dto/                    # Data Transfer Objects
│
├── infrastructure/              # Camada de Infraestrutura (detalhes técnicos)
│   ├── database/
│   │   └── repositories/       # Implementações Prisma
│   │       ├── PrismaPedidoRepository.js
│   │       ├── PrismaFilaRepository.js
│   │       └── PrismaGiftCardRepository.js
│   ├── external/               # Integrações externas
│   └── container/              # Dependency Injection
│       └── container.js
│
└── interfaces/                  # Camada de Interface (adaptadores)
    └── http/
        └── controllers/         # Controllers HTTP
            ├── PedidoController.js
            └── GiftCardController.js
```

## 🎯 Princípios Aplicados

### 1. **Separation of Concerns**
Cada camada tem uma responsabilidade específica e bem definida.

### 2. **Dependency Rule**
Dependências sempre apontam para dentro (domain ← application ← infrastructure/interfaces).

### 3. **Inversion of Control**
Interfaces são definidas no domínio, implementações na infraestrutura.

### 4. **Single Responsibility**
Cada classe tem apenas uma razão para mudar.

---

## 📦 Camada de Domínio

### Value Objects

**Objetos imutáveis** que representam conceitos do domínio:

```javascript
// Money - Valores monetários
const valor = new Money(10.50);
const total = valor.add(new Money(5.00)); // Money(15.50)
console.log(valor.toString()); // "R$ 10.50"

// YouTubeId - IDs validados do YouTube
const youtubeId = new YouTubeId('dQw4w9WgXcQ');
console.log(youtubeId.getUrl()); // "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

// Duration - Durações de tempo
const duracao = new Duration(185); // 185 segundos
console.log(duracao.format()); // "3:05"
```

### Entidades

**Classes com identidade e comportamento** que encapsulam regras de negócio:

```javascript
// Pedido
const pedido = new Pedido({
  musicaTitulo: 'Bohemian Rhapsody',
  musicaYoutubeId: 'fJ9rUzIMcZQ',
  valor: 5.00,
  // ...
});

// Regras de negócio na entidade
pedido.marcarComoPago();           // ✅ Valida estado e marca como pago
pedido.adicionarNaFila(1);         // ✅ Adiciona à fila com validação
pedido.marcarComoTocando();        // ✅ Transição de estado validada
pedido.cancelar();                 // ❌ Erro: não pode cancelar pedido já tocado

// GiftCard
const giftCard = new GiftCard({
  codigo: 'GIFT-ABC1-XYZ9',
  quantidadeMusicas: 5,
  // ...
});

giftCard.usarMusica();             // ✅ Usa uma música
console.log(giftCard.getMusicasRestantes()); // 4
giftCard.podeSerUsado();           // true/false baseado em regras
```

### Repositórios (Interfaces)

**Contratos** que definem como acessar dados, **sem se preocupar com implementação**:

```javascript
class IPedidoRepository {
  async findById(id) { /* ... */ }
  async findNaFila() { /* ... */ }
  async save(pedido) { /* ... */ }
  async update(pedido) { /* ... */ }
}
```

---

## 🎬 Camada de Aplicação

### Use Cases

**Orquestram** o fluxo de uma operação completa:

```javascript
// CriarPedidoUseCase
const criarPedidoUseCase = new CriarPedidoUseCase(pedidoRepository);

const resultado = await criarPedidoUseCase.execute({
  musicaTitulo: 'Imagine',
  musicaYoutubeId: 'YkgkThdzX-8',
  valor: 5.00,
  nomeCliente: 'João Silva'
});

// Use Case:
// 1. Valida input
// 2. Cria entidade de domínio (com validações)
// 3. Persiste via repositório
// 4. Emite eventos
// 5. Retorna resultado formatado
```

**Exemplos de Use Cases:**

- `CriarPedidoUseCase`: Cria novo pedido
- `ProcessarPagamentoPedidoUseCase`: Marca como pago e adiciona à fila
- `UsarGiftCardUseCase`: Aplica gift card e processa pagamento
- `ObterFilaUseCase`: Retorna estado completo da fila

---

## 🔧 Camada de Infraestrutura

### Repositórios Prisma

**Implementações concretas** dos contratos de repositório:

```javascript
class PrismaPedidoRepository extends IPedidoRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findById(id) {
    const data = await this.prisma.pedidos_musica.findUnique({ where: { id } });
    return data ? Pedido.fromPrisma(data) : null;
  }

  async save(pedido) {
    const prismaData = pedido.toPrisma();
    const created = await this.prisma.pedidos_musica.create({ data: prismaData });
    return Pedido.fromPrisma(created);
  }
}
```

### Dependency Injection Container

**Gerencia** todas as dependências da aplicação:

```javascript
const container = setupContainer();

// Registra:
// - Prisma Client (singleton)
// - Repositories (scoped)
// - Use Cases (scoped)

// No middleware:
app.use(containerMiddleware(container));

// Nos controllers:
const useCase = req.container.resolve('criarPedidoUseCase');
```

---

## 🌐 Camada de Interface

### Controllers HTTP

**Adaptadores** que convertem HTTP para Use Cases:

```javascript
class PedidoController {
  static async criar(req, res, next) {
    try {
      // 1. Resolve use case do container
      const criarPedidoUseCase = req.container.resolve('criarPedidoUseCase');

      // 2. Converte HTTP body para input do use case
      const input = {
        musicaTitulo: req.body.musicaTitulo,
        musicaYoutubeId: req.body.musicaYoutubeId,
        valor: req.body.valor,
        // ...
      };

      // 3. Executa use case
      const resultado = await criarPedidoUseCase.execute(input);

      // 4. Retorna HTTP response
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 🔄 Fluxo de Execução

### Exemplo: Criar Pedido

```
1. HTTP Request
   POST /api/pedidos
   { musicaTitulo: "Imagine", musicaYoutubeId: "...", valor: 5.00 }
   ↓

2. PedidoController (Interface)
   - Resolve CriarPedidoUseCase do container
   - Converte HTTP body para input
   ↓

3. CriarPedidoUseCase (Application)
   - Valida input
   - Cria Pedido (entidade de domínio)
   ↓

4. Pedido Entity (Domain)
   - Valida regras de negócio no construtor
   - YouTubeId validado, Money criado, etc.
   ↓

5. PedidoRepository (Infrastructure)
   - Converte entidade para formato Prisma
   - Salva no banco de dados
   ↓

6. Use Case (Application)
   - Emite evento 'pedido.criado'
   - Formata output
   ↓

7. Controller (Interface)
   - Retorna HTTP 201 com JSON
```

---

## ✅ Benefícios

### 1. **Testabilidade**
```javascript
// Testar use case sem banco de dados
const mockRepository = {
  save: jest.fn().mockResolvedValue(pedidoMock)
};
const useCase = new CriarPedidoUseCase(mockRepository);
```

### 2. **Flexibilidade**
Trocar Prisma por Sequelize? Apenas reimplementar repositórios.

### 3. **Regras de Negócio Centralizadas**
```javascript
// Toda lógica de validação está na entidade
pedido.marcarComoPago(); // ✅ ou ❌
```

### 4. **Independência de Framework**
Domínio não sabe que Express ou Prisma existem.

### 5. **Manutenibilidade**
Cada camada pode evoluir independentemente.

---

## 🔀 Migração Gradual

A arquitetura **coexiste com o código legado**:

```
backend/src/
├── controllers/           # ⚠️ Controllers antigos (ainda funcionam)
├── services/             # ⚠️ Services antigos (ainda funcionam)
├── routes/               # ✅ Rotas podem usar novos ou antigos controllers
│
├── domain/               # ✅ Nova arquitetura
├── application/          # ✅ Nova arquitetura
├── infrastructure/       # ✅ Nova arquitetura
└── interfaces/           # ✅ Nova arquitetura
```

**Migração:**
1. Implementar novos controllers Clean Architecture
2. Atualizar rotas para usar novos controllers
3. Remover código antigo gradualmente

---

## 📚 Próximos Passos

### Para Adicionar Nova Feature:

1. **Domain Layer**:
   - Criar/atualizar entidades com regras de negócio
   - Criar value objects se necessário
   - Definir interface de repositório

2. **Application Layer**:
   - Criar use case que orquestra a operação
   - Definir validações de input

3. **Infrastructure Layer**:
   - Implementar repositório Prisma
   - Registrar no container

4. **Interface Layer**:
   - Criar/atualizar controller HTTP
   - Atualizar rotas

### Exemplos de Features a Migrar:

- [ ] Carrinho (CarrinhoUseCase, CarrinhoEntity)
- [ ] Moderação (ModeracaoUseCase, StatusModeracaoEntity)
- [ ] Configurações (ConfiguracaoUseCase)
- [ ] YouTube Service (como External Service)
- [ ] Payment Processing (PaymentGateway interface)

---

## 📖 Referências

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [Dependency Injection in Node.js with Awilix](https://github.com/jeffijoe/awilix)

---

## 🤝 Compatibilidade

✅ **100% compatível** com frontend existente
✅ **Coexiste** com código legado
✅ **Zero breaking changes** na API
✅ **Migração gradual** sem riscos

