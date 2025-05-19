const db = require("../config/db");

const EnrollmentModel = {

  // Lấy danh sách khóa học đã đăng ký của người dùng
  getEnrollmentsByUser: async (userId) => {
    try {
      const query = `
        SELECT e.id, e.user_id, e.course_id, e.enrolled_at, c.title, c.thumbnail_url, c.price, c.discounted_price
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ? AND c.is_active = TRUE
      `;
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching enrollments: ${error.message}`);
    }
  },

  // Kiểm tra trạng thái đăng ký
  checkEnrollment: async (userId, courseId) => {
    try {
      const query = `
        SELECT * FROM enrollments
        WHERE user_id = ? AND course_id = ? AND EXISTS (
          SELECT 1 FROM courses WHERE id = ? AND is_active = TRUE
        )
      `;
      const [rows] = await db.query(query, [userId, courseId, courseId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error checking enrollment: ${error.message}`);
    }
  },

  // Tìm đăng ký theo ID
  findEnrollmentById: async (enrollmentId) => {
    try {
      const query = `
        SELECT * FROM enrollments
        WHERE id = ? AND EXISTS (
          SELECT 1 FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.id = ? AND c.is_active = TRUE
        )
      `;
      const [rows] = await db.query(query, [enrollmentId, enrollmentId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding enrollment: ${error.message}`);
    }
  },

  // Xóa đăng ký
  deleteEnrollment: async (enrollmentId) => {
    try {
      const query = `DELETE FROM enrollments WHERE id = ?`;
      const [result] = await db.query(query, [enrollmentId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting enrollment: ${error.message}`);
    }
  },
};

module.exports = EnrollmentModel;