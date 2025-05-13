const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/', authMiddleware, CartController.getCart);
router.post('/', authMiddleware, CartController.addToCart);
router.post('/remove', authMiddleware, CartController.removeFromCart);
router.delete('/', authMiddleware, CartController.clearCart);

module.exports = router;