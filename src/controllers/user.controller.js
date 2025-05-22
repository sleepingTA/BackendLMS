const UserModel = require('../models/user.model');
const avatarUpload = require('../middleware/avatarUpload');
const fs = require('fs').promises;
const path = require('path');

const UserController = {
  // Lấy tất cả người dùng (chỉ Admin)
  getAllUsers: async (req, res) => {
    try {
      console.log('Get all users request');
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }
      const users = await UserModel.getAll();
      return res.status(200).json(users);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return res.status(500).json({ message: `Lỗi khi lấy danh sách người dùng: ${error.message}` });
    }
  },

  // Lấy thông tin người dùng theo ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Get user by ID:', id);
      if (req.user.userId !== parseInt(id) && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }
      return res.status(200).json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      });
    } catch (error) {
      console.error('Error in getUserById:', error);
      return res.status(500).json({ message: `Lỗi khi lấy thông tin người dùng: ${error.message}` });
    }
  },

  // Tạo người dùng mới (chỉ Admin)
  createUser: async (req, res) => {
    try {
      const { email, password, full_name, role, avatar } = req.body;
      console.log('Create user request:', { email, full_name, role });
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Không có quyền tạo người dùng' });
      }
      if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'Thiếu email, mật khẩu hoặc họ tên' });
      }
      if (!['User', 'Instructor', 'Admin'].includes(role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }

      const result = await UserModel.create(email, password, full_name, role, avatar);
      return res.status(201).json({ message: 'Tạo người dùng thành công', userId: result.insertId });
    } catch (error) {
      console.error('Error in createUser:', error);
      return res.status(500).json({ message: `Tạo người dùng thất bại: ${error.message}` });
    }
  },

  // Cập nhật thông tin người dùng
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, full_name, role, is_active } = req.body;
      console.log('Update user request:', { id, email, full_name, role, is_active });
      if (req.user.userId !== parseInt(id) && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Không có quyền cập nhật' });
      }

      const updateData = {};
      if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ message: 'Email không hợp lệ' });
        }
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(400).json({ message: 'Email đã được sử dụng' });
        }
        updateData.email = email;
      }
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }
        updateData.password = password;
      }
      if (full_name) {
        if (!full_name.trim()) {
          return res.status(400).json({ message: 'Họ tên không được để trống' });
        }
        updateData.full_name = full_name;
      }
      if (role && req.user.role === 'Admin') {
        if (!['User', 'Instructor', 'Admin'].includes(role)) {
          return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }
        updateData.role = role;
      }
      if (typeof is_active === 'boolean' && req.user.role === 'Admin') {
        updateData.is_active = is_active;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
      }

      const success = await UserModel.update(id, updateData);
      if (!success) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }
      return res.status(200).json({ message: 'Cập nhật người dùng thành công' });
    } catch (error) {
      console.error('Error in updateUser:', error);
      return res.status(500).json({ message: `Cập nhật người dùng thất bại: ${error.message}` });
    }
  },

  // Cập nhật avatar
  updateAvatar: async (req, res) => {
    try {
      avatarUpload(req, res, async (err) => {
        if (err) {
          console.error('Error in avatarUpload:', err);
          return res.status(400).json({ message: err.message });
        }

        const { id } = req.params;
        console.log('Update avatar request for user:', id);
        if (req.user.userId !== parseInt(id)) {
          return res.status(403).json({ message: 'Không có quyền cập nhật avatar' });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'Vui lòng cung cấp file ảnh avatar' });
        }

        const avatarPath = `uploads/avatars/${req.file.filename}`;
        const oldUser = await UserModel.findById(id);

        const success = await UserModel.updateAvatar(id, avatarPath);
        if (!success) {
          return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Xóa avatar cũ nếu tồn tại
        if (oldUser.avatar) {
          try {
            await fs.unlink(path.join(__dirname, '..', oldUser.avatar));
          } catch (err) {
            console.warn('Không thể xóa avatar cũ:', err.message);
          }
        }

        return res.status(200).json({
          message: 'Cập nhật avatar thành công',
          avatar: avatarPath,
        });
      });
    } catch (error) {
      console.error('Error in updateAvatar:', error);
      return res.status(500).json({ message: `Cập nhật avatar thất bại: ${error.message}` });
    }
  },

  // Xóa người dùng (chỉ Admin)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Delete user request:', id);
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Không có quyền xóa' });
      }
      if (req.user.userId === parseInt(id)) {
        return res.status(400).json({ message: 'Không thể xóa chính mình' });
      }

      const success = await UserModel.delete(id);
      if (!success) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }
      return res.status(200).json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return res.status(500).json({ message: `Xóa người dùng thất bại: ${error.message}` });
    }
  },
};

module.exports = UserController;