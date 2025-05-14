const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/lesson.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const upload = require('../config/multer');
const handleMulterError = require('../middleware/multerErrorHandler');

// Bài học
router.get('/courses/:courseId/lessons', authMiddleware, LessonController.getLessonsByCourse);
router.get('/lessons/:lessonId', authMiddleware, LessonController.getLessonDetails);
router.post(
  '/courses/:courseId/lessons',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.createLesson
);
router.put(
  '/lessons/:lessonId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.updateLesson
);
router.delete(
  '/lessons/:lessonId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.deleteLesson
);

// Video
router.post(
  '/lessons/:lessonId/videos',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('video'),
  handleMulterError,
  LessonController.addVideo
);
router.put(
  '/videos/:videoId',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('video'),
  handleMulterError,
  LessonController.updateVideo
);
router.delete(
  '/videos/:videoId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.deleteVideo
);

// Tài liệu
router.post(
  '/lessons/:lessonId/materials',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('material'),
  handleMulterError,
  LessonController.addMaterial
);
router.put(
  '/materials/:materialId',
  authMiddleware,
  roleMiddleware(['Admin']),
  upload.single('material'),
  handleMulterError,
  LessonController.updateMaterial
);
router.delete(
  '/materials/:materialId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.deleteMaterial
);

module.exports = router;