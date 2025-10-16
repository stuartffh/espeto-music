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

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rotas públicas (sem autenticação)
router.use('/public', publicRoutes);

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

module.exports = router;
