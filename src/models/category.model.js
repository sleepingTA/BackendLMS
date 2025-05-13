const db = require("../config/db");

const CategoryModel = {
  // Lấy tất cả danh mục
  getAllCategory: async () => {
    try {
      const sql = `SELECT * FROM categories`;
      const [rows] = await db.execute(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all categories: ${error.message}`);
    }
  },

  // Tạo danh mục mới
  createCategory: async (name, description = null) => {
    try {
      const sql = `INSERT INTO categories (name, description) VALUES (?, ?)`;
      const [result] = await db.execute(sql, [name, description]);
      return result;
    } catch (error) {
      throw new Error(`Error creating category: ${error.message}`);
    }
  },

  // Cập nhật danh mục
  updateCategory: async (id, name, description = null) => {
    try {
      const sql = `UPDATE categories SET name = ?, description = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [name, description, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }
  },

  // Xóa danh mục
  deleteById: async (id) => {
    try {
      const sql = `DELETE FROM categories WHERE id = ?`;
      const [result] = await db.execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  },

  // Tìm danh mục theo tên
  findCategoryByName: async (name) => {
    try {
      const sql = `SELECT * FROM categories WHERE name = ?`;
      const [rows] = await db.execute(sql, [name]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding category by name: ${error.message}`);
    }
  },

  // Tìm danh mục theo ID
  findCategoryById: async (id) => {
    try {
      const sql = `SELECT * FROM categories WHERE id = ?`;
      const [rows] = await db.execute(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding category by ID: ${error.message}`);
    }
  },
};

module.exports = CategoryModel;