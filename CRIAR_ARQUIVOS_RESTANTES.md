# ARQUIVOS RESTANTES PARA CRIAR

Devido ao limite de resposta, os arquivos abaixo devem ser criados manualmente ou via script.

## FRONTEND CLIENTE

### `frontend-cliente/index.html`
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#FF6B35">
    <meta name="description" content="Escolha a próxima música do Espeto Music">
    <title>Espeto Music</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend-cliente/src/main.jsx`
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

### `frontend-cliente/src/styles/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}
```

### `frontend-cliente/src/App.jsx`
```jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Pagamento from './pages/Pagamento'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pagamento/:status" element={<Pagamento />} />
      </Routes>
    </div>
  )
}

export default App
```

### `frontend-cliente/src/services/api.js`
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Músicas
export const buscarMusicas = (query) => api.get(`/musicas/buscar?q=${encodeURIComponent(query)}`);
export const criarPedidoMusica = (dados) => api.post('/musicas', dados);
export const buscarFila = () => api.get('/musicas/fila');
export const buscarMusicaAtual = () => api.get('/musicas/atual');

// Pagamentos
export const criarPagamento = (pedidoId) => api.post('/pagamentos', { pedidoId });

export default api;
```

### `frontend-cliente/src/services/socket.js`
```javascript
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('✅ Conectado ao WebSocket');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error);
});

export default socket;
```

### `frontend-cliente/src/store/useStore.js`
```javascript
import { create } from 'zustand';

const useStore = create((set) => ({
  musicaAtual: null,
  fila: [],
  carregando: false,

  setMusicaAtual: (musica) => set({ musicaAtual: musica }),
  setFila: (fila) => set({ fila }),
  setCarregando: (carregando) => set({ carregando }),

  atualizarEstado: (musicaAtual, fila) => set({ musicaAtual, fila }),
}));

export default useStore;
```

### `frontend-cliente/src/pages/Home.jsx`
```jsx
import { useState, useEffect } from 'react';
import { buscarMusicas, criarPedidoMusica, criarPagamento, buscarFila } from '../services/api';
import socket from '../services/socket';
import useStore from '../store/useStore';

function Home() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const { fila, setFila } = useStore();
  const [nomeCliente, setNomeCliente] = useState('');

  useEffect(() => {
    // Buscar fila inicial
    buscarFila().then(res => setFila(res.data)).catch(console.error);

    // Escutar atualizações via WebSocket
    socket.on('fila:atualizada', (novaFila) => {
      setFila(novaFila);
    });

    socket.on('pedido:pago', () => {
      buscarFila().then(res => setFila(res.data)).catch(console.error);
    });

    return () => {
      socket.off('fila:atualizada');
      socket.off('pedido:pago');
    };
  }, [setFila]);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setCarregandoBusca(true);
    try {
      const response = await buscarMusicas(busca);
      setResultados(response.data);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      alert('Erro ao buscar músicas');
    } finally {
      setCarregandoBusca(false);
    }
  };

  const handleEscolherMusica = async (musica) => {
    if (!nomeCliente.trim()) {
      alert('Por favor, digite seu nome primeiro!');
      return;
    }

    try {
      const pedido = await criarPedidoMusica({
        mesaId: 'MESA_UNICA', // ID fixo para modelo "livepix"
        nomeCliente: nomeCliente.trim(),
        musicaTitulo: musica.titulo,
        musicaYoutubeId: musica.id,
        musicaThumbnail: musica.thumbnail,
        musicaDuracao: null,
      });

      // Criar pagamento e redirecionar
      const pagamento = await criarPagamento(pedido.data.id);
      window.location.href = pagamento.data.initPoint;
    } catch (error) {
      console.error('Erro:', error);
      alert(error.response?.data?.error || 'Erro ao processar pedido');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold text-white mb-2">🎵 Espeto Music</h1>
          <p className="text-white text-lg">Escolha a próxima música!</p>
        </div>

        {/* Nome do Cliente */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Seu Nome:
          </label>
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Digite seu nome"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Busca */}
        <form onSubmit={handleBuscar} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar música..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={carregandoBusca}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400"
            >
              {carregandoBusca ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Resultados</h2>
            <div className="space-y-4">
              {resultados.map((musica) => (
                <div key={musica.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <img src={musica.thumbnail} alt={musica.titulo} className="w-24 h-24 rounded object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{musica.titulo}</h3>
                    <p className="text-sm text-gray-600">{musica.canal}</p>
                  </div>
                  <button
                    onClick={() => handleEscolherMusica(musica)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                  >
                    Escolher R$ 5,00
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fila Atual */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🎵 Próximas Músicas</h2>
          {fila.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma música na fila ainda...</p>
          ) : (
            <div className="space-y-3">
              {fila.map((pedido, index) => (
                <div key={pedido.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-2xl font-bold text-purple-600">#{index + 1}</span>
                  <img src={pedido.musicaThumbnail} alt="" className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold">{pedido.musicaTitulo}</p>
                    <p className="text-sm text-gray-600">Por: {pedido.nomeCliente || 'Anônimo'}</p>
                  </div>
                  {pedido.status === 'tocando' && (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                      Tocando Agora
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
```

### `frontend-cliente/src/pages/Pagamento.jsx`
```jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Pagamento() {
  const { status } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const mensagens = {
    sucesso: {
      titulo: '✅ Pagamento Aprovado!',
      texto: 'Sua música foi adicionada à fila. Obrigado!',
      cor: 'bg-green-500',
    },
    pendente: {
      titulo: '⏳ Pagamento Pendente',
      texto: 'Aguardando confirmação do pagamento...',
      cor: 'bg-yellow-500',
    },
    falha: {
      titulo: '❌ Pagamento Recusado',
      texto: 'Não foi possível processar o pagamento. Tente novamente.',
      cor: 'bg-red-500',
    },
  };

  const msg = mensagens[status] || mensagens.falha;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className={`${msg.cor} rounded-lg shadow-2xl p-8 max-w-md w-full text-white text-center`}>
        <h1 className="text-4xl font-bold mb-4">{msg.titulo}</h1>
        <p className="text-xl mb-6">{msg.texto}</p>
        <p className="text-sm opacity-90">Redirecionando em 5 segundos...</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100"
        >
          Voltar Agora
        </button>
      </div>
    </div>
  );
}

export default Pagamento;
```

### `frontend-cliente/.gitignore`
```
# Dependencies
node_modules

# Production
dist

# Env
.env
.env.local

# Logs
*.log

# OS
.DS_Store
```

---

## FRONTEND TV (Painel)

### `frontend-tv/package.json`
```json
{
  "name": "espeto-music-tv",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "vite": "^5.0.8"
  }
}
```

### `frontend-tv/index.html`
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Espeto Music - Painel TV</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend-tv/src/main.jsx`
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### `frontend-tv/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #000;
  overflow: hidden;
}
```

### `frontend-tv/src/App.jsx`
```jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [musicaAtual, setMusicaAtual] = useState(null);
  const [fila, setFila] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Buscar estado inicial
    axios.get(`${API_URL}/api/musicas/atual`)
      .then(res => setMusicaAtual(res.data))
      .catch(console.error);

    axios.get(`${API_URL}/api/musicas/fila`)
      .then(res => setFila(res.data.filter(m => m.status !== 'tocando')))
      .catch(console.error);

    // Escutar eventos
    newSocket.on('musica:tocando', (musica) => {
      setMusicaAtual(musica);
    });

    newSocket.on('fila:atualizada', (novaFila) => {
      setFila(novaFila.filter(m => m.status !== 'tocando'));
    });

    newSocket.on('musica:concluida', () => {
      setMusicaAtual(null);
    });

    return () => newSocket.close();
  }, []);

  const handleVideoEnd = () => {
    if (musicaAtual && socket) {
      socket.emit('musica:terminou', { pedidoId: musicaAtual.id });
      axios.post(`${API_URL}/api/musicas/${musicaAtual.id}/concluir`)
        .catch(console.error);
    }
  };

  return (
    <div className="h-screen flex bg-black text-white">
      {/* Lado Esquerdo - Fila */}
      <div className="w-1/3 bg-gradient-to-br from-purple-900 to-indigo-900 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8">🎵 Próximas Músicas</h1>

        {fila.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-2xl">Nenhuma música na fila</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fila.map((pedido, index) => (
              <div key={pedido.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4">
                <span className="text-4xl font-bold text-purple-300">#{index + 1}</span>
                <img
                  src={pedido.musicaThumbnail}
                  alt=""
                  className="w-20 h-20 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate">{pedido.musicaTitulo}</p>
                  <p className="text-sm text-gray-300">Por: {pedido.nomeCliente || 'Anônimo'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lado Direito - Player */}
      <div className="w-2/3 flex flex-col">
        {/* Música Atual */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6">
          <h2 className="text-3xl font-bold mb-2">🎵 Tocando Agora</h2>
          {musicaAtual ? (
            <div>
              <p className="text-2xl font-semibold">{musicaAtual.musicaTitulo}</p>
              <p className="text-lg opacity-90">Pedido por: {musicaAtual.nomeCliente || 'Anônimo'}</p>
            </div>
          ) : (
            <p className="text-xl opacity-75">Aguardando próxima música...</p>
          )}
        </div>

        {/* YouTube Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {musicaAtual ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${musicaAtual.musicaYoutubeId}?autoplay=1&controls=1`}
              title="YouTube player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                // Detectar fim do vídeo (via postMessage da API do YouTube)
                setTimeout(handleVideoEnd, (musicaAtual.musicaDuracao || 240) * 1000);
              }}
            />
          ) : (
            <div className="text-center">
              <p className="text-4xl font-bold mb-4">Espeto Music</p>
              <p className="text-xl text-gray-400">Aguardando músicas...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
```

### `frontend-tv/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
})
```

### `frontend-tv/tailwind.config.js`
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `frontend-tv/postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `frontend-tv/.env.example`
```
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
```
