const express = require('express');
const router = express.Router();
const EnrollmentController = require('../controllers/enrollment.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/enrollments', authMiddleware, EnrollmentController.getUserEnrollments);
router.get('/courses/:courseId/enrollment', authMiddleware, EnrollmentController.checkEnrollment);
router.delete('/enrollments/:enrollmentId', authMiddleware, EnrollmentController.deleteEnrollment);

module.exports = router;