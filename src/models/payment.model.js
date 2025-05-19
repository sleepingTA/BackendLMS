const db = require("../config/db");

const PaymentModel = {
  getPaymentsByUserId: async (userId) => {
    const query = `
      SELECT id, cart_id, payment_method, amount, status, transaction_id, payment_date, payos_order_code, payos_checkout_url
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  },

  findPaymentById: async (paymentId) => {
    const query = `
      SELECT id, user_id, cart_id, payment_method, amount, status, transaction_id, payment_date, payos_order_code, payos_checkout_url
      FROM payments
      WHERE id = ?
    `;
    const [rows] = await db.query(query, [paymentId]);
    return rows[0];
  },

  findPaymentByOrderCode: async (orderCode) => {
    const query = `
      SELECT id, user_id, cart_id, payment_method, amount, status, transaction_id, payment_date, payos_order_code, payos_checkout_url
      FROM payments
      WHERE payos_order_code = ?
    `;
    const [rows] = await db.query(query, [orderCode]);
    return rows[0];
  },

  createPayment: async (paymentData) => {
    const query = `
      INSERT INTO payments (user_id, cart_id, payment_method, amount, status, payos_order_code, payos_checkout_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      paymentData.user_id,
      paymentData.cart_id,
      paymentData.payment_method,
      paymentData.amount,
      paymentData.status,
      paymentData.payos_order_code,
      paymentData.payos_checkout_url,
    ];
    const [result] = await db.query(query, values);
    return result.insertId;
  },

  updatePayment: async (paymentId, paymentData) => {
    const query = `
      UPDATE payments
      SET user_id = ?, cart_id = ?, payment_method = ?, amount = ?, status = ?, 
          transaction_id = ?, payment_date = ?, payos_order_code = ?, payos_checkout_url = ?
      WHERE id = ?
    `;
    const values = [
      paymentData.user_id,
      paymentData.cart_id,
      paymentData.payment_method,
      paymentData.amount,
      paymentData.status,
      paymentData.transaction_id,
      paymentData.payment_date,
      paymentData.payos_order_code,
      paymentData.payos_checkout_url,
      paymentId,
    ];
    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },
};

module.exports = PaymentModel;