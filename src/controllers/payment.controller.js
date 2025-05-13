const PaymentModel = require("../models/payment.model");
const CartModel = require("../models/cart.model");
const CourseModel = require("../models/course.model");
const EnrollmentModel = require("../models/enrollment.model");

const PaymentController = {
  // Lấy danh sách thanh toán của người dùng
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
  // Lấy thông tin thanh toán theo ID
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

  // Tạo thanh toán mới cho giỏ hàng
  createPayment: async (req, res) => {
    try {
      const { payment_method } = req.body;
      if (!payment_method) {
        return res.status(400).json({ message: "Thiếu phương thức thanh toán" });
      }
      // Lấy giỏ hàng của người dùng
      const cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
      }
      // Lấy các khóa học trong giỏ hàng
      const cartItems = await CartModel.getCartItems(cart.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng trống" });
      }
      // Kiểm tra xem người dùng đã mua bất kỳ khóa học nào trong giỏ hàng chưa
      for (const item of cartItems) {
        const enrollment = await EnrollmentModel.checkEnrollment(req.user.userId, item.course_id);
        if (enrollment) {
          return res.status(400).json({ message: `Bạn đã mua khóa học "${item.course_title}"` });
        }
      }
      // Tính tổng số tiền
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.discounted_price || item.price), 0);
      // Tạo bản ghi thanh toán
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

  // Cập nhật trạng thái thanh toán
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
      // Trigger enroll_user_after_payment sẽ xử lý khi status = Success
      return res.status(200).json({ message: "Cập nhật thanh toán thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xác nhận thanh toán
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
      // Trigger enroll_user_after_payment sẽ xử lý khi status = Success
      return res.status(200).json({ message: "Xác nhận thanh toán thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Hủy thanh toán
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
      const paymentData = {
        user_id: payment.user_id,
        cart_id: payment.cart_id,
        payment_method: payment.payment_method,
        amount: payment.amount,
        status: "Failed",
        transaction_id: payment.transaction_id,
        payment_date: payment.payment_date,
      };
      const success = await PaymentModel.updatePayment(paymentId, paymentData);
      if (!success) {
        return res.status(400).json({ message: "Hủy thanh toán thất bại" });
      }
      return res.status(200).json({ message: "Hủy thanh toán thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PaymentController;