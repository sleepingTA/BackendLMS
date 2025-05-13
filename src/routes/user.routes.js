const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.post('/', authMiddleware, roleMiddleware(['Admin']), UserController.createUser);
router.get('/', authMiddleware, roleMiddleware(['Admin']), UserController.getAllUsers);
router.get('/:id', authMiddleware, UserController.getUserById);
router.put('/:id', authMiddleware, UserController.updateUser);
router.patch('/:id/avatar', authMiddleware, UserController.updateAvatar);
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), UserController.deleteUser);
router.post('/login', UserController.login);
router.post('/verify-email', UserController.verifyEmail);

module.exports = router;