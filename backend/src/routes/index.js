const express = require('express');
const router = express.Router();

const mesaRoutes = require('./mesaRoutes');
const musicaRoutes = require('./musicaRoutes');
const pagamentoRoutes = require('./pagamentoRoutes');
const authRoutes = require('./authRoutes');
const configuracaoRoutes = require('./configuracaoRoutes');
const publicRoutes = require('./publicRoutes');
const sugestaoRoutes = require('./sugestaoRoutes');
const playerRoutes = require('./playerRoutes');
const streamRoutes = require('./stream');
const moderacaoRoutes = require('./moderacaoRoutes');
const themeRoutes = require('./themeRoutes');
const giftCardRoutes = require('./giftCardRoutes');
const webhookRoutes = require('./webhookRoutes');
const carrinhoRoutes = require('./carrinhoRoutes');
const historicoRoutes = require('./historico');

// Timestamp de inicialização do servidor (usado para detectar reinicializações)
const SERVER_START_TIME = Date.now();

const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');

// Health check melhorado
router.get('/health', async (req, res) => {
  const checks = {
    database: false,
    downloads: false,
    memory: false,
  };

  let healthy = true;

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.database = false;
    healthy = false;
  }

  try {
    // Check downloads directory
    const downloadsDir = path.join(__dirname, '../../downloads');
    checks.downloads = fs.existsSync(downloadsDir);
    if (!checks.downloads) healthy = false;
  } catch (error) {
    checks.downloads = false;
    healthy = false;
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB
  checks.memory = memUsage.heapUsed < memLimit;
  if (!checks.memory) healthy = false;

  const statusCode = healthy ? 200 : 503;

  res.status(statusCode).json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    serverStartTime: SERVER_START_TIME,
    checks,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    },
  });
});

// Prometheus metrics endpoint
const { register } = require('../shared/monitoring/metrics');
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Rotas públicas (sem autenticação)
router.use('/public', publicRoutes);

// Webhooks (sem autenticação - recebe de servidores externos)
router.use('/webhooks', webhookRoutes);

// Carrinho (público - identificado por IP)
router.use('/carrinho', carrinhoRoutes);

// Rotas protegidas
router.use('/mesas', mesaRoutes);
router.use('/musicas', musicaRoutes);
router.use('/pagamentos', pagamentoRoutes);
router.use('/auth', authRoutes);
router.use('/config', configuracaoRoutes);
router.use('/sugestoes', sugestaoRoutes);
router.use('/player', playerRoutes);
router.use('/stream', streamRoutes);
router.use('/admin/moderacao', moderacaoRoutes);
router.use('/theme', themeRoutes);
router.use('/admin/theme', themeRoutes);
router.use('/gifts', giftCardRoutes);
router.use('/historico', historicoRoutes);

module.exports = router;
