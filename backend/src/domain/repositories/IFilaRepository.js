/**
 * Repository Interface: IFilaRepository
 *
 * Define contrato para acesso a dados da Fila
 */

class IFilaRepository {
  /**
   * Busca fila por ID
   * @param {string} id
   * @returns {Promise<Fila|null>}
   */
  async findById(id) {
    throw new Error('Método findById não implementado');
  }

  /**
   * Busca fila atual (única fila do sistema)
   * @returns {Promise<Fila|null>}
   */
  async findAtual() {
    throw new Error('Método findAtual não implementado');
  }

  /**
   * Salva nova fila
   * @param {Fila} fila
   * @returns {Promise<Fila>}
   */
  async save(fila) {
    throw new Error('Método save não implementado');
  }

  /**
   * Atualiza fila existente
   * @param {Fila} fila
   * @returns {Promise<Fila>}
   */
  async update(fila) {
    throw new Error('Método update não implementado');
  }

  /**
   * Busca ou cria fila (garante que sempre existe uma fila)
   * @returns {Promise<Fila>}
   */
  async findOrCreate() {
    throw new Error('Método findOrCreate não implementado');
  }
}

module.exports = IFilaRepository;
