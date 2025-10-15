# Sistema de Recuperação Automática

## Visão Geral

O Espeto Music agora possui um **sistema robusto de backup e recuperação** que garante que o estado do player seja preservado mesmo após crashes ou reinícios do servidor.

## Como Funciona

### 1. Backup Contínuo em Banco de Dados

- **Tabela `estado_player`**: Armazena o estado completo do player
  - `musicaAtualId`: ID da música que está tocando
  - `status`: playing, paused ou stopped
  - `tempoAtual`: Tempo exato de reprodução (em segundos)
  - `volume`: Nível de volume
  - `ultimaAtualizacao`: Timestamp da última atualização

- **Frequência de Backup**: A cada 3 segundos enquanto música estiver tocando
- **Backup Imediato**: Sempre que houver mudança de estado (play, pause, skip, etc.)

### 2. Recuperação Automática ao Iniciar

Quando o backend inicia, o sistema:

```
🎮 Player Service: Inicializando...
🔄 Recuperando estado do player do banco de dados...
```

#### Cenário 1: Sem música tocando
```
ℹ️  Nenhuma música em reprodução
✅ Player Service inicializado
```
- Sistema inicia normalmente no estado vazio

#### Cenário 2: Música estava tocando
```
🎵 Recuperando música: Nome da Música
⏱️  Tempo salvo: 45 segundos
▶️ Retomando reprodução automaticamente...
```
- Carrega a música do banco
- Restaura o tempo exato de reprodução
- Envia comando para a TV retomar a partir do tempo salvo
- Reinicia sincronização e backup

#### Cenário 3: Dados inconsistentes
```
⚠️  Música salva não encontrada ou inconsistente, limpando estado...
```
- Se a música no banco não existir mais ou status inválido
- Sistema limpa automaticamente e volta ao estado limpo

### 3. Fluxo de Backup Durante Reprodução

```
┌─────────────────┐
│  Música Inicia  │
│                 │
│  ▶️ Play        │
└────────┬────────┘
         │
         ├─> Salvar estado no banco (imediato)
         │
         ├─> Iniciar sincronização (1s)
         │   └─> Atualiza tempoAtual em memória
         │       └─> Emite sync para TVs (5s)
         │
         └─> Iniciar backup (3s)
             └─> Salva estado completo no banco
                 ├─> musicaAtualId
                 ├─> status: 'playing'
                 ├─> tempoAtual: 45.3s
                 ├─> volume: 80
                 └─> ultimaAtualizacao: timestamp
```

### 4. Resiliência a Crashes

**Antes (sem backup):**
```
1. Música tocando no minuto 2:45
2. ❌ CRASH DO SERVIDOR
3. Reinicia servidor
4. ❌ Fila perdida, música perdida, tudo do zero
```

**Agora (com backup):**
```
1. Música tocando no minuto 2:45
2. 🔄 Backup salvo há 3s: tempo = 2:42
3. ❌ CRASH DO SERVIDOR
4. Reinicia servidor
5. ✅ Recupera estado do banco
6. ✅ TV retoma música no minuto 2:42
7. ✅ Continua de onde parou!
```

### 5. Comandos de Controle

Todos os comandos agora salvam estado:

- **`pausar()`**: Salva status='paused' + tempo atual
- **`retomar()`**: Salva status='playing' + retoma sync
- **`parar()`**: Limpa estado no banco
- **`pularMusica()`**: Salva nova música
- **`ajustarVolume()`**: Salva novo volume
- **`buscarTempo()`**: Salva novo tempo

## Vantagens do Sistema

### ✅ Continuidade de Serviço
- Servidor pode ser reiniciado sem perder músicas
- Atualizações podem ser feitas sem interromper o serviço
- Crashes não causam perda de estado

### ✅ Sincronização Automática
- Todas as TVs recebem estado atualizado ao conectar
- Múltiplas TVs sempre mostram o mesmo conteúdo
- Backup garante consistência

### ✅ Detecção de Problemas
- Sistema identifica inconsistências automaticamente
- Auto-correção de dados inválidos
- Logs detalhados para debugging

### ✅ Performance
- Backup assíncrono (não bloqueia operações)
- Estado em memória para leitura rápida
- Banco apenas para persistência

## Estrutura Técnica

### Estado em Memória (rápido)
```javascript
estadoMemoria = {
  musicaAtual: { id, musicaTitulo, ... },
  status: 'playing',
  tempoAtual: 165.7,
  volume: 80,
  ultimaAtualizacao: 1697...
}
```

### Estado no Banco (persistente)
```sql
CREATE TABLE estado_player (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  musicaAtualId TEXT,
  status TEXT DEFAULT 'stopped',
  tempoAtual REAL DEFAULT 0,
  volume INTEGER DEFAULT 80,
  ultimaAtualizacao DATETIME,
  ...
)
```

### Singleton Pattern
- Apenas **1 registro** na tabela `estado_player`
- ID fixo: `'singleton'`
- Sempre usa `upsert` (update or insert)

## Logs de Monitoramento

```bash
# Ao iniciar
🎮 Player Service: Inicializando...
🔄 Recuperando estado do player do banco de dados...

# Se recuperar música
🎵 Recuperando música: Nome da Música
⏱️  Tempo salvo: 45 segundos
▶️ Retomando reprodução automaticamente...

# Durante operação
▶️ Player: Iniciando música Nome da Música
⏸️ Player: Pausando
▶️ Player: Retomando
⏹️ Player: Parando
⏭️ Player: Pulando música
🔊 Player: Volume ajustado para 75
⏩ Player: Buscando para 30 segundos

# Problemas detectados
⚠️  Música salva não encontrada ou inconsistente, limpando estado...
❌ Erro ao salvar estado: ...
❌ Erro ao recuperar estado: ...
```

## Testes Recomendados

### Teste 1: Recuperação de Música Tocando
1. Inicie uma música
2. Aguarde tocar por 30 segundos
3. Mate o processo do backend (Ctrl+C)
4. Reinicie o backend
5. ✅ Música deve retomar próximo dos 30s

### Teste 2: Recuperação de Pausa
1. Inicie uma música
2. Pause após 20 segundos
3. Mate o processo do backend
4. Reinicie o backend
5. ✅ Sistema deve iniciar com música pausada aos 20s

### Teste 3: Múltiplas TVs
1. Conecte 2 TVs diferentes
2. Inicie uma música
3. Desconecte uma TV
4. Reconecte a TV
5. ✅ Ambas devem estar sincronizadas

### Teste 4: Limpeza de Estado Inválido
1. Via banco, adicione musicaAtualId inválido
2. Reinicie backend
3. ✅ Sistema deve detectar e limpar automaticamente

## Manutenção

### Verificar Estado Atual
```bash
# No banco SQLite
sqlite3 dev.db "SELECT * FROM estado_player"
```

### Limpar Estado Manualmente
```bash
sqlite3 dev.db "UPDATE estado_player SET musicaAtualId=NULL, status='stopped', tempoAtual=0"
```

### Ver Logs em Tempo Real
```bash
# No backend
npm run dev
# Observe os emojis 🎮🔄🎵⏱️▶️⏸️⏹️
```

## Próximas Melhorias Possíveis

- [ ] Histórico de crashes (últimos 10)
- [ ] Métricas de uptime
- [ ] Backup de fila completa (não só música atual)
- [ ] Notificação para admin quando ocorrer crash
- [ ] Health check endpoint
