class CartController {
  constructor(getCart, addItemToCart, updateCartItem, removeItemFromCart, clearCartUseCase) {
    this.getCart = getCart;
    this.addItemToCart = addItemToCart;
    this.updateCartItem = updateCartItem;
    this.removeItemFromCart = removeItemFromCart;
    this.clearCartUseCase = clearCartUseCase;
  }

  async getCartByUser(req, res, next) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const cart = await this.getCart.execute(userId);
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const cart = await this.addItemToCart.execute(userId, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Item agregado al carrito exitosamente',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const cart = await this.updateCartItem.execute(userId, itemId, req.body);
      
      res.json({
        success: true,
        message: 'Item actualizado exitosamente',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
       
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const cart = await this.removeItemFromCart.execute(userId, itemId);
      
      res.json({
        success: true,
        message: 'Item removido exitosamente',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const cart = await this.clearCartUseCase.execute(userId);
      
      res.json({
        success: true,
        message: 'Carrito limpiado exitosamente',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;