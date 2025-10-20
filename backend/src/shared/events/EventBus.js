/**
 * Event Bus - Sistema de eventos para arquitetura event-driven
 *
 * Desacopla componentes através de eventos de domínio
 *
 * Uso:
 * const eventBus = require('./shared/events/EventBus');
 *
 * // Subscriber
 * eventBus.subscribe('pedido.pago', async (pedido) => {
 *   await downloadService.baixarVideo(pedido.musicaYoutubeId);
 * });
 *
 * // Publisher
 * eventBus.publish('pedido.pago', pedido);
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Aumentar limite de listeners
    this.handlers = new Map();
  }

  /**
   * Registrar handler para um evento
   * @param {string} eventName - Nome do evento
   * @param {Function} handler - Função handler (async ou sync)
   * @param {Object} options - Opções do handler
   */
  subscribe(eventName, handler, options = {}) {
    const { priority = 0, once = false } = options;

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    // Adicionar handler com metadados
    const handlerWrapper = async (...args) => {
      try {
        await handler(...args);
      } catch (error) {
        logger.error(`Error in event handler for ${eventName}`, {
          event: eventName,
          error: error.message,
          stack: error.stack,
        });
      }
    };

    const handlerMeta = {
      handler: handlerWrapper,
      originalHandler: handler,
      priority,
      once,
    };

    this.handlers.get(eventName).push(handlerMeta);

    // Ordenar por prioridade (maior primeiro)
    this.handlers.get(eventName).sort((a, b) => b.priority - a.priority);

    // Registrar no EventEmitter
    if (once) {
      this.once(eventName, handlerWrapper);
    } else {
      this.on(eventName, handlerWrapper);
    }

    logger.debug(`Event handler registered`, {
      event: eventName,
      priority,
      once,
    });
  }

  /**
   * Publicar evento (fire and forget - não aguarda)
   * @param {string} eventName - Nome do evento
   * @param {*} data - Dados do evento
   */
  publish(eventName, data) {
    logger.debug(`Event published`, {
      event: eventName,
      hasData: !!data,
    });

    this.emit(eventName, data);

    // Log para auditoria
    logger.info(`Event: ${eventName}`, {
      event: eventName,
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data,
    });
  }

  /**
   * Publicar evento e aguardar todos os handlers (sequencial)
   * @param {string} eventName - Nome do evento
   * @param {*} data - Dados do evento
   */
  async publishAndWait(eventName, data) {
    const handlers = this.handlers.get(eventName) || [];

    logger.debug(`Event published (with wait)`, {
      event: eventName,
      handlersCount: handlers.length,
    });

    // Executar handlers sequencialmente respeitando prioridade
    for (const { handler, originalHandler, once } of handlers) {
      try {
        await handler(data);

        // Remover handler se for once
        if (once) {
          this.removeListener(eventName, handler);
        }
      } catch (error) {
        logger.error(`Error executing handler for ${eventName}`, {
          event: eventName,
          error: error.message,
          stack: error.stack,
        });
      }
    }
  }

  /**
   * Publicar evento e aguardar todos os handlers (paralelo)
   * @param {string} eventName - Nome do evento
   * @param {*} data - Dados do evento
   */
  async publishParallel(eventName, data) {
    const handlers = this.handlers.get(eventName) || [];

    logger.debug(`Event published (parallel)`, {
      event: eventName,
      handlersCount: handlers.length,
    });

    // Executar todos os handlers em paralelo
    const promises = handlers.map(({ handler }) => handler(data));

    const results = await Promise.allSettled(promises);

    // Log de erros
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Handler failed for ${eventName}`, {
          event: eventName,
          handlerIndex: index,
          error: result.reason,
        });
      }
    });

    return results;
  }

  /**
   * Remover handler de um evento
   * @param {string} eventName - Nome do evento
   * @param {Function} handler - Handler a ser removido
   */
  unsubscribe(eventName, handler) {
    if (this.handlers.has(eventName)) {
      const handlers = this.handlers.get(eventName);
      const index = handlers.findIndex((h) => h.originalHandler === handler);

      if (index > -1) {
        const removed = handlers.splice(index, 1)[0];
        this.removeListener(eventName, removed.handler);

        logger.debug(`Event handler unregistered`, {
          event: eventName,
        });
      }
    }
  }

  /**
   * Remover todos os handlers de um evento
   * @param {string} eventName - Nome do evento
   */
  unsubscribeAll(eventName) {
    if (this.handlers.has(eventName)) {
      const handlers = this.handlers.get(eventName);
      handlers.forEach(({ handler }) => {
        this.removeListener(eventName, handler);
      });
      this.handlers.delete(eventName);

      logger.debug(`All handlers removed for event`, {
        event: eventName,
      });
    }
  }

  /**
   * Obter lista de eventos registrados
   */
  getRegisteredEvents() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Obter número de handlers por evento
   */
  getHandlersCount(eventName) {
    return this.handlers.get(eventName)?.length || 0;
  }
}

// Singleton
const eventBus = new EventBus();

// Log de eventos conhecidos (documentação)
logger.info('Event Bus inicializado');
logger.debug('Eventos de domínio disponíveis', {
  eventos: [
    'pedido.criado',
    'pedido.pago',
    'pedido.rejeitado',
    'musica.iniciada',
    'musica.pausada',
    'musica.finalizada',
    'fila.atualizada',
    'download.iniciado',
    'download.completo',
    'download.falhou',
    'config.atualizada',
  ],
});

module.exports = eventBus;
