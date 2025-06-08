const axios = require('axios');

class ProductService {
  constructor() {
    this.productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
  }

  async getProduct(productId) {
    try {
      const response = await axios.get(`${this.productServiceUrl}/products/${productId}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'cart-service/1.0'
        }
      }); 

      if (response.data && response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error(`Error obteniendo producto ${productId}:`, error.message);
      
      // Si es error de red o timeout, lanzar error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('Servicio de productos no disponible');
      }
      
      // Si es 404, el producto no existe
      if (error.response && error.response.status === 404) {
        return null;
      }
      
      throw error;
    }
  }

  async getMultipleProducts(productIds) {
    try {
      const promises = productIds.map(id => this.getProduct(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
    } catch (error) {
      console.error('Error obteniendo múltiples productos:', error.message);
      return [];
    }
  }

  async validateStock(productId, quantity) {
    const product = await this.getProduct(productId);
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    if (product.stock < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`);
    }
    
    return true;
  }
}

module.exports = ProductService;