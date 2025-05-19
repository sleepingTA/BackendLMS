const EnrollmentModel = require("../models/enrollment.model");
const CourseModel = require("../models/course.model");

const EnrollmentController = {
  // Lấy danh sách khóa học đã đăng ký của người dùng
  getUserEnrollments: async (req, res) => {
      try {
        const { userId } = req.user;
        const enrollments = await EnrollmentModel.getEnrollmentsByUser(userId);
        return res.status(200).json({ data: enrollments });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    },

  // Kiểm tra trạng thái đăng ký
  checkEnrollment: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { userId } = req.user;
      const enrollment = await EnrollmentModel.checkEnrollment(userId, courseId);
      if (!enrollment) {
        return res.status(404).json({ message: "Chưa đăng ký khóa học này" });
      }
      return res.status(200).json(enrollment);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa đăng ký
  deleteEnrollment: async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const enrollment = await EnrollmentModel.findEnrollmentById(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ message: "Đăng ký không tồn tại" });
      }
      if (enrollment.user_id !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }
      const success = await EnrollmentModel.deleteEnrollment(enrollmentId);
      if (!success) {
        return res.status(400).json({ message: "Xóa thất bại" });
      }
      // Cập nhật số lượng học viên
      const course = await CourseModel.findCourseById(enrollment.course_id);
      if (course) {
        await CourseModel.updateTotalStudents(enrollment.course_id, course.total_students - 1);
      }
      return res.status(200).json({ message: "Xóa đăng ký thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = EnrollmentController;