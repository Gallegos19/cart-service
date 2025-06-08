const CartRepository = require('../../domain/repositories/CartRepository');
const Cart = require('../../domain/entities/Cart');

class PostgresCartRepository extends CartRepository {
  constructor(dbConnection) {
    super();
    this.db = dbConnection;
  }

  async findByUserId(userId) {
    const query = 'SELECT * FROM carts WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    console.log('Tipo de items:', typeof result.rows[0].items); 
    return  Cart.fromDatabase(result.rows[0]);
  }

  async findById(cartId) {
    const query = 'SELECT * FROM carts WHERE id = $1';
    const result = await this.db.query(query, [cartId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Cart.fromDatabase(result.rows[0]);
  }

  async create(userId) {
    const query = `
      INSERT INTO carts (id, user_id, items, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, '[]', NOW(), NOW())
      RETURNING *
    `;
    
    const result = await this.db.query(query, [userId]);
    return Cart.fromDatabase(result.rows[0]);
  }

  async update(cart) {
    const query = `
      UPDATE carts 
      SET items = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const itemsJson = JSON.stringify(cart.items);
    const result = await this.db.query(query, [itemsJson, cart.id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Cart.fromDatabase(result.rows[0]);
  }

  async delete(cartId) {
    const query = 'DELETE FROM carts WHERE id = $1';
    await this.db.query(query, [cartId]);
  }

  async findAbandoned(hoursAgo = 24) {
    const query = `
      SELECT * FROM carts 
      WHERE updated_at < NOW() - INTERVAL '${hoursAgo} hours'
      AND items != '[]'
      ORDER BY updated_at ASC
    `;
    
    const result = await this.db.query(query);
    return result.rows.map(row => Cart.fromDatabase(row));
  }

  // Obtener estadísticas de carritos
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_carts,
        COUNT(CASE WHEN items != '[]' THEN 1 END) as active_carts,
        COUNT(CASE WHEN items = '[]' THEN 1 END) as empty_carts,
        AVG(json_array_length(items)) as avg_items_per_cart
      FROM carts
    `;
    
    const result = await this.db.query(query);
    return result.rows[0];
  }
}

module.exports = PostgresCartRepository;
