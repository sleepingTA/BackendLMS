const db = require("../config/db");

const LessonModel = {
  // Tạo bài học mới
  createLesson: async (lessonData) => {
    try {
      const { course_id, title, description, order_number } = lessonData;
      const [result] = await db.query(
        `INSERT INTO lessons (course_id, title, description, order_number) VALUES (?, ?, ?, ?)`,
        [course_id, title, description, order_number]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating lesson: ${error.message}`);
    }
  },

  // Lấy bài học theo khóa học
  getLessonsByCourseId: async (courseId) => {
    try {
      const [lessons] = await db.query(
        `
        SELECT l.*, 
            (SELECT COUNT(*) FROM videos WHERE lesson_id = l.id) as video_count,
            (SELECT COUNT(*) FROM materials WHERE lesson_id = l.id) as material_count
        FROM lessons l 
        WHERE l.course_id = ? 
        ORDER BY l.order_number
        `,
        [courseId]
      );
      return lessons;
    } catch (error) {
      throw new Error(`Error fetching lessons by course ID: ${error.message}`);
    }
  },

  // Lấy bài học kèm nội dung
  getLessonWithContent: async (lessonId) => {
    try {
      const [lessons] = await db.query(
        `
        SELECT l.*, c.title as course_title 
        FROM lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE l.id = ?
        `,
        [lessonId]
      );
      if (lessons.length === 0) return null;
      const lesson = lessons[0];

      const [videos] = await db.query(
        `
        SELECT * FROM videos 
        WHERE lesson_id = ? 
        ORDER BY order_number
        `,
        [lessonId]
      );

      const [materials] = await db.query(
        `
        SELECT * FROM materials 
        WHERE lesson_id = ?
        ORDER BY created_at
        `,
        [lessonId]
      );

      return {
        ...lesson,
        videos,
        materials,
      };
    } catch (error) {
      throw new Error(`Error fetching lesson with content: ${error.message}`);
    }
  },

  // Cập nhật bài học
  updateLesson: async (lessonId, lessonData) => {
    try {
      const { title, description, order_number } = lessonData;
      const [result] = await db.query(
        `UPDATE lessons SET title = ?, description = ?, order_number = ? WHERE id = ?`,
        [title, description, order_number, lessonId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating lesson: ${error.message}`);
    }
  },

  // Xóa bài học
  deleteLesson: async (lessonId) => {
    try {
      await db.query(`DELETE FROM videos WHERE lesson_id = ?`, [lessonId]);
      await db.query(`DELETE FROM materials WHERE lesson_id = ?`, [lessonId]);
      const [result] = await db.query(`DELETE FROM lessons WHERE id = ?`, [lessonId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting lesson: ${error.message}`);
    }
  },

  // Thêm video
  addVideo: async (videoData) => {
    try {
      const { lesson_id, title, description, video_url, order_number, duration, is_preview } = videoData;
      const [result] = await db.query(
        `INSERT INTO videos (lesson_id, title, description, video_url, order_number, duration, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [lesson_id, title, description, video_url, order_number, duration, is_preview]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error adding video: ${error.message}`);
    }
  },

  // Cập nhật video
  updateVideo: async (videoId, videoData) => {
    try {
      const { title, description, video_url, order_number, duration, is_preview } = videoData;
      const [result] = await db.query(
        `UPDATE videos SET title = ?, description = ?, video_url = ?, order_number = ?, duration = ?, is_preview = ? WHERE id = ?`,
        [title, description, video_url, order_number, duration, is_preview, videoId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating video: ${error.message}`);
    }
  },

  // Thêm tài liệu
  addMaterial: async (materialData) => {
    try {
      const { lesson_id, title, file_url, file_type } = materialData;
      const [result] = await db.query(
        `INSERT INTO materials (lesson_id, title, file_url, file_type) VALUES (?, ?, ?, ?)`,
        [lesson_id, title, file_url, file_type]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error adding material: ${error.message}`);
    }
  },

  // Cập nhật tài liệu
  updateMaterial: async (materialId, materialData) => {
    try {
      const { title, file_url, file_type } = materialData;
      const [result] = await db.query(
        `UPDATE materials SET title = ?, file_url = ?, file_type = ? WHERE id = ?`,
        [title, file_url, file_type, materialId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating material: ${error.message}`);
    }
  },

  // Xóa video
  deleteVideo: async (videoId) => {
    try {
      const [result] = await db.query(`DELETE FROM videos WHERE id = ?`, [videoId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting video: ${error.message}`);
    }
  },

  // Xóa tài liệu
  deleteMaterial: async (materialId) => {
    try {
      const [result] = await db.query(`DELETE FROM materials WHERE id = ?`, [materialId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting material: ${error.message}`);
    }
  },
};

module.exports = LessonModel;