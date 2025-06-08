class CartItem {
  constructor(id, productId, productName, quantity, unitPrice, variant = null) {
    this.id = id;
    this.productId = productId;
    this.productName = productName;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.variant = variant; // Para productos con variantes (talla, color, etc.)
    this.totalPrice = this.calculateTotal();
    this.addedAt = new Date();
  }

  calculateTotal() {
    return this.quantity * this.unitPrice;
  }

  updateQuantity(newQuantity) {
    if (newQuantity < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }
    this.quantity = newQuantity;
    this.totalPrice = this.calculateTotal();
  }

  updatePrice(newPrice) {
    if (newPrice < 0) {
      throw new Error('El precio no puede ser negativo');
    }
    this.unitPrice = newPrice;
    this.totalPrice = this.calculateTotal();
  }

  // Verificar si es el mismo producto (incluyendo variantes)
  isSameProduct(productId, variant = null) {
    return this.productId === productId && 
           JSON.stringify(this.variant) === JSON.stringify(variant);
  }

  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      productName: this.productName,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      totalPrice: this.totalPrice,
      variant: this.variant,
      addedAt: this.addedAt
    };
  }
}

module.exports = CartItem;
