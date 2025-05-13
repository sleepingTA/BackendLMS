const db = require("../config/db");

const PaymentModel = {
  // Tạo thanh toán mới
  createPayment: async (paymentData) => {
    try {
      const {
        user_id,
        cart_id,
        payment_method,
        amount,
        status = "Pending",
        transaction_id = null,
        payment_date = null,
      } = paymentData;
      const query = `
        INSERT INTO payments (user_id, cart_id, payment_method, amount, status, transaction_id, payment_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [
        user_id,
        cart_id,
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

  // Lấy thanh toán theo cart_id
  findPaymentByCartId: async (cartId) => {
    try {
      const query = `SELECT * FROM payments WHERE cart_id = ?`;
      const [rows] = await db.query(query, [cartId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding payment by cart ID: ${error.message}`);
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
      const { user_id, cart_id, payment_method, amount, status, transaction_id, payment_date } = paymentData;
      const query = `
        UPDATE payments 
        SET user_id = ?, cart_id = ?, payment_method = ?, amount = ?, status = ?, transaction_id = ?, payment_date = ?
        WHERE id = ?
      `;
      const [result] = await db.query(query, [
        user_id,
        cart_id,
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