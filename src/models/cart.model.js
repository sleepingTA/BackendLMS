const db = require("../config/db");

const CartModel = {
  // Tìm giỏ hàng theo user_id
  findCartByUserId: async (userId) => {
    try {
      console.log('Finding cart for userId:', userId); // Log để debug
      const query = `SELECT * FROM cart WHERE user_id = ?`;
      const [rows] = await db.query(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding cart by user ID: ${error.message}`);
    }
  },

  // Tạo giỏ hàng mới
  createCart: async (userId) => {
    try {
      const query = `INSERT INTO cart (user_id) VALUES (?)`;
      const [result] = await db.query(query, [userId]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating cart: ${error.message}`);
    }
  },

  // Lấy các mục trong giỏ hàng
  getCartItems: async (cartId) => {
    try {
      const query = `
        SELECT ci.*, c.title AS course_title, c.price, c.discounted_price
        FROM cart_items ci
        JOIN courses c ON ci.course_id = c.id
        WHERE ci.cart_id = ?
      `;
      const [rows] = await db.query(query, [cartId]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting cart items: ${error.message}`);
    }
  },

  // Thêm khóa học vào giỏ hàng
  addItemToCart: async (cartId, courseId) => {
    try {
      const query = `INSERT INTO cart_items (cart_id, course_id) VALUES (?, ?)`;
      const [result] = await db.query(query, [cartId, courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return false; // Khóa học đã có trong giỏ hàng
      }
      throw new Error(`Error adding item to cart: ${error.message}`);
    }
  },

  // Xóa khóa học khỏi giỏ hàng
  removeItemFromCart: async (cartId, courseId) => {
    try {
      console.log('Checking removal for cartId:', cartId, 'courseId:', courseId); // Log để debug
      const checkQuery = `SELECT * FROM cart_items WHERE cart_id = ? AND course_id = ?`;
      const [existingItems] = await db.query(checkQuery, [cartId, courseId]);
      if (!existingItems.length) {
        console.log('No item found in cart_items for cartId:', cartId, 'courseId:', courseId);
        throw new Error('Khóa học không có trong giỏ hàng');
      }

      const query = `DELETE FROM cart_items WHERE cart_id = ? AND course_id = ?`;
      const [result] = await db.query(query, [cartId, courseId]);
      console.log(`Removed item with cart_id ${cartId} and course_id ${courseId}, affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error removing item from cart: ${error.message}`);
    }
  },

  // Làm trống giỏ hàng
  clearCart: async (cartId) => {
    try {
      const query = `DELETE FROM cart_items WHERE cart_id = ?`;
      const [result] = await db.query(query, [cartId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }
  },
};

module.exports = CartModel;