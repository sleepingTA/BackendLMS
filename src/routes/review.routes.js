const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/courses/:courseId/reviews', authMiddleware, ReviewController.getReviewsByCourse);
router.get('/reviews/:reviewId', authMiddleware, ReviewController.getReviewById);
router.post('/courses/:courseId/reviews', authMiddleware, ReviewController.createReview);
router.put('/reviews/:reviewId', authMiddleware, ReviewController.updateReview);
router.patch('/reviews/:reviewId/approve', authMiddleware, roleMiddleware(['Admin']), ReviewController.approveReview);
router.delete('/reviews/:reviewId', authMiddleware, ReviewController.deleteReview);

module.exports = router;