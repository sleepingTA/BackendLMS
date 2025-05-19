const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/cart', authMiddleware, CartController.getCart);
router.post('/cart/items', authMiddleware, CartController.addToCart);
router.delete('/cart/items/:courseId', authMiddleware, CartController.removeFromCart); 
router.delete('/cart', authMiddleware, CartController.clearCart);

module.exports = router;