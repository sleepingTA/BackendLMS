const db = require("../config/db");

const PaymentModel = {
  // Tạo thanh toán mới
  createPayment: async (paymentData) => {
    try {
      const {
        order_id,
        payment_method,
        amount,
        status = "Pending",
        transaction_id = null,
        payment_date = null,
      } = paymentData;
      const query = `
        INSERT INTO payments (order_id, payment_method, amount, status, transaction_id, payment_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [
        order_id,
        payment_method,
        amount,
        status,
        transaction_id,
        payment_date,
      ]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating payment: ${error.message}`);
    }
  },

  // Lấy thanh toán theo ID
  findPaymentById: async (paymentId) => {
    try {
      const query = `SELECT * FROM payments WHERE id = ?`;
      const [rows] = await db.query(query, [paymentId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding payment by ID: ${error.message}`);
    }
  },

  // Lấy thanh toán theo đơn hàng
  findPaymentByOrderId: async (orderId) => {
    try {
      const query = `SELECT * FROM payments WHERE order_id = ?`;
      const [rows] = await db.query(query, [orderId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding payment by order ID: ${error.message}`);
    }
  },

  // Lấy thanh toán theo mã giao dịch
  findPaymentByTransactionId: async (transactionId) => {
    try {
      const query = `SELECT * FROM payments WHERE transaction_id = ?`;
      const [rows] = await db.query(query, [transactionId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding payment by transaction ID: ${error.message}`);
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (paymentId, status) => {
    try {
      const query = `UPDATE payments SET status = ? WHERE id = ?`;
      const [result] = await db.query(query, [status, paymentId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  },

  // Cập nhật thanh toán (toàn bộ)
  updatePayment: async (paymentId, paymentData) => {
    try {
      const { payment_method, amount, status, transaction_id, payment_date } = paymentData;
      const query = `
        UPDATE payments 
        SET payment_method = ?, amount = ?, status = ?, transaction_id = ?, payment_date = ?
        WHERE id = ?
      `;
      const [result] = await db.query(query, [
        payment_method,
        amount,
        status,
        transaction_id,
        payment_date,
        paymentId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating payment: ${error.message}`);
    }
  },

  // Xóa thanh toán
  deletePayment: async (paymentId) => {
    try {
      const query = `DELETE FROM payments WHERE id = ?`;
      const [result] = await db.query(query, [paymentId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting payment: ${error.message}`);
    }
  },
};

module.exports = PaymentModel;