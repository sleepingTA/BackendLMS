const db = require("../config/db");

const CourseModel = {
  // Lấy tất cả khóa học
  getAllCourses: async () => {
    try {
      const query = `SELECT * FROM courses`;
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all courses: ${error.message}`);
    }
  },

  // Tìm khóa học theo ID
  findCourseById: async (courseId) => {
    try {
      const query = `SELECT * FROM courses WHERE id = ?`;
      const [rows] = await db.query(query, [courseId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding course by ID: ${error.message}`);
    }
  },

  // Tạo khóa học mới
  createCourse: async (courseData) => {
    try {
      const query = `
        INSERT INTO courses (title, description, category_id, created_by, price, discount_percentage, thumbnail_url, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [
        courseData.title,
        courseData.description,
        courseData.category_id,
        courseData.created_by,
        courseData.price,
        courseData.discount_percentage || 0,
        courseData.thumbnail_url || null,
        courseData.is_active !== undefined ? courseData.is_active : 1,
      ]);
      return result;
    } catch (error) {
      throw new Error(`Error creating course: ${error.message}`);
    }
  },

  // Cập nhật khóa học (toàn bộ)
  updateCourse: async (courseId, courseData) => {
    try {
      const query = `
        UPDATE courses 
        SET title = ?, description = ?, category_id = ?, price = ?, discount_percentage = ?, thumbnail_url = ?, is_active = ?
        WHERE id = ?
      `;
      const [result] = await db.query(query, [
        courseData.title,
        courseData.description,
        courseData.category_id,
        courseData.price,
        courseData.discount_percentage || 0,
        courseData.thumbnail_url || null,
        courseData.is_active !== undefined ? courseData.is_active : 1,
        courseId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating course: ${error.message}`);
    }
  },

  // Tăng lượt xem
  incrementViews: async (courseId) => {
    try {
      const query = `UPDATE courses SET views = views + 1 WHERE id = ?`;
      const [result] = await db.query(query, [courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error incrementing views: ${error.message}`);
    }
  },

  // Cập nhật số học viên
  updateTotalStudents: async (courseId, total_students) => {
    try {
      const query = `UPDATE courses SET total_students = ? WHERE id = ?`;
      const [result] = await db.query(query, [total_students, courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating total students: ${error.message}`);
    }
  },

  // Cập nhật đánh giá
  updateRating: async (courseId, rating, total_ratings) => {
    try {
      const query = `UPDATE courses SET rating = ?, total_ratings = ? WHERE id = ?`;
      const [result] = await db.query(query, [rating, total_ratings, courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating rating: ${error.message}`);
    }
  },

  // Cập nhật trạng thái hoạt động
  setActiveStatus: async (courseId, is_active) => {
    try {
      const query = `UPDATE courses SET is_active = ? WHERE id = ?`;
      const [result] = await db.query(query, [is_active, courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error setting active status: ${error.message}`);
    }
  },

  // Xóa khóa học
  deleteCourseById: async (courseId) => {
    try {
      const query = `DELETE FROM courses WHERE id = ?`;
      const [result] = await db.query(query, [courseId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting course: ${error.message}`);
    }
  },

  // Lấy khóa học kèm bài học và nội dung
  getCourseWithLessonsAndContent: async (courseId) => {
    try {
      const query = `
        SELECT 
            c.id AS course_id,
            c.title AS course_title,
            c.description AS course_description,
            c.category_id,
            c.price,
            c.discount_percentage,
            c.discounted_price,
            c.thumbnail_url,
            c.views,
            c.total_students,
            c.rating,
            c.total_ratings,
            c.is_active,
            l.id AS lesson_id,
            l.title AS lesson_title,
            l.description AS lesson_description,
            l.order_number,
            v.id AS video_id,
            v.title AS video_title,
            v.video_url,
            v.duration,
            m.id AS material_id,
            m.title AS material_title,
            m.file_url,
            m.file_type
        FROM 
            courses c
        LEFT JOIN 
            lessons l ON c.id = l.course_id
        LEFT JOIN 
            course_videos v ON l.id = v.lesson_id
        LEFT JOIN 
            course_materials m ON l.id = m.lesson_id
        WHERE 
            c.id = ?
        ORDER BY 
            l.order_number, v.order_number;
      `;
      const [rows] = await db.query(query, [courseId]);

      const courseMap = new Map();
      rows.forEach((row) => {
        if (!courseMap.has(row.course_id)) {
          courseMap.set(row.course_id, {
            id: row.course_id,
            title: row.course_title,
            description: row.course_description,
            category_id: row.category_id,
            price: row.price,
            discount_percentage: row.discount_percentage,
            discounted_price: row.discounted_price,
            thumbnail_url: row.thumbnail_url,
            views: row.views,
            total_students: row.total_students,
            rating: row.rating,
            total_ratings: row.total_ratings,
            is_active: row.is_active,
            lessons: [],
          });
        }
        const course = courseMap.get(row.course_id);
        let lesson = course.lessons.find((l) => l.id === row.lesson_id);
        if (!lesson) {
          lesson = {
            id: row.lesson_id,
            title: row.lesson_title,
            description: row.lesson_description,
            order_number: row.order_number,
            videos: [],
            materials: [],
          };
          course.lessons.push(lesson);
        }
        if (row.video_id) {
          lesson.videos.push({
            id: row.video_id,
            title: row.video_title,
            video_url: row.video_url,
            duration: row.duration,
            is_preview: row.is_preview,
          });
        }
        if (row.material_id) {
          lesson.materials.push({
            id: row.material_id,
            title: row.material_title,
            file_url: row.file_url,
            file_type: row.file_type,
          });
        }
      });
      return Array.from(courseMap.values())[0] || null;
    } catch (error) {
      throw new Error(`Error fetching course with lessons and content: ${error.message}`);
    }
  },
};

module.exports = CourseModel;