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
const superAdminRoutes = require('./superAdminRoutes');

// ========================================
// MIDDLEWARES MULTI-TENANT
// ========================================
const { tenantContext, requireTenant } = require('../middleware/tenantContext');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ========================================
// ROTAS SEM TENANT CONTEXT
// ========================================

// Super Admin (requer autenticação especial, sem tenant)
router.use('/super-admin', superAdminRoutes);

// Rotas públicas (sem autenticação, sem tenant)
router.use('/public', publicRoutes);

// Webhooks (sem autenticação - recebe de servidores externos)
// Nota: webhook do Mercado Pago precisa buscar tenant do pedido
router.use('/webhooks', webhookRoutes);

// ========================================
// ROTAS COM TENANT CONTEXT (MULTI-TENANT)
// ========================================

// Aplicar middleware tenantContext em TODAS as rotas abaixo
router.use(tenantContext);

// Carrinho (identificado por IP/session + tenant)
router.use('/carrinho', carrinhoRoutes);

// Rotas protegidas com isolamento por tenant
router.use('/mesas', requireTenant, mesaRoutes);
router.use('/musicas', requireTenant, musicaRoutes);
router.use('/pagamentos', requireTenant, pagamentoRoutes);
router.use('/auth', authRoutes); // Auth pode não precisar requireTenant (depende da implementação)
router.use('/config', requireTenant, configuracaoRoutes);
router.use('/sugestoes', requireTenant, sugestaoRoutes);
router.use('/player', requireTenant, playerRoutes);
router.use('/stream', requireTenant, streamRoutes);
router.use('/admin/moderacao', requireTenant, moderacaoRoutes);
router.use('/theme', requireTenant, themeRoutes);
router.use('/admin/theme', requireTenant, themeRoutes);
router.use('/gifts', requireTenant, giftCardRoutes);

module.exports = router;
