const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/payment.controller");
const { authMiddleware, roleMiddleware } = require("../middleware/auth.middleware");

router.get("/", authMiddleware, PaymentController.getPayments);
router.get('/:paymentId', authMiddleware, PaymentController.getPaymentById);
router.post("/", authMiddleware, PaymentController.createPayment);
router.post("/payos", authMiddleware, PaymentController.createPayOSPayment);
router.post('/payos/webhook', PaymentController.handlePayOSWebhook);
router.post('/payos/confirm-webhook', PaymentController.confirmWebhook); 
router.patch("/:paymentId/status", authMiddleware, roleMiddleware(["Admin"]), PaymentController.updatePaymentStatus);
router.post("/confirm", authMiddleware, PaymentController.confirmPayment);
router.delete("/:paymentId", authMiddleware, PaymentController.cancelPayment);
router.post('/payos/test-signature', PaymentController.testSignature);


module.exports = router;