const db = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {
  // Tìm người dùng theo email
  findByEmail: async (email) => {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw new Error(`Lỗi khi tìm người dùng theo email: ${error.message}`);
    }
  },

  // Tìm người dùng theo ID
  findById: async (id) => {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error in findById:', error);
      throw new Error(`Lỗi khi tìm người dùng theo ID: ${error.message}`);
    }
  },

  // Lấy tất cả người dùng
  getAll: async () => {
    try {
      const [rows] = await db.execute('SELECT id, email, full_name, role, avatar, is_active, email_verified, created_at, updated_at FROM users');
      return rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw new Error(`Lỗi khi lấy danh sách người dùng: ${error.message}`);
    }
  },

  // Tạo người dùng mới
  create: async (email, password, full_name, role = 'User', avatar = null, verificationToken = null) => {
    try {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      const [result] = await db.execute(
        'INSERT INTO users (email, password, full_name, role, avatar, verification_token, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, full_name, role, avatar, verificationToken, false]
      );
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error in create:', error);
      throw new Error(`Lỗi khi tạo người dùng: ${error.message}`);
    }
  },

  // Cập nhật thông tin người dùng
  update: async (id, updateData) => {
    try {
      const fields = [];
      const values = [];
      if (updateData.email) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      if (updateData.password) {
        fields.push('password = ?');
        values.push(await bcrypt.hash(updateData.password, 10));
      }
      if (updateData.full_name) {
        fields.push('full_name = ?');
        values.push(updateData.full_name);
      }
      if (updateData.role) {
        fields.push('role = ?');
        values.push(updateData.role);
      }
      if (updateData.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(updateData.avatar);
      }
      if (updateData.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(updateData.is_active);
      }

      if (fields.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error(`Lỗi khi cập nhật người dùng: ${error.message}`);
    }
  },

  // Cập nhật avatar
  updateAvatar: async (id, avatarPath) => {
    try {
      const [result] = await db.execute(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [avatarPath, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in updateAvatar:', error);
      throw new Error(`Lỗi khi cập nhật avatar: ${error.message}`);
    }
  },

  // Xóa người dùng
  delete: async (id) => {
    try {
      const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw new Error(`Lỗi khi xóa người dùng: ${error.message}`);
    }
  },

  // Cập nhật refresh token
  setRefreshToken: async (id, token) => {
    try {
      const [result] = await db.execute(
        'UPDATE users SET refresh_token = ? WHERE id = ?',
        [token, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in setRefreshToken:', error);
      throw new Error(`Lỗi khi cập nhật refresh token: ${error.message}`);
    }
  },

  // Cập nhật verification token
  setVerificationToken: async (id, token) => {
    try {
      const [result] = await db.execute(
        'UPDATE users SET verification_token = ? WHERE id = ?',
        [token, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in setVerificationToken:', error);
      throw new Error(`Lỗi khi cập nhật verification token: ${error.message}`);
    }
  },

  // Cập nhật reset token
  setResetToken: async (id, token, expires) => {
    try {
      const [result] = await db.execute(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [token, expires, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in setResetToken:', error);
      throw new Error(`Lỗi khi cập nhật reset token: ${error.message}`);
    }
  },

  // Tìm người dùng theo reset token
  findByResetToken: async (token) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE reset_token = ?',
        [token]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in findByResetToken:', error);
      throw new Error(`Lỗi khi tìm người dùng theo reset token: ${error.message}`);
    }
  },

  // Cập nhật mật khẩu
  updatePassword: async (id, password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw new Error(`Lỗi khi cập nhật mật khẩu: ${error.message}`);
    }
  },
};

module.exports = UserModel;