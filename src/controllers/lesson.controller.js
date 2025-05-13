const LessonModel = require("../models/lesson.model");
const CourseModel = require("../models/course.model");

const LessonController = {
  // Lấy bài học theo khóa học
  getLessonsByCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await CourseModel.findCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      const lessons = await LessonModel.getLessonsByCourseId(courseId);
      return res.status(200).json(lessons);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Lấy bài học kèm nội dung
  getLessonDetails: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const lesson = await LessonModel.getLessonWithContent(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Bài học không tồn tại" });
      }
      return res.status(200).json(lesson);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Tạo bài học mới
  createLesson: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, order_number } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Thiếu tiêu đề bài học" });
      }
      const course = await CourseModel.findCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền tạo bài học" });
      }
      const lessonData = { course_id: courseId, title, description, order_number: order_number || 0 };
      const lessonId = await LessonModel.createLesson(lessonData);
      return res.status(201).json({ message: "Tạo bài học thành công", lessonId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật bài học
  updateLesson: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { title, description, order_number } = req.body;
      const lesson = await LessonModel.getLessonWithContent(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Bài học không tồn tại" });
      }
      const course = await CourseModel.findCourseById(lesson.course_id);
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const lessonData = { title, description, order_number: order_number || 0 };
      const success = await LessonModel.updateLesson(lessonId, lessonData);
      if (!success) {
        return res.status(400).json({ message: "Cập nhật thất bại" });
      }
      return res.status(200).json({ message: "Cập nhật bài học thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa bài học
  deleteLesson: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const lesson = await LessonModel.getLessonWithContent(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Bài học không tồn tại" });
      }
      const course = await CourseModel.findCourseById(lesson.course_id);
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }
      const success = await LessonModel.deleteLesson(lessonId);
      if (!success) {
        return res.status(400).json({ message: "Xóa thất bại" });
      }
      return res.status(200).json({ message: "Xóa bài học thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Thêm video
  addVideo: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { title, description, video_url, order_number, duration, is_preview } = req.body;
      if (!title || !video_url) {
        return res.status(400).json({ message: "Thiếu tiêu đề hoặc URL video" });
      }
      const lesson = await LessonModel.getLessonWithContent(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Bài học không tồn tại" });
      }
      const course = await CourseModel.findCourseById(lesson.course_id);
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền thêm video" });
      }
      const videoData = { lesson_id: lessonId, title, description, video_url, order_number: order_number || 0, duration, is_preview: is_preview || false };
      const videoId = await LessonModel.addVideo(videoData);
      return res.status(201).json({ message: "Thêm video thành công", videoId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật video
  updateVideo: async (req, res) => {
    try {
      const { videoId } = req.params;
      const { title, description, video_url, order_number, duration, is_preview } = req.body;
      const video = await LessonModel.getLessonWithContent(req.body.lesson_id);
      if (!video) {
        return res.status(404).json({ message: "Video không tồn tại" });
      }
      const course = await CourseModel.findCourseById(video.course_id);
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const videoData = { title, description, video_url, order_number: order_number || 0, duration, is_preview: is_preview || false };
      const success = await LessonModel.updateVideo(videoId, videoData);
      if (!success) {
        return res.status(400).json({ message: "Cập nhật thất bại" });
      }
      return res.status(200).json({ message: "Cập nhật video thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Thêm tài liệu
  addMaterial: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { title, file_url, file_type } = req.body;
      if (!title || !file_url) {
        return res.status(400).json({ message: "Thiếu tiêu đề hoặc URL tài liệu" });
      }
      const lesson = await LessonModel.getLessonWithContent(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Bài học không tồn tại" });
      }
      const course = await CourseModel.findCourseById(lesson.course_id);
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền thêm tài liệu" });
      }
      const materialData = { lesson_id: lessonId, title, file_url, file_type };
      const materialId = await LessonModel.addMaterial(materialData);
      return res.status(201).json({ message: "Thêm tài liệu thành công", materialId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật tài liệu
  updateMaterial: async (req, res) => {
    try {
      const { materialId } = req.params;
      const { title, file_url, file_type } = req.body;
      const material = await LessonModel.getLessonWithContent(req.body.lesson_id);
      if (!material) {
        return res.status(404).json({ message: "Tài liệu không tồn tại" });
      }
      const course = await CourseModel.findCourseById(material.course_id);
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const materialData = { title, file_url, file_type };
      const success = await LessonModel.updateMaterial(materialId, materialData);
      if (!success) {
        return res.status(400).json({ message: "Cập nhật thất bại" });
      }
      return res.status(200).json({ message: "Cập nhật tài liệu thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa video
  deleteVideo: async (req, res) => {
    try {
      const { videoId } = req.params;
      const success = await LessonModel.deleteVideo(videoId);
      if (!success) {
        return res.status(404).json({ message: "Video không tồn tại" });
      }
      return res.status(200).json({ message: "Xóa video thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa tài liệu
  deleteMaterial: async (req, res) => {
    try {
      const { materialId } = req.params;
      const success = await LessonModel.deleteMaterial(materialId);
      if (!success) {
        return res.status(404).json({ message: "Tài liệu không tồn tại" });
      }
      return res.status(200).json({ message: "Xóa tài liệu thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = LessonController;