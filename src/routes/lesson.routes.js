const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/lesson.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const upload = require('../config/multer');
const handleMulterError = require('../middleware/multerErrorHandler');

router.get('/course/:courseId', authMiddleware, LessonController.getLessonsByCourse);
router.get('/:lessonId', authMiddleware, LessonController.getLessonDetails);
router.post(
  '/:courseId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.createLesson
);
router.put(
  '/:lessonId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.updateLesson
);
router.delete(
  '/:lessonId',
  authMiddleware,
  roleMiddleware(['Admin']),
  LessonController.deleteLesson
);

router.post(
  '/:lessonId/videos',
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

router.post(
  '/:lessonId/materials',
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