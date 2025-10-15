# 🎵 Espeto Music

**Sistema de Jukebox Digital com YouTube** - Peça suas músicas favoritas do YouTube e assista na TV!

## 📋 Sobre o Projeto

Espeto Music é um sistema completo de jukebox digital que permite aos clientes pedir músicas do YouTube através de um app mobile, e visualizar a reprodução em uma Smart TV. O sistema faz download e streaming local dos vídeos, garantindo reprodução perfeita mesmo em TVs com restrições de iframe do YouTube.

### ✨ Características Principais

- 🎬 **Download Inteligente**: Usa yt-dlp + FFmpeg para baixar vídeos em formato compatível (H.264 + AAC)
- 📺 **Player Otimizado para TV**: Interface 10-foot com navegação DPAD para controles remotos
- 🔄 **Cache Inteligente**: Sistema de cache com limpeza automática (5GB máx, 7 dias)
- 💰 **Modo Gratuito/Pago**: Suporte para pedidos gratuitos ou pagos (configurável)
- 🎯 **Real-time**: WebSocket para sincronização instantânea entre clientes e TV
- 📱 **App Mobile**: Interface mobile responsiva para busca e pedidos
- 🎨 **UI Moderna**: Tailwind CSS com gradientes e animações

## 🏗️ Arquitetura

```
Espeto Music/
├── backend/               # API Node.js + Express
│   ├── src/
│   │   ├── config/       # Database (Prisma) + YouTube API
│   │   ├── controllers/  # REST endpoints
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   └── websocket/    # Socket.io handlers
│   ├── prisma/           # Database schema
│   ├── downloads/        # Video cache (git ignored)
│   └── ffmpeg/           # FFmpeg portable (git ignored)
│
├── frontend-cliente/     # Mobile Web App (React)
│   └── src/
│       ├── pages/        # Search, Queue, Payment
│       └── components/   # Reusable UI components
│
└── frontend-tv/          # Smart TV App (React)
    ├── src/
    │   └── App.jsx       # Main TV interface
    └── public/
        └── tv-player.html # Standalone video player
```

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express** - REST API
- **Prisma** + **SQLite** - Database ORM
- **Socket.io** - Real-time WebSocket
- **yt-dlp** - YouTube video downloader
- **FFmpeg** - Video format conversion
- **YouTube Data API v3** - Video search

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.io-client** - WebSocket client
- **hls.js** - HLS video support

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ e npm
- Python 3.7+ (para yt-dlp)
- Chave API do YouTube Data v3

### 1. Clone o Repositório

```bash
git clone https://github.com/stuartffh/espeto-music.git
cd espeto-music
```

### 2. Instalar yt-dlp

```bash
pip install yt-dlp
```

### 3. Baixar FFmpeg Portable

Baixe o FFmpeg essentials build e extraia para `backend/ffmpeg/`:
```
https://www.gyan.dev/ffmpeg/builds/
```

Estrutura esperada:
```
backend/ffmpeg/ffmpeg-8.0-essentials_build/bin/
├── ffmpeg.exe
├── ffprobe.exe
└── ffplay.exe
```

### 4. Configurar Backend

```bash
cd backend
npm install

# Criar arquivo .env
cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
YOUTUBE_API_KEY="sua-chave-api-aqui"
PORT=3000
EOF

# Executar migrations do Prisma
npx prisma migrate dev
npx prisma generate

# Iniciar servidor
npm run dev
```

### 5. Configurar Frontend Cliente

```bash
cd frontend-cliente
npm install

# Criar arquivo .env
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
EOF

# Iniciar dev server
npm run dev
```

### 6. Configurar Frontend TV

```bash
cd frontend-tv
npm install

# Criar arquivo .env
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
EOF

# Iniciar dev server
npm run dev
```

## 🎯 Como Usar

### 1. Acesse o App Cliente (Mobile)
- URL: `http://localhost:5173` (ou IP da rede local)
- Busque músicas do YouTube
- Adicione à fila de reprodução
- No modo gratuito, as músicas tocam automaticamente

### 2. Acesse o App TV (Smart TV)
- URL: `http://localhost:5174` (ou IP da rede local)
- Conecte sua Smart TV no navegador
- Visualize a fila e a música tocando
- Use controle remoto para navegação (DPAD)

### 3. Player Controls
- **Espaço/Enter**: Play/Pause
- **Setas**: Navegação DPAD
- **M**: Mute
- **F**: Fullscreen
- **← →**: Seek -10s/+10s

## ⚙️ Configurações

Configure o sistema através do Prisma Studio:

```bash
cd backend
npx prisma studio
```

### Configurações Disponíveis

| Chave | Descrição | Padrão |
|-------|-----------|--------|
| `MODO_GRATUITO` | Ativar modo gratuito (true/false) | true |
| `PRECO_MUSICA` | Preço por música em reais | 5.0 |
| `TEMPO_MAXIMO_MUSICA` | Duração máxima em segundos | 480 |

## 🔧 API Endpoints

### Músicas
- `GET /api/musicas/buscar?q=termo` - Buscar vídeos no YouTube
- `POST /api/musicas` - Criar pedido de música
- `GET /api/musicas/fila` - Buscar fila de músicas
- `GET /api/musicas/atual` - Buscar música tocando

### Player
- `GET /api/player/estado` - Estado atual do player
- `POST /api/player/pular` - Pular música atual
- `POST /api/player/pausar` - Pausar música
- `POST /api/player/retomar` - Retomar música

### Stream
- `GET /api/stream/video/:youtubeId` - Stream de vídeo (com Range support)
- `GET /api/stream/progress/:youtubeId` - Progresso de download
- `POST /api/stream/iniciar` - Iniciar download manual

### Cache
- `GET /api/stream/cache` - Informações do cache
- `DELETE /api/stream/cache/:youtubeId` - Deletar vídeo do cache
- `POST /api/stream/cache/limpar` - Limpar cache antigo

## 🌐 WebSocket Events

### Cliente → Servidor
- `musica:terminou` - Notifica fim da música

### Servidor → Clientes
- `player:iniciar` - Iniciar nova música
- `fila:atualizada` - Fila foi modificada
- `fila:vazia` - Fila está vazia
- `musica:tocando` - Música está tocando
- `musica:concluida` - Música foi concluída

## 🐛 Troubleshooting

### Vídeo sem áudio
Certifique-se de que o FFmpeg está instalado corretamente em `backend/ffmpeg/`.

### CORS errors
Verifique se as URLs nos arquivos `.env` estão corretas e acessíveis.

### TV não reproduz vídeo
- Teste no computador primeiro
- Verifique se a TV suporta H.264 + AAC
- Tente usar o player standalone em `/tv-player.html`

### Download falha
- Verifique se yt-dlp está instalado: `yt-dlp --version`
- Atualize yt-dlp: `pip install --upgrade yt-dlp`
- Verifique logs do backend

## 📝 Licença

MIT License - Sinta-se livre para usar e modificar!

## 👨‍💻 Autor

Desenvolvido com ❤️ para tornar festas mais divertidas!

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

**Espeto Music** - Seu pedido, sua música! 🎵🎉
