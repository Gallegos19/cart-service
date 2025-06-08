class CartRepository {
  /**
   * Buscar carrito por ID de usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Cart|null>}
   */
  async findByUserId(userId) {
    throw new Error('Method findByUserId must be implemented');
  }

  /**
   * Buscar carrito por ID
   * @param {string} cartId - ID del carrito
   * @returns {Promise<Cart|null>}
   */
  async findById(cartId) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Crear nuevo carrito
   * @param {string} userId - ID del usuario
   * @returns {Promise<Cart>}
   */
  async create(userId) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Actualizar carrito existente
   * @param {Cart} cart - Carrito a actualizar
   * @returns {Promise<Cart>}
   */
  async update(cart) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Eliminar carrito
   * @param {string} cartId - ID del carrito
   * @returns {Promise<void>}
   */
  async delete(cartId) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Obtener carritos abandonados
   * @param {number} hoursAgo - Horas de inactividad
   * @returns {Promise<Cart[]>}
   */
  async findAbandoned(hoursAgo = 24) {
    throw new Error('Method findAbandoned must be implemented');
  }
}

module.exports = CartRepository;
