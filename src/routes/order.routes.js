const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/', authMiddleware, OrderController.getUserOrders);
router.get('/:orderId', authMiddleware, OrderController.getOrderById);

router.post(
  '/',
  authMiddleware,
  OrderController.createOrder
);

router.put(
  '/:orderId',
  authMiddleware,
  roleMiddleware(['Admin']),
  OrderController.updateOrderStatus
);

router.delete(
  '/:orderId',
  authMiddleware,
  roleMiddleware(['Admin']),
  OrderController.deleteOrder
);

module.exports = router;