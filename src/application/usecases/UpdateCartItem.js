const Joi = require('joi');

class UpdateCartItem {
  constructor(cartRepository, productService) {
    this.cartRepository = cartRepository;
    this.productService = productService;
  }

  async execute(userId, itemId, updateData) {
    const schema = Joi.object({
      quantity: Joi.number().integer().min(0).max(100).required()
    });

    const { error, value } = schema.validate(updateData);
    if (error) {
      throw new Error(`Datos inválidos: ${error.details[0].message}`);
    }

    try {
      // Obtener carrito
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      // Buscar item en el carrito
      const item = cart.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item no encontrado en el carrito');
      }

      // Si cantidad es 0, remover item
      if (value.quantity === 0) {
        cart.removeItem(itemId);
      } else {
        // Verificar stock disponible
        const product = await this.productService.getProduct(item.productId);
        if (product && product.stock < value.quantity) {
          throw new Error('Stock insuficiente para la cantidad solicitada');
        }

        // Actualizar cantidad
        cart.updateItemQuantity(itemId, value.quantity);
      }

      // Guardar carrito actualizado
      const updatedCart = await this.cartRepository.update(cart);
      return updatedCart.toJSON();
    } catch (error) {
      throw new Error(`Error al actualizar item del carrito: ${error.message}`);
    }
  }
}

module.exports = UpdateCartItem;