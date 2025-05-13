const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/course.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const upload = require('../config/multer');
const handleMulterError = require('../middleware/multerErrorHandler');

router.get('/', CourseController.getAllCourses);
router.get('/:courseId', CourseController.getCourseById);
router.get('/:courseId/with-lessons-and-content', authMiddleware, CourseController.getCourseWithLessonsAndContent);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('thumbnail'),
  handleMulterError,
  CourseController.createCourse
);

router.put(
  '/:courseId',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('thumbnail'),
  handleMulterError,
  CourseController.updateCourse
);

router.delete('/:courseId', authMiddleware, roleMiddleware(['Admin']), CourseController.deleteCourse);

module.exports = router;