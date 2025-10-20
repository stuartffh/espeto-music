/**
 * Middleware de Validação com Zod
 *
 * Uso:
 * const { validate } = require('../shared/validators/validate');
 * const { buscarMusicasSchema } = require('../shared/validators/schemas');
 *
 * router.get('/buscar', validate(buscarMusicasSchema), controller.buscar);
 */

const logger = require('../utils/logger');

/**
 * Middleware de validação
 * @param {import('zod').ZodSchema} schema - Schema Zod para validar
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      // Validar request contra schema
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Substituir req.body, req.query, req.params pelos dados validados
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      next();
    } catch (error) {
      // Zod validation error
      if (error.name === 'ZodError') {
        logger.warn('Validation error', {
          errors: error.errors,
          url: req.originalUrl,
          method: req.method,
        });

        const errors = error.errors.map((err) => ({
          campo: err.path.join('.'),
          mensagem: err.message,
        }));

        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: errors,
        });
      }

      // Outro tipo de erro
      next(error);
    }
  };
}

module.exports = { validate };
