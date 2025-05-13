const CategoryModel = require("../models/category.model");

const CategoryController = {
  // Lấy tất cả danh mục
  getAllCategories: async (req, res) => {
    try {
      const categories = await CategoryModel.getAllCategory();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Lấy danh mục theo ID
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await CategoryModel.findCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }
      return res.status(200).json(category);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Tạo danh mục mới
  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Thiếu tên danh mục" });
      }
      const result = await CategoryModel.createCategory(name, description);
      return res.status(201).json({ message: "Tạo danh mục thành công", categoryId: result.insertId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật danh mục
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Thiếu tên danh mục" });
      }
      const success = await CategoryModel.updateCategory(id, name, description);
      if (!success) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }
      return res.status(200).json({ message: "Cập nhật danh mục thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa danh mục
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const success = await CategoryModel.deleteById(id);
      if (!success) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }
      return res.status(200).json({ message: "Xóa danh mục thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = CategoryController;