/**
 * Prometheus Metrics - Sistema de métricas para monitoramento
 *
 * Endpoint de métricas: GET /api/metrics
 *
 * Integra com Prometheus/Grafana para observabilidade
 */

const client = require('prom-client');
const logger = require('../utils/logger');

// Criar registry
const register = new client.Registry();

// Adicionar prefixo a todas as métricas
register.setDefaultLabels({
  app: 'espeto-music-backend',
});

// ========== MÉTRICAS HTTP ==========

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// ========== MÉTRICAS WEBSOCKET ==========

const wsConnections = new client.Gauge({
  name: 'websocket_connections_total',
  help: 'Number of active WebSocket connections',
  labelNames: ['type'], // type: 'tv', 'admin', 'client'
});

const wsMessagesTotal = new client.Counter({
  name: 'websocket_messages_total',
  help: 'Total WebSocket messages sent/received',
  labelNames: ['direction', 'event'], // direction: 'sent' or 'received'
});

// ========== MÉTRICAS DE DOWNLOAD ==========

const downloadDuration = new client.Histogram({
  name: 'download_duration_seconds',
  help: 'Duration of video downloads',
  labelNames: ['status'], // status: 'success' or 'failure'
  buckets: [10, 30, 60, 120, 300, 600],
});

const downloadQueueLength = new client.Gauge({
  name: 'download_queue_length',
  help: 'Number of videos waiting in download queue',
});

const downloadErrors = new client.Counter({
  name: 'download_errors_total',
  help: 'Total number of download errors',
  labelNames: ['error_type'],
});

const downloadsTotal = new client.Counter({
  name: 'downloads_total',
  help: 'Total number of downloads',
  labelNames: ['status'], // status: 'success', 'failed', 'cached'
});

// ========== MÉTRICAS DE PLAYER ==========

const activePlayers = new client.Gauge({
  name: 'active_players_total',
  help: 'Number of active players (música tocando)',
});

const musicasTocandasTotal = new client.Counter({
  name: 'musicas_tocadas_total',
  help: 'Total number of songs played',
});

const filaLength = new client.Gauge({
  name: 'fila_length',
  help: 'Number of songs in queue',
});

// ========== MÉTRICAS DE PAGAMENTO ==========

const pagamentosTotal = new client.Counter({
  name: 'pagamentos_total',
  help: 'Total number of payments',
  labelNames: ['status', 'tipo'], // status: 'aprovado'/'rejeitado', tipo: 'pix'/'credito'/'gift'
});

const receitaTotal = new client.Counter({
  name: 'receita_total_brl',
  help: 'Total revenue in BRL',
  labelNames: ['tipo'], // tipo: 'pix', 'credito', 'gift'
});

// ========== MÉTRICAS DE BANCO DE DADOS ==========

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'model'], // operation: 'findMany', 'create', etc
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const dbErrors = new client.Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['error_code'],
});

// ========== MÉTRICAS DE SISTEMA ==========

const errorRate = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'], // type: 'validation', 'business', 'system'
});

// Registrar todas as métricas
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(wsConnections);
register.registerMetric(wsMessagesTotal);
register.registerMetric(downloadDuration);
register.registerMetric(downloadQueueLength);
register.registerMetric(downloadErrors);
register.registerMetric(downloadsTotal);
register.registerMetric(activePlayers);
register.registerMetric(musicasTocandasTotal);
register.registerMetric(filaLength);
register.registerMetric(pagamentosTotal);
register.registerMetric(receitaTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbErrors);
register.registerMetric(errorRate);

// Coletar métricas padrão do Node.js (CPU, memória, event loop, etc)
client.collectDefaultMetrics({ register });

logger.info('Prometheus metrics inicializadas');

module.exports = {
  register,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    wsConnections,
    wsMessagesTotal,
    downloadDuration,
    downloadQueueLength,
    downloadErrors,
    downloadsTotal,
    activePlayers,
    musicasTocandasTotal,
    filaLength,
    pagamentosTotal,
    receitaTotal,
    dbQueryDuration,
    dbErrors,
    errorRate,
  },
};
