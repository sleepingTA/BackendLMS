const CategoryController = require('../controllers/category.controller');
const express = require('express');
const router = express.Router();

router.get('/', CategoryController.getAllCategories);
router.post('/categories/create', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);
router.get('/:id', CategoryController.getCategoryById);

module.exports = router;