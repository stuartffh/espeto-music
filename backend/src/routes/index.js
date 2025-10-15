const express = require('express');
const router = express.Router();

const mesaRoutes = require('./mesaRoutes');
const musicaRoutes = require('./musicaRoutes');
const pagamentoRoutes = require('./pagamentoRoutes');
const authRoutes = require('./authRoutes');
const configuracaoRoutes = require('./configuracaoRoutes');
const sugestaoRoutes = require('./sugestaoRoutes');
const playerRoutes = require('./playerRoutes');
const streamRoutes = require('./stream');
const publicConfigRoutes = require('./publicConfigRoutes');
const mediaRoutes = require('./mediaRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rotas
router.use('/mesas', mesaRoutes);
router.use('/musicas', musicaRoutes);
router.use('/pagamentos', pagamentoRoutes);
router.use('/auth', authRoutes);
router.use('/config', configuracaoRoutes);
router.use('/sugestoes', sugestaoRoutes);
router.use('/player', playerRoutes);
router.use('/stream', streamRoutes);
router.use('/public/config', publicConfigRoutes);
router.use('/media', mediaRoutes);

module.exports = router;
