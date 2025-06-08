class ClearCart {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    try {
      if (!userId) {
        throw new Error('ID de usuario es requerido');
      }

      // Obtener carrito
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      // Limpiar carrito
      cart.clear();

      // Guardar carrito actualizado
      const updatedCart = await this.cartRepository.update(cart);
      return updatedCart.toJSON();
    } catch (error) {
      throw new Error(`Error al limpiar carrito: ${error.message}`);
    }
  }
}

module.exports = ClearCart;