class GetCart {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

async execute(userId) {
    try {
      if (!userId) {
        throw new Error('ID de usuario es requerido');
      }

      let cart = await this.cartRepository.findByUserId(userId);
      
      // Si no existe carrito, crear uno nuevo
      if (!cart) {
        cart = await this.cartRepository.create(userId);
      }

      // 🔍 DEBUG: Inspecciona el cart antes del toJSON
      console.log('Cart raw:', cart);
      console.log('Cart items tipo:', typeof cart.items);
      console.log('Cart items valor:', cart.items);
      
      return cart.toJSON();
    } catch (error) {
      throw new Error(`Error al obtener carrito: ${error.message}`);
    }
  }
}

module.exports = GetCart;