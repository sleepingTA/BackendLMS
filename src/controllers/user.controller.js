const UserModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserController = {
  // Lấy tất cả người dùng (chỉ Admin)
  getAllUsers: async (req, res) => {
    try {
      const users = await UserModel.getAll();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Lấy thông tin người dùng theo ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Đăng ký người dùng
  createUser: async (req, res) => {
    try {
      const { email, password, full_name, role, avatar } = req.body;
      if (!email || !password || !full_name) {
        return res.status(400).json({ message: "Thiếu email, mật khẩu hoặc họ tên" });
      }
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await UserModel.create(email, hashedPassword, full_name, role || "User", avatar);
      return res.status(201).json({ message: "Đăng ký thành công", userId: result.insertId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Đăng nhập
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
      }
      const user = await UserModel.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      }
      if (!user.is_active) {
        return res.status(403).json({ message: "Tài khoản đã bị khóa" });
      }
      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
      await UserModel.setRefreshToken(user.id, token);
      return res.status(200).json({ message: "Đăng nhập thành công", token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật thông tin người dùng
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, full_name, role, avatar } = req.body;
      if (req.user.userId !== parseInt(id) && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      const success = await UserModel.update(id, email, hashedPassword || undefined, full_name, role || "User", avatar);
      if (!success) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      return res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật avatar
  updateAvatar: async (req, res) => {
    try {
      const { id } = req.params;
      const { avatar } = req.body;
      if (req.user.userId !== parseInt(id)) {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const success = await UserModel.updateAvatar(id, avatar);
      if (!success) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      return res.status(200).json({ message: "Cập nhật avatar thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xác minh email
  verifyEmail: async (req, res) => {
    try {
      const { id, verification_token } = req.body;
      const user = await UserModel.findById(id);
      if (!user || user.verification_token !== verification_token) {
        return res.status(400).json({ message: "Mã xác minh không hợp lệ" });
      }
      const success = await UserModel.updateEmailVerified(id, true);
      if (success) {
        await UserModel.setVerificationToken(id, null);
        return res.status(200).json({ message: "Xác minh email thành công" });
      }
      return res.status(400).json({ message: "Xác minh thất bại" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa người dùng (chỉ Admin)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }
      const success = await UserModel.delete(id);
      if (!success) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      return res.status(200).json({ message: "Xóa người dùng thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = UserController;