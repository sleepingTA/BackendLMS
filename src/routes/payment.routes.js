const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.post('/', authMiddleware, PaymentController.createPayment);
router.get('/:paymentId', authMiddleware, PaymentController.getPaymentById);

router.put('/:paymentId/status', authMiddleware, roleMiddleware(['Admin']), PaymentController.updatePaymentStatus);
router.post('/confirm', PaymentController.confirmPayment);
router.delete('/:paymentId', authMiddleware, PaymentController.cancelPayment);

module.exports = router;