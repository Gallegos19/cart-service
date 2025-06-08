const express = require('express');
const extractUserInfo = require('../middleware/extractUserInfo');
const CartController = require('../controllers/CartController');

// Use Cases
const GetCart = require('../../application/usecases/GetCart');
const AddItemToCart = require('../../application/usecases/AddItemToCart');
const UpdateCartItem = require('../../application/usecases/UpdateCartItem');
const RemoveItemFromCart = require('../../application/usecases/RemoveItemFromCart');
const ClearCart = require('../../application/usecases/ClearCart');

// Services
const ProductService = require('../../application/services/ProductService');

// Repositories
const PostgresCartRepository = require('../repositories/PostgresCartRepository');
const DatabaseConnection = require('../database/connection');

const router = express.Router();

// Dependency Injection
const dbConnection = new DatabaseConnection();
const cartRepository = new PostgresCartRepository(dbConnection);
const productService = new ProductService();

const getCart = new GetCart(cartRepository);
const addItemToCart = new AddItemToCart(cartRepository, productService);
const updateCartItem = new UpdateCartItem(cartRepository, productService);
const removeItemFromCart = new RemoveItemFromCart(cartRepository);
const clearCart = new ClearCart(cartRepository);

const cartController = new CartController(
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart
);

// Middleware para todas las rutas (extrae info del usuario del API Gateway)
router.use(extractUserInfo);

// Rutas del carrito (todas requieren autenticación vía API Gateway)
router.get('/cart', (req, res, next) => cartController.getCartByUser(req, res, next));
router.post('/cart/items', (req, res, next) => cartController.addItem(req, res, next));
router.put('/cart/items/:itemId', (req, res, next) => cartController.updateItem(req, res, next));
router.delete('/cart/items/:itemId', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/cart', (req, res, next) => cartController.clearCart(req, res, next));

module.exports = router;
