const Joi = require('joi');

class AddItemToCart {
  constructor(cartRepository, productService) {
    this.cartRepository = cartRepository;
    this.productService = productService;
  }

  async execute(userId, itemData) {
    // Validación de datos
    const schema = Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).max(100).required(),
      variant: Joi.object().optional()
    });

    const { error, value } = schema.validate(itemData);
    if (error) {
      throw new Error(`Datos inválidos: ${error.details[0].message}`);
    }

    try {
      // Obtener información del producto
      const product = await this.productService.getProduct(value.productId);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Verificar stock disponible
      if (product.stock < value.quantity) {
        throw new Error('Stock insuficiente');
      }

      // Obtener o crear carrito
      let cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        cart = await this.cartRepository.create(userId);
      }

      // Agregar item al carrito
      cart.addItem(
        value.productId,
        value.quantity,
        product.price,
        product.name
      );

      // Guardar carrito actualizado
      const updatedCart = await this.cartRepository.update(cart);
      return updatedCart.toJSON();
    } catch (error) {
      throw new Error(`Error al agregar item al carrito: ${error.message}`);
    }
  }
}

module.exports = AddItemToCart;
