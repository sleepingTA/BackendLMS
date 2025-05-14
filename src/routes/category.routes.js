const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);
router.post('/', authMiddleware, roleMiddleware(['Admin']), CategoryController.createCategory);
router.put('/:id', authMiddleware, roleMiddleware(['Admin']), CategoryController.updateCategory);
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), CategoryController.deleteCategory);

module.exports = router;