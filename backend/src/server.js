require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const { setupSocketHandlers } = require('./utils/socketHandler');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Configurar CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL // Frontend unificado
      : '*',
  credentials: true,
};

// Configurar Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar para desenvolvimento
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir uploads públicos (vídeos, imagens configuráveis)
const uploadsPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath, { maxAge: '1d' }));

// Disponibilizar io para os controllers
app.set('io', io);

// Request logging em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Rotas da API
app.use('/api', routes);

// Servir frontend unificado em produção
// Servir frontend unificado (Cliente, Admin e TV)
const frontendPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // Todas as rotas não-API servem o frontend React Router
  // React Router irá gerenciar as rotas: /, /tv, /admin, /admin/login, /pagamento
  app.get('*', (req, res, next) => {
    // Pular rotas da API
    if (req.path.startsWith('/api') || req.path === '/qrcode') {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Fallback caso o frontend não esteja buildado
  app.get('/', (req, res) => {
    res.json({
      message: 'Espeto Music API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        mesas: '/api/mesas',
        musicas: '/api/musicas',
        pagamentos: '/api/pagamentos',
        websocket: 'ws://localhost:' + PORT,
        tv: '/tv',
        admin: '/admin',
      },
    });
  });
}

// Rota para gerar QR Code único (modelo "livepix")
app.get('/qrcode', async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const url = `${process.env.BASE_URL || 'http://localhost:5173'}`;
    const qrCode = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
    });

    res.json({
      url,
      qrCode,
      message: 'Escaneie este QR Code para acessar o Espeto Music',
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Configurar WebSocket handlers
setupSocketHandlers(io);

// Inicializar Download Service
const downloadService = require('./services/downloadService');
downloadService.inicializar();

// Iniciar servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('\n🎵 ═══════════════════════════════════════════════════════');
  console.log('   ESPETO MUSIC - Backend Server');
  console.log('   ═══════════════════════════════════════════════════════');
  console.log(`   🚀 Servidor rodando na porta ${PORT}`);
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`   📱 QR Code: http://localhost:${PORT}/qrcode`);
  console.log(`   💾 Database: SQLite (${process.env.DATABASE_URL})`);
  console.log(`   🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('   ═══════════════════════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recebido, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

module.exports = { app, server, io };
