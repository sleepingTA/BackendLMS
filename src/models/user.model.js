const db = require("../config/db");

const UserModel = {
  // Tạo người dùng mới
  create: async (email, password, full_name, role = "User", avatar = null) => {
    try {
      const sql = `INSERT INTO users (email, password, full_name, role, avatar) VALUES (?, ?, ?, ?, ?)`;
      const [result] = await db.execute(sql, [email, password, full_name, role, avatar]);
      return result;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  // Tìm người dùng theo email
  findByEmail: async (email) => {
    try {
      const sql = `SELECT * FROM users WHERE email = ?`;
      const [rows] = await db.execute(sql, [email]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  },

  // Tìm người dùng theo ID
  findById: async (id) => {
    try {
      const sql = `SELECT * FROM users WHERE id = ?`;
      const [rows] = await db.execute(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  },

  // Lấy tất cả người dùng
  getAll: async () => {
    try {
      const sql = `SELECT * FROM users`;
      const [rows] = await db.execute(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }
  },

update: async (id, updateData) => {
    try {
      const fields = [];
      const values = [];

      if (updateData.email !== undefined) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      if (updateData.password !== undefined) {
        fields.push('password = ?');
        values.push(updateData.password);
      }
      if (updateData.full_name !== undefined) {
        fields.push('full_name = ?');
        values.push(updateData.full_name);
      }
      if (updateData.role !== undefined) {
        fields.push('role = ?');
        values.push(updateData.role);
      }
      if (updateData.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(updateData.avatar);
      }

      if (fields.length === 0) {
        return false;
      }

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      const [result] = await db.execute(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Lỗi cập nhật người dùng: ${error.message}`);
    }
  },

  // Cập nhật từng trường riêng lẻ
  updateAvatar: async (id, avatar) => {
    try {
      const sql = `UPDATE users SET avatar = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [avatar, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating avatar: ${error.message}`);
    }
  },

  updateEmailVerified: async (id, email_verified) => {
    try {
      const sql = `UPDATE users SET email_verified = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [email_verified, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating email verification: ${error.message}`);
    }
  },

  setVerificationToken: async (id, verification_token) => {
    try {
      const sql = `UPDATE users SET verification_token = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [verification_token, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error setting verification token: ${error.message}`);
    }
  },

  setResetPasswordToken: async (id, reset_password_token, reset_password_expires) => {
    try {
      const sql = `UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [reset_password_token, reset_password_expires, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error setting reset password token: ${error.message}`);
    }
  },

  setRefreshToken: async (id, refresh_token) => {
    try {
      const sql = `UPDATE users SET refresh_token = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [refresh_token, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error setting refresh token: ${error.message}`);
    }
  },

  setActiveStatus: async (id, is_active) => {
    try {
      const sql = `UPDATE users SET is_active = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [is_active, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error setting active status: ${error.message}`);
    }
  },

  // Xóa người dùng
  delete: async (id) => {
    try {
      const sql = `DELETE FROM users WHERE id = ?`;
      const [result] = await db.execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  },
};

module.exports = UserModel;