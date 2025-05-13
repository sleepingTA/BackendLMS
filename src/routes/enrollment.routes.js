const express = require('express');
const router = express.Router();
const EnrollmentController = require('../controllers/enrollment.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

router.get('/', authMiddleware, EnrollmentController.getUserEnrollments);
router.get('/:courseId', authMiddleware, EnrollmentController.checkEnrollment);
router.delete('/:enrollmentId', authMiddleware, EnrollmentController.deleteEnrollment);

module.exports = router;