const AuthModel = require('../models/auth.model');

const AuthController = {
  register: async (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
      }
      const userId = await AuthModel.register(email, password, full_name);
      res.status(201).json({
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
        userId,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      await AuthModel.verifyEmail(token);
      res.json({ message: 'Xác thực email thành công' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
      }
      const { accessToken, refreshToken, user } = await AuthModel.login(email, password);
      res.json({ accessToken, refreshToken, user });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Thiếu refresh token' });
      }
      const { accessToken } = await AuthModel.refreshToken(refreshToken);
      res.json({ accessToken });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Thiếu email' });
      }
      await AuthModel.forgotPassword(email);
      res.json({ message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ message: 'Thiếu mật khẩu mới' });
      }
      await AuthModel.resetPassword(token, newPassword);
      res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      await AuthModel.logout(req.user.userId);
      res.json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = AuthController;