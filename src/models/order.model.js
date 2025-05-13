const db = require("../config/db");

const OrderModel = {
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    try {
      const {
        user_id,
        course_id,
        status = "pending",
        payment_method = "Bank Transfer",
        payment_status = "Pending",
        total_amount,
        discount_amount = 0,
      } = orderData;
      const query = `
        INSERT INTO orders (user_id, course_id, status, payment_method, payment_status, total_amount, discount_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [
        user_id,
        course_id,
        status,
        payment_method,
        payment_status,
        total_amount,
        discount_amount,
      ]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  },

  // Lấy đơn hàng theo ID
  findOrderById: async (orderId) => {
    try {
      const query = `SELECT * FROM orders WHERE id = ?`;
      const [rows] = await db.query(query, [orderId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding order by ID: ${error.message}`);
    }
  },

  // Lấy đơn hàng theo người dùng
  getOrdersByUser: async (userId) => {
    try {
      const query = `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`;
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching orders by user: ${error.message}`);
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, status) => {
    try {
      const query = `UPDATE orders SET status = ? WHERE id = ?`;
      const [result] = await db.query(query, [status, orderId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (orderId, payment_status) => {
    try {
      const query = `UPDATE orders SET payment_status = ? WHERE id = ?`;
      const [result] = await db.query(query, [payment_status, orderId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  },

  // Cập nhật đơn hàng (toàn bộ)
  updateOrder: async (orderId, orderData) => {
    try {
      const {
        user_id,
        course_id,
        status,
        payment_method,
        payment_status,
        total_amount,
        discount_amount,
      } = orderData;
      const query = `
        UPDATE orders 
        SET user_id = ?, course_id = ?, status = ?, payment_method = ?, payment_status = ?, total_amount = ?, discount_amount = ?
        WHERE id = ?
      `;
      const [result] = await db.query(query, [
        user_id,
        course_id,
        status,
        payment_method,
        payment_status,
        total_amount,
        discount_amount,
        orderId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating order: ${error.message}`);
    }
  },

  // Xóa đơn hàng
  deleteOrder: async (orderId) => {
    try {
      const query = `DELETE FROM orders WHERE id = ?`;
      const [result] = await db.query(query, [orderId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting order: ${error.message}`);
    }
  },
};

module.exports = OrderModel;