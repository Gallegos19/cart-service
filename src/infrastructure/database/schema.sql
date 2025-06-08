-- Verificar y crear base de datos solo si no existe
SELECT 'CREATE DATABASE cart_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cart_db')\gexec

-- Conectar a la base de datos
\c cart_db;

-- Crear tabla carts solo si no existe
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_user_cart UNIQUE (user_id)
);

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_updated_at ON carts(updated_at);
CREATE INDEX IF NOT EXISTS idx_carts_items_gin ON carts USING GIN (items);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo solo si la tabla está vacía
INSERT INTO carts (user_id, items) 
SELECT 
    '123e4567-e89b-12d3-a456-426614174000',
    '[
        {
            "id": "item1",
            "productId": "prod123",
            "productName": "Laptop Gaming",
            "quantity": 1,
            "unitPrice": 25000.00,
            "totalPrice": 25000.00,
            "addedAt": "2024-01-15T10:30:00.000Z"
        },
        {
            "id": "item2", 
            "productId": "prod456",
            "productName": "Mouse Inalámbrico",
            "quantity": 2,
            "unitPrice": 450.00,
            "totalPrice": 900.00,
            "addedAt": "2024-01-15T10:35:00.000Z"
        }
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM carts WHERE user_id = '123e4567-e89b-12d3-a456-426614174000');