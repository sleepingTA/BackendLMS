const db = require("../config/db");

const ReviewModel = {
  // Tạo đánh giá mới
  createReview: async (reviewData) => {
    try {
      const { user_id, course_id, rating, comment, is_approved = 0 } = reviewData;
      const query = `
        INSERT INTO reviews (user_id, course_id, rating, comment, is_approved)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [user_id, course_id, rating, comment, is_approved]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  },

  // Lấy đánh giá theo khóa học
  getReviewsByCourse: async (courseId) => {
    try {
      const query = `
        SELECT r.*, u.full_name 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.course_id = ? 
        ORDER BY r.created_at DESC
      `;
      const [rows] = await db.query(query, [courseId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching reviews by course: ${error.message}`);
    }
  },

  // Lấy đánh giá theo ID
  findReviewById: async (reviewId) => {
    try {
      const query = `SELECT * FROM reviews WHERE id = ?`;
      const [rows] = await db.query(query, [reviewId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding review by ID: ${error.message}`);
    }
  },

  // Cập nhật trạng thái phê duyệt
  updateReviewApproval: async (reviewId, is_approved) => {
    try {
      const query = `UPDATE reviews SET is_approved = ? WHERE id = ?`;
      const [result] = await db.query(query, [is_approved, reviewId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating review approval: ${error.message}`);
    }
  },

  // Cập nhật đánh giá
  updateReview: async (reviewId, reviewData) => {
    try {
      const { rating, comment, is_approved } = reviewData;
      const query = `
        UPDATE reviews 
        SET rating = ?, comment = ?, is_approved = ?
        WHERE id = ?
      `;
      const [result] = await db.query(query, [rating, comment, is_approved, reviewId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating review: ${error.message}`);
    }
  },

  // Xóa đánh giá
  deleteReview: async (reviewId) => {
    try {
      const query = `DELETE FROM reviews WHERE id = ?`;
      const [result] = await db.query(query, [reviewId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting review: ${error.message}`);
    }
  },
};

module.exports = ReviewModel;