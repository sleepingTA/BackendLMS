const PaymentModel = require("../models/payment.model");
const CartModel = require("../models/cart.model");
const CourseModel = require("../models/course.model");
const EnrollmentModel = require("../models/enrollment.model");
const payOS = require("../config/payos"); // Import payOS từ file config

const PaymentController = {
    getPayments: async (req, res) => {
        try {
            const payments = await PaymentModel.getPaymentsByUserId(req.user.userId);
            if (!payments) {
                return res.status(404).json({ message: "Không tìm thấy thanh toán nào" });
            }
            return res.status(200).json(payments);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    getPaymentById: async (req, res) => {
        try {
            const { paymentId } = req.params;
            const payment = await PaymentModel.findPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: "Thanh toán không tồn tại" });
            }
            if (payment.user_id !== req.user.userId && req.user.role !== "Admin") {
                return res.status(403).json({ message: "Không có quyền truy cập" });
            }
            return res.status(200).json(payment);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    createPayOSPayment: async (req, res) => {
        try {
            const { payment_method } = req.body;
            if (payment_method !== "Bank Transfer") {
                return res.status(400).json({ message: "PayOS chỉ hỗ trợ Bank Transfer" });
            }

            const cart = await CartModel.findCartByUserId(req.user.userId);
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }

            const cartItems = await CartModel.getCartItems(cart.id);
            if (cartItems.length === 0) {
                return res.status(400).json({ message: "Giỏ hàng trống" });
            }

            for (const item of cartItems) {
                const enrollment = await EnrollmentModel.checkEnrollment(req.user.userId, item.course_id);
                if (enrollment) {
                    return res.status(400).json({ message: `Bạn đã mua khóa học "${item.course_title}"` });
                }
            }

            const totalAmount = cartItems.reduce((sum, item) => {
                const price = Number(item.discounted_price) || Number(item.price) || 0;
                return sum + price;
            }, 0);
            const roundedAmount = Number(totalAmount.toFixed(2));
            const amountInVND = Math.round(roundedAmount);

            if (amountInVND <= 0) {
                return res.status(400).json({ message: "Số tiền phải là số nguyên lớn hơn 0" });
            }

            console.log("Rounded total amount (VND):", roundedAmount);
            console.log("Amount in VND (integer):", amountInVND);

            const paymentId = Date.now();
            const paymentData = {
                user_id: req.user.userId,
                cart_id: cart.id,
                payment_method: "Bank Transfer",
                amount: roundedAmount,
                status: "Pending",
                payos_order_code: paymentId.toString(),
            };
            const createdPaymentId = await PaymentModel.createPayment(paymentData);

            const body = {
                orderCode: paymentId,
                amount: amountInVND,
                description: `Thanh toán cho giỏ hàng #${cart.id}`,
                items: cartItems.map((item) => ({
                    name: item.course_title,
                    quantity: 1,
                    price: Math.round(Number(item.discounted_price) || Number(item.price) || 0),
                })),
                cancelUrl: `${process.env.CLIENT_URL}/payment/cancel`,
                returnUrl: `${process.env.CLIENT_URL}/payment/success`,
            };

            const paymentLinkRes = await payOS.createPaymentLink(body);

            await PaymentModel.updatePayment(createdPaymentId, {
                ...paymentData,
                payos_checkout_url: paymentLinkRes.checkoutUrl,
            });

            return res.status(201).json({
                message: "Tạo thanh toán thành công",
                paymentId: createdPaymentId,
                paymentLink: paymentLinkRes.checkoutUrl,
            });
        } catch (error) {
            console.error("Create PayOS Payment error:", error.message);
            return res.status(500).json({ message: error.message });
        }
    },

handlePayOSWebhook: async (req, res) => {
    try {
        console.log("Webhook endpoint hit for /api/payments/payos/webhook");
        console.log("Headers:", JSON.stringify(req.headers, null, 2));
        console.log("Raw body:", JSON.stringify(req.body, null, 2));

        const webhookData = req.body;
        if (!webhookData || !webhookData.data) {
            console.error("Invalid webhook data:", webhookData);
            return res.status(400).json({ message: "Dữ liệu webhook không hợp lệ" });
        }

        // Xác minh webhook
        const verifiedData = await payOS.verifyPaymentWebhookData(webhookData);
        if (!verifiedData) {
            console.error("Webhook verification failed:", webhookData);
            return res.status(400).json({ message: "Xác minh webhook thất bại" });
        }

        const { orderCode, amount, description, reference, transactionDateTime, paymentLinkId, code, desc } = webhookData.data;
        if (!orderCode || !code || !desc) {
            console.error("Missing required fields in webhook data:", webhookData.data);
            return res.status(400).json({ message: "Dữ liệu webhook thiếu thông tin" });
        }

        console.log("Finding payment for orderCode:", orderCode);
        const payment = await PaymentModel.findPaymentByOrderCode(orderCode);
        if (!payment) {
            console.error("Payment not found for orderCode:", orderCode);
            return res.status(404).json({ message: "Thanh toán không tồn tại" });
        }

        let newStatus = payment.status;
        if (code === "00" && (desc === "Thành công" || desc.toLowerCase() === "success")) {
            newStatus = "Success";
        } else if (code !== "00" || desc.toLowerCase().includes("cancelled")) {
            newStatus = "Failed";
        }

        const paymentData = {
            user_id: payment.user_id,
            cart_id: payment.cart_id,
            payment_method: payment.payment_method,
            amount: payment.amount,
            status: newStatus,
            transaction_id: reference || payment.transaction_id,
            payment_date: transactionDateTime
                ? new Date(transactionDateTime).toISOString().slice(0, 19).replace("T", " ")
                : payment.payment_date,
            payos_order_code: payment.payos_order_code,
            payos_checkout_url: payment.payos_checkout_url,
        };

        console.log("Updating payment with data:", paymentData);
        const success = await PaymentModel.updatePayment(payment.id, paymentData);
        if (!success) {
            console.error("Failed to update payment status for orderCode:", orderCode);
            return res.status(400).json({ message: "Cập nhật trạng thái thất bại" });
        }

        console.log("Webhook processed successfully for orderCode:", orderCode);
        return res.status(200).json({ message: "Webhook xử lý thành công" });
    } catch (error) {
        console.error("Webhook error:", error.stack);
        return res.status(503).json({ message: "Lỗi nội bộ, vui lòng thử lại" });
    }
},

    confirmWebhook: async (req, res) => {
        try {
            const { webhookUrl } = req.body;
            if (!webhookUrl) {
                return res.status(400).json({ message: "Thiếu webhook URL" });
            }
            if (!payOS) {
                console.error("payOS module is not initialized");
                return res.status(500).json({ message: "Lỗi server: payOS không được khởi tạo" });
            }
            const response = await payOS.confirmWebhook(webhookUrl);
            console.log("PayOS webhook confirmed successfully:", response);
            return res.status(200).json({ message: "Xác nhận webhook thành công", response });
        } catch (error) {
            console.error("Failed to confirm PayOS webhook:", error.message);
            return res.status(500).json({ message: "Lỗi khi xác nhận webhook", error: error.message });
        }
    },

    cancelPayment: async (req, res) => {
        try {
            const { paymentId } = req.params;
            const payment = await PaymentModel.findPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: "Thanh toán không tồn tại" });
            }
            if (payment.user_id !== req.user.userId && req.user.role !== "Admin") {
                return res.status(403).json({ message: "Không có quyền hủy thanh toán" });
            }

            await payOS.cancelPaymentLink(payment.payos_order_code, "Hủy bởi người dùng");

            const paymentData = {
                user_id: payment.user_id,
                cart_id: payment.cart_id,
                payment_method: payment.payment_method,
                amount: payment.amount,
                status: "Failed",
                transaction_id: payment.transaction_id,
                payment_date: payment.payment_date,
                payos_order_code: payment.payos_order_code,
                payos_checkout_url: payment.payos_checkout_url,
            };
            const success = await PaymentModel.updatePayment(paymentId, paymentData);
            if (!success) {
                return res.status(400).json({ message: "Hủy thanh toán thất bại" });
            }

            return res.status(200).json({ message: "Hủy thanh toán thành công" });
        } catch (error) {
            console.error("Cancel Payment error:", error.message);
            return res.status(500).json({ message: error.message });
        }
    },

    createPayment: async (req, res) => {
        try {
            const { payment_method } = req.body;
            if (!payment_method) {
                return res.status(400).json({ message: "Thiếu phương thức thanh toán" });
            }
            const cart = await CartModel.findCartByUserId(req.user.userId);
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }
            const cartItems = await CartModel.getCartItems(cart.id);
            if (cartItems.length === 0) {
                return res.status(400).json({ message: "Giỏ hàng trống" });
            }
            for (const item of cartItems) {
                const enrollment = await EnrollmentModel.checkEnrollment(req.user.userId, item.course_id);
                if (enrollment) {
                    return res.status(400).json({ message: `Bạn đã mua khóa học "${item.course_title}"` });
                }
            }
            const totalAmount = cartItems.reduce((sum, item) => sum + (item.discounted_price || item.price), 0);
            const paymentData = {
                user_id: req.user.userId,
                cart_id: cart.id,
                payment_method,
                amount: totalAmount,
                status: "Pending",
            };
            const paymentId = await PaymentModel.createPayment(paymentData);
            return res.status(201).json({ message: "Tạo thanh toán thành công", paymentId });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    updatePaymentStatus: async (req, res) => {
        try {
            const { paymentId } = req.params;
            const { status, transaction_id, payment_date } = req.body;
            if (!["Pending", "Success", "Failed"].includes(status)) {
                return res.status(400).json({ message: "Trạng thái không hợp lệ" });
            }
            const payment = await PaymentModel.findPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: "Thanh toán không tồn tại" });
            }
            if (payment.user_id !== req.user.userId && req.user.role !== "Admin") {
                return res.status(403).json({ message: "Không có quyền cập nhật" });
            }
            const paymentData = {
                user_id: payment.user_id,
                cart_id: payment.cart_id,
                payment_method: payment.payment_method,
                amount: payment.amount,
                status,
                transaction_id: transaction_id || payment.transaction_id,
                payment_date: payment_date || payment.payment_date,
            };
            const success = await PaymentModel.updatePayment(paymentId, paymentData);
            if (!success) {
                return res.status(400).json({ message: "Cập nhật thất bại" });
            }
            return res.status(200).json({ message: "Cập nhật thanh toán thành công" });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    testSignature: async (req, res) => {
        try {
            const crypto = require('crypto');
            const data = req.body;
            const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
            const sortedData = {
                amount: data.amount,
                code: data.code,
                desc: data.desc,
                description: data.description,
                orderCode: data.orderCode,
                paymentLinkId: data.paymentLinkId,
                reference: data.reference,
                transactionDateTime: data.transactionDateTime,
            };
            const sortedString = Object.keys(sortedData)
                .sort()
                .map((key) => `${key}=${sortedData[key]}`)
                .join('&');
            const signature = crypto
                .createHmac('sha256', checksumKey)
                .update(sortedString)
                .digest('hex');
            console.log("Generated signature:", signature);
            return res.status(200).json({ signature });
        } catch (error) {
            console.error("Test signature error:", error.message);
            return res.status(500).json({ message: error.message });
        }
    },

    confirmPayment: async (req, res) => {
        try {
            const { paymentId, transaction_id, status } = req.body;
            if (!["Success", "Failed"].includes(status)) {
                return res.status(400).json({ message: "Trạng thái không hợp lệ" });
            }
            const payment = await PaymentModel.findPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: "Thanh toán không tồn tại" });
            }
            const paymentData = {
                user_id: payment.user_id,
                cart_id: payment.cart_id,
                payment_method: payment.payment_method,
                amount: payment.amount,
                status,
                transaction_id,
                payment_date: new Date().toISOString().slice(0, 19).replace("T", " "),
            };
            const success = await PaymentModel.updatePayment(paymentId, paymentData);
            if (!success) {
                return res.status(400).json({ message: "Xác nhận thanh toán thất bại" });
            }
            return res.status(200).json({ message: "Xác nhận thanh toán thành công" });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    
};

module.exports = PaymentController;