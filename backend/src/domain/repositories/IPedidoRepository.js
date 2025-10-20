/**
 * Repository Interface: IPedidoRepository
 *
 * Define contrato para acesso a dados de Pedidos
 * Implementações concretas devem respeitar esta interface
 */

class IPedidoRepository {
  /**
   * Busca pedido por ID
   * @param {string} id
   * @returns {Promise<Pedido|null>}
   */
  async findById(id) {
    throw new Error('Método findById não implementado');
  }

  /**
   * Busca todos os pedidos com filtros opcionais
   * @param {Object} filters
   * @returns {Promise<Pedido[]>}
   */
  async findAll(filters = {}) {
    throw new Error('Método findAll não implementado');
  }

  /**
   * Busca pedidos por status de pagamento
   * @param {string} status
   * @returns {Promise<Pedido[]>}
   */
  async findByStatusPagamento(status) {
    throw new Error('Método findByStatusPagamento não implementado');
  }

  /**
   * Busca pedidos por status de música
   * @param {string} status
   * @returns {Promise<Pedido[]>}
   */
  async findByStatusMusica(status) {
    throw new Error('Método findByStatusMusica não implementado');
  }

  /**
   * Busca pedidos na fila (ordenados por posição)
   * @returns {Promise<Pedido[]>}
   */
  async findNaFila() {
    throw new Error('Método findNaFila não implementado');
  }

  /**
   * Busca próximo pedido da fila
   * @returns {Promise<Pedido|null>}
   */
  async findProximoNaFila() {
    throw new Error('Método findProximoNaFila não implementado');
  }

  /**
   * Busca pedidos por gift card
   * @param {string} giftCardId
   * @returns {Promise<Pedido[]>}
   */
  async findByGiftCard(giftCardId) {
    throw new Error('Método findByGiftCard não implementado');
  }

  /**
   * Busca pedidos por carrinho
   * @param {string} carrinhoId
   * @returns {Promise<Pedido[]>}
   */
  async findByCarrinho(carrinhoId) {
    throw new Error('Método findByCarrinho não implementado');
  }

  /**
   * Salva novo pedido
   * @param {Pedido} pedido
   * @returns {Promise<Pedido>}
   */
  async save(pedido) {
    throw new Error('Método save não implementado');
  }

  /**
   * Atualiza pedido existente
   * @param {Pedido} pedido
   * @returns {Promise<Pedido>}
   */
  async update(pedido) {
    throw new Error('Método update não implementado');
  }

  /**
   * Remove pedido
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Método delete não implementado');
  }

  /**
   * Conta pedidos com filtros
   * @param {Object} filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    throw new Error('Método count não implementado');
  }

  /**
   * Reordena fila
   * @param {Array<{id: string, posicao: number}>} reordenacao
   * @returns {Promise<boolean>}
   */
  async reordenarFila(reordenacao) {
    throw new Error('Método reordenarFila não implementado');
  }
}

module.exports = IPedidoRepository;
