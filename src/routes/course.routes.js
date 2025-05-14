const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/course.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const upload = require('../config/multer');
const handleMulterError = require('../middleware/multerErrorHandler');

router.get('/', CourseController.getAllCourses);
router.get('/:id', CourseController.getCourseById);
router.get('/:id/details', authMiddleware, CourseController.getCourseWithLessonsAndContent);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('thumbnail'),
  handleMulterError,
  CourseController.createCourse
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('thumbnail'),
  handleMulterError,
  CourseController.updateCourse
);
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), CourseController.deleteCourse);

module.exports = router;