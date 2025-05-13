const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/course/:courseId', authMiddleware, ReviewController.getReviewsByCourse);
router.get('/:reviewId', authMiddleware, ReviewController.getReviewById);
router.post('/:courseId', authMiddleware, ReviewController.createReview);
router.put('/:reviewId', authMiddleware, ReviewController.updateReview);
router.patch('/:reviewId/approve', authMiddleware, roleMiddleware(['Admin']), ReviewController.approveReview);
router.delete('/:reviewId', authMiddleware, ReviewController.deleteReview);

module.exports = router;