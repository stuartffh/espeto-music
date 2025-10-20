/**
 * Winston Logger - Logging estruturado para produção
 *
 * Níveis de log:
 * - error: Erros que requerem atenção imediata
 * - warn: Avisos de situações anormais
 * - info: Informações gerais do sistema
 * - http: Logs de requisições HTTP
 * - debug: Informações de debug (apenas em dev)
 *
 * Uso:
 * const logger = require('./shared/utils/logger');
 * logger.info('Mensagem', { contexto: 'extra' });
 * logger.error('Erro ocorreu', { error: err.message, stack: err.stack });
 */

const winston = require('winston');
const path = require('path');

// Determinar nível de log baseado no ambiente
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Formato customizado para console (colorido e legível)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Formato JSON para arquivos (fácil de parsear)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Criar diretório de logs se não existir
const fs = require('fs');
const logsDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar transportes
const transports = [
  // Erros em arquivo separado
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Todos os logs em arquivo combinado
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
  }),
];

// Console apenas em desenvolvimento ou se NODE_ENV não for production
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'espeto-music-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  // Não sair do processo em caso de erro no logger
  exitOnError: false,
});

// Método helper para criar child logger com contexto
logger.child = (meta) => {
  return logger.child(meta);
};

// Log de inicialização
logger.info('Logger inicializado', {
  level: logLevel,
  environment: process.env.NODE_ENV || 'development',
  logsDir,
});

module.exports = logger;
