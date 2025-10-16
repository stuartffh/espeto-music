# 🔌 WebSocket Events - Referência Rápida

## Arquitetura

- **Frontend:** Um único socket singleton (`frontend/src/services/socket.js`)
- **Backend:** Um único handler centralizado (`backend/src/utils/socketHandler.js`)
- **Configuração:** Sem cookies, sem sessão, conexão limpa

## 📡 Eventos do Cliente → Servidor

### `request:estado-inicial`
**Descrição:** Cliente solicita estado completo ao conectar
**Payload:** Nenhum
**Resposta:** `estado:inicial` com `{ musicaAtual, fila }`

```javascript
socket.emit('request:estado-inicial');
```

### `request:fila`
**Descrição:** Cliente solicita atualização da fila
**Payload:** Nenhum
**Resposta:** `fila:atualizada` com array de músicas

```javascript
socket.emit('request:fila');
```

### `request:musica-atual`
**Descrição:** Cliente solicita música que está tocando
**Payload:** Nenhum
**Resposta:** `musica:atual` com objeto da música

```javascript
socket.emit('request:musica-atual');
```

### `musica:terminou`
**Descrição:** TV notifica que música terminou
**Payload:** `{ pedidoId: string }`
**Resposta:** `fila:atualizada` + evento do player

```javascript
socket.emit('musica:terminou', { pedidoId: 'uuid' });
```

### `pedido:pago`
**Descrição:** Cliente notifica que pagamento foi aprovado
**Payload:** `{ pedidoId: string }`
**Resposta:** `fila:atualizada` + auto-início se fila vazia

```javascript
socket.emit('pedido:pago', { pedidoId: 'uuid' });
```

## 📢 Eventos do Servidor → Cliente

### `estado:inicial`
**Descrição:** Estado completo ao conectar
**Payload:** `{ musicaAtual: object | null, fila: array }`

```javascript
socket.on('estado:inicial', (data) => {
  console.log('Música atual:', data.musicaAtual);
  console.log('Fila:', data.fila);
});
```

### `fila:atualizada`
**Descrição:** Fila foi atualizada (nova música, remoção, etc)
**Payload:** `array` de objetos de música

```javascript
socket.on('fila:atualizada', (fila) => {
  console.log('Fila atualizada:', fila.length, 'músicas');
});
```

### `fila:vazia`
**Descrição:** Fila ficou vazia
**Payload:** Nenhum

```javascript
socket.on('fila:vazia', () => {
  console.log('Fila vazia');
});
```

### `musica:atual`
**Descrição:** Música que está tocando agora
**Payload:** `object` da música ou `null`

```javascript
socket.on('musica:atual', (musica) => {
  console.log('Tocando:', musica.musicaTitulo);
});
```

### `player:iniciar`
**Descrição:** Iniciar reprodução de música
**Payload:** `{ estado: object, musica: object }`

```javascript
socket.on('player:iniciar', (data) => {
  console.log('Iniciando:', data.musica.musicaTitulo);
});
```

### `player:pausar`
**Descrição:** Pausar reprodução
**Payload:** `{ estado: object }`

```javascript
socket.on('player:pausar', (data) => {
  console.log('Player pausado');
});
```

### `player:retomar`
**Descrição:** Retomar reprodução
**Payload:** `{ estado: object }`

```javascript
socket.on('player:retomar', (data) => {
  console.log('Player retomado');
});
```

### `player:parar`
**Descrição:** Parar reprodução
**Payload:** `{ estado: object }`

```javascript
socket.on('player:parar', (data) => {
  console.log('Player parado');
});
```

### `config:atualizada`
**Descrição:** Configuração do sistema foi alterada
**Payload:** `{ chave: string, valor: string }`

```javascript
socket.on('config:atualizada', (data) => {
  console.log(`Config ${data.chave} = ${data.valor}`);
});
```

### `pedido:pago`
**Descrição:** Confirmação de pagamento aprovado
**Payload:** `{ pedidoId: string }`

```javascript
socket.on('pedido:pago', (data) => {
  console.log('Pagamento confirmado:', data.pedidoId);
});
```

### `error`
**Descrição:** Erro genérico do servidor
**Payload:** `{ message: string }`

```javascript
socket.on('error', (data) => {
  console.error('Erro:', data.message);
});
```

## 🔄 Eventos de Conexão (Socket.IO padrão)

### `connect`
**Descrição:** Conectado com sucesso ao servidor

```javascript
socket.on('connect', () => {
  console.log('Conectado! ID:', socket.id);
});
```

### `disconnect`
**Descrição:** Desconectado do servidor
**Payload:** `reason` (string)

```javascript
socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
});
```

### `connect_error`
**Descrição:** Erro ao tentar conectar

```javascript
socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error);
});
```

### `reconnect`
**Descrição:** Reconectado após queda
**Payload:** `attemptNumber` (number)

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconectado após', attemptNumber, 'tentativas');
});
```

### `reconnect_attempt`
**Descrição:** Tentando reconectar
**Payload:** `attemptNumber` (number)

```javascript
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Tentativa de reconexão #', attemptNumber);
});
```

## 🎯 Boas Práticas

### ✅ FAZER

1. **Usar o socket singleton** - Sempre importar de `services/socket.js`
2. **Limpar listeners** - Usar `socket.off()` no cleanup do useEffect
3. **Tratar erros** - Sempre ter handler para `error` e `connect_error`
4. **Logs informativos** - Console.log para debug, mas com prefixos claros

```javascript
// ✅ BOM
useEffect(() => {
  const handleFila = (fila) => {
    setFila(fila);
  };

  socket.on('fila:atualizada', handleFila);

  return () => {
    socket.off('fila:atualizada', handleFila);
  };
}, []);
```

### ❌ NÃO FAZER

1. **Criar múltiplos sockets** - Usar apenas o singleton
2. **Esquecer cleanup** - Sempre usar `socket.off()` no return
3. **Ignorar erros** - Sempre tratar eventos de erro
4. **Duplicar listeners** - Verificar se já existe antes de adicionar

```javascript
// ❌ RUIM
useEffect(() => {
  socket.on('fila:atualizada', (fila) => {
    setFila(fila);
  });
  // ❌ SEM CLEANUP - vai duplicar listeners!
}, []);
```

## 🧹 Limpeza de Conexão (TV)

A TV sempre inicia com conexão limpa:

```javascript
// Executado automaticamente ao carregar /tv
useEffect(() => {
  // Limpar cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Limpar localStorage
  localStorage.clear();

  // Limpar sessionStorage
  sessionStorage.clear();

  // Limpar IndexedDB
  if (window.indexedDB) {
    window.indexedDB.databases().then((dbs) => {
      dbs.forEach((db) => window.indexedDB.deleteDatabase(db.name));
    });
  }
}, []);
```

## 📊 Configuração do Servidor

```javascript
// backend/src/server.js
const io = new Server(server, {
  cors: corsOptions,
  cookie: false, // ❌ SEM cookies
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowUpgrades: true,
});
```

## 🔍 Debug

### Frontend
```javascript
// Ver status do socket
console.log('Conectado?', socket.connected);
console.log('Socket ID:', socket.id);
console.log('Transport:', socket.io.engine.transport.name);
```

### Backend
```javascript
// Ver total de clientes conectados
console.log('Clientes:', io.engine.clientsCount);

// Ver todos os sockets
io.sockets.sockets.forEach((socket) => {
  console.log('Socket:', socket.id, 'Transport:', socket.conn.transport.name);
});
```

## 🎵 Fluxo Típico

1. **Cliente acessa a aplicação**
   - Socket conecta automaticamente (`connect`)
   - Cliente pode solicitar estado inicial (`request:estado-inicial`)

2. **Usuário paga música**
   - Frontend emite `pedido:pago`
   - Backend adiciona à fila
   - Backend emite `fila:atualizada` para todos
   - Se fila estava vazia, backend emite `player:iniciar` para TV

3. **Música termina na TV**
   - TV emite `musica:terminou`
   - Backend marca como concluída
   - Backend busca próxima música
   - Backend emite `player:iniciar` com próxima música
   - Backend emite `fila:atualizada` para todos

4. **Admin altera configuração**
   - Backend emite `config:atualizada` para todos
   - Todos os clientes atualizam em tempo real

## 🚀 Performance

- **Singleton:** Uma única conexão por cliente
- **Sem cookies:** Conexão mais leve
- **WebSocket first:** Menor latência
- **Fallback polling:** Funciona em qualquer rede
- **Ping/Pong:** Mantém conexão viva (25s interval)
- **Auto-reconnect:** Reconecta automaticamente se cair
