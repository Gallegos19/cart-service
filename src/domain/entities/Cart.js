class Cart {
  constructor(id, userId, items = [], createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.items = items || [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Agregar item al carrito
  addItem(productId, quantity = 1, price, productName) {
    const existingItem = this.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      this.items.push({
        id: this.generateItemId(),
        productId,
        productName,
        quantity,
        unitPrice: price,
        totalPrice: quantity * price,
        addedAt: new Date()
      });
    }
    
    this.updatedAt = new Date();
  }

  // Actualizar cantidad de item
  updateItemQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.items.find(item => item.id === itemId);
    if (item) {
      item.quantity = newQuantity;
      item.totalPrice = item.quantity * item.unitPrice;
      this.updatedAt = new Date();
    }
  }

  // Remover item del carrito
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updatedAt = new Date();
  }

  // Limpiar carrito
  clear() {
    this.items = [];
    this.updatedAt = new Date();
  }

  // Calcular total del carrito
  getTotal() {
    return this.items.reduce((total, item) => total + item.totalPrice, 0);
  }

  // Obtener cantidad total de items
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Verificar si está vacío
  isEmpty() {
    return this.items.length === 0;
  }

  // Obtener item por ID de producto
  getItemByProductId(productId) {
    return this.items.find(item => item.productId === productId);
  }

  // Validar disponibilidad de stock (necesita llamada externa)
  async validateStock(productService) {
    for (const item of this.items) {
      const product = await productService.getProduct(item.productId);
      if (!product || product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.productName}`);
      }
    }
  }

  // Generar ID único para item
  generateItemId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Factory method para crear desde datos de BD
static fromDatabase(dbRow) {
  const items = typeof dbRow.items === 'string' 
    ? JSON.parse(dbRow.items || '[]')
    : (dbRow.items || []);

  return new Cart(
    dbRow.id,
    dbRow.user_id,
    items,
    dbRow.created_at,
    dbRow.updated_at
  );
}

  // Método para convertir a objeto plano
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      total: this.getTotal(),
      totalItems: this.getTotalItems(),
      isEmpty: this.isEmpty(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Cart;
