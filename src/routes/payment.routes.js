const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/payments', authMiddleware, PaymentController.getPayments);
router.get('/payments/:paymentId', authMiddleware, PaymentController.getPaymentById);
router.post('/payments', authMiddleware, PaymentController.createPayment);
router.patch('/payments/:paymentId/status', authMiddleware, roleMiddleware(['Admin']), PaymentController.updatePaymentStatus);
router.post('/payments/confirm', PaymentController.confirmPayment);
router.delete('/payments/:paymentId', authMiddleware, PaymentController.cancelPayment);

module.exports = router;