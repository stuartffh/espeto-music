/**
 * Error Handler Global - Middleware para tratamento de erros
 *
 * Captura todos os erros e retorna resposta adequada
 * Logs estruturados para debugging
 */

const logger = require('../shared/utils/logger');
const { AppError } = require('../shared/errors/AppError');

/**
 * Tratamento de erros do Prisma
 */
function handlePrismaError(error) {
  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'campo';
    return new AppError(`${field} já está em uso`, 409);
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return new AppError('Registro não encontrado', 404);
  }

  // P2003: Foreign key constraint failed
  if (error.code === 'P2003') {
    return new AppError('Referência inválida', 400);
  }

  // Erro genérico do Prisma
  return new AppError('Erro no banco de dados', 500);
}

/**
 * Tratamento de erros do Zod
 */
function handleZodError(error) {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    statusCode: 400,
    message: 'Dados inválidos',
    errors,
  };
}

/**
 * Middleware de tratamento de erros
 */
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  logger.error('Erro capturado pelo error handler', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.admin?.id || req.user?.id,
  });

  // Erros do Prisma
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  }

  // Erros do Zod
  if (err.name === 'ZodError') {
    const zodError = handleZodError(err);
    return res.status(zodError.statusCode).json({
      erro: zodError.message,
      detalhes: zodError.errors,
    });
  }

  // Erros de validação do express-validator
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  // Resposta
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor';

  const response = {
    erro: message,
  };

  // Adicionar stack trace apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(statusCode).json(response);
}

/**
 * Handler para rotas não encontradas (404)
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Rota ${req.originalUrl} não encontrada`, 404);
  next(error);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
