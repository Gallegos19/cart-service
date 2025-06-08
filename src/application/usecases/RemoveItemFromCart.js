class RemoveItemFromCart {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId, itemId) {
    try {
      if (!userId || !itemId) {
        throw new Error('ID de usuario e ID de item son requeridos');
      }

      // Obtener carrito
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      // Verificar que el item existe
      const item = cart.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item no encontrado en el carrito');
      }

      // Remover item
      cart.removeItem(itemId);

      // Guardar carrito actualizado
      const updatedCart = await this.cartRepository.update(cart);
      return updatedCart.toJSON();
    } catch (error) {
      throw new Error(`Error al remover item del carrito: ${error.message}`);
    }
  }
}

module.exports = RemoveItemFromCart;