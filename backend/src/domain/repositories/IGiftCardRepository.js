/**
 * Repository Interface: IGiftCardRepository
 *
 * Define contrato para acesso a dados de Gift Cards
 */

class IGiftCardRepository {
  /**
   * Busca gift card por ID
   * @param {string} id
   * @returns {Promise<GiftCard|null>}
   */
  async findById(id) {
    throw new Error('Método findById não implementado');
  }

  /**
   * Busca gift card por código
   * @param {string} codigo
   * @returns {Promise<GiftCard|null>}
   */
  async findByCodigo(codigo) {
    throw new Error('Método findByCodigo não implementado');
  }

  /**
   * Busca todos os gift cards com filtros opcionais
   * @param {Object} filters
   * @returns {Promise<GiftCard[]>}
   */
  async findAll(filters = {}) {
    throw new Error('Método findAll não implementado');
  }

  /**
   * Busca gift cards ativos
   * @returns {Promise<GiftCard[]>}
   */
  async findAtivos() {
    throw new Error('Método findAtivos não implementado');
  }

  /**
   * Busca gift cards expirados
   * @returns {Promise<GiftCard[]>}
   */
  async findExpirados() {
    throw new Error('Método findExpirados não implementado');
  }

  /**
   * Salva novo gift card
   * @param {GiftCard} giftCard
   * @returns {Promise<GiftCard>}
   */
  async save(giftCard) {
    throw new Error('Método save não implementado');
  }

  /**
   * Atualiza gift card existente
   * @param {GiftCard} giftCard
   * @returns {Promise<GiftCard>}
   */
  async update(giftCard) {
    throw new Error('Método update não implementado');
  }

  /**
   * Remove gift card
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Método delete não implementado');
  }

  /**
   * Verifica se código já existe
   * @param {string} codigo
   * @returns {Promise<boolean>}
   */
  async codigoExiste(codigo) {
    throw new Error('Método codigoExiste não implementado');
  }

  /**
   * Conta gift cards com filtros
   * @param {Object} filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    throw new Error('Método count não implementado');
  }
}

module.exports = IGiftCardRepository;
