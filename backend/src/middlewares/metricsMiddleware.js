/**
 * Metrics Middleware - Coleta métricas de requisições HTTP
 *
 * Registra duração e status de cada requisição
 */

const { metrics } = require('../shared/monitoring/metrics');

/**
 * Middleware para coletar métricas HTTP
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Interceptar resposta
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // segundos

    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Registrar duração
    metrics.httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);

    // Registrar contador
    metrics.httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
  });

  next();
}

module.exports = metricsMiddleware;
