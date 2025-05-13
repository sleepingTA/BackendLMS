
const LessonModel = require('../models/lesson.model');
const CourseModel = require('../models/course.model');

const CourseController = {
  getAllCourses: async (req, res) => {
    try {
      const courses = await CourseModel.getAllCourses();
      return res.status(200).json(courses);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Lấy khóa học theo ID
  getCourseById: async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await CourseModel.findCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      return res.status(200).json(course);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Lấy chi tiết khóa học kèm bài học và nội dung
  getCourseDetails: async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await CourseModel.getCourseWithLessonsAndContent(courseId);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      await CourseModel.incrementViews(courseId);
      return res.status(200).json(course);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Tạo khóa học mới
  createCourse: async (req, res) => {
    try {
      const { title, description, category_id, price, discount_percentage, thumbnail_url, is_active } = req.body;
      if (!title || !category_id || !price) {
        return res.status(400).json({ message: "Thiếu tiêu đề, danh mục hoặc giá" });
      }
      const courseData = {
        title,
        description,
        category_id,
        created_by: req.user.userId,
        price,
        discount_percentage: discount_percentage || 0,
        thumbnail_url,
        is_active: is_active !== undefined ? is_active : true,
      };
      const result = await CourseModel.createCourse(courseData);
      return res.status(201).json({ message: "Tạo khóa học thành công", courseId: result.insertId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật khóa học
  updateCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, category_id, price, discount_percentage, thumbnail_url, is_active } = req.body;
      const course = await CourseModel.findCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const courseData = {
        title,
        description,
        category_id,
        price,
        discount_percentage: discount_percentage || 0,
        thumbnail_url,
        is_active: is_active !== undefined ? is_active : true,
      };
      const success = await CourseModel.updateCourse(courseId, courseData);
      if (!success) {
        return res.status(400).json({ message: "Cập nhật thất bại" });
      }
      return res.status(200).json({ message: "Cập nhật khóa học thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa khóa học
  deleteCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await CourseModel.findCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      if (course.created_by !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }
      const success = await CourseModel.deleteCourseById(courseId);
      if (!success) {
        return res.status(400).json({ message: "Xóa thất bại" });
      }
      return res.status(200).json({ message: "Xóa khóa học thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getCourseWithLessonsAndContent: async (req, res) => {
    try {
      const { id } = req.params;
      const course = await CourseModel.getCourseWithLessonsAndContent(id);
      if (!course) {
        return res.status(404).json({ success: false, message: `Khóa học với ID ${id} không tồn tại` });
      }
      return res.status(200).json({ success: true, data: course });
    } catch (error) {
      console.error('Error in getCourseWithLessonsAndContent:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin khóa học và nội dung' });
    }
  },
};

module.exports = CourseController;