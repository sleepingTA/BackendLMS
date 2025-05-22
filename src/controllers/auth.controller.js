const AuthModel = require('../models/auth.model');

const AuthController = {
  register: async (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      console.log('Register request:', { email, full_name });
      if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'Thiếu email, mật khẩu hoặc họ tên' });
      }

      const userId = await AuthModel.register(email, password, full_name);
      return res.status(201).json({
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh.',
        userId,
      });
    } catch (error) {
      console.error('Error in register:', error);
      return res.status(500).json({ message: `Đăng ký thất bại: ${error.message}` });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      console.log('Verify email request with token:', token);
      const success = await AuthModel.verifyEmail(token);
      if (success) {
        return res.status(200).json({ message: 'Xác minh email thành công' });
      }
      return res.status(400).json({ message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      return res.status(500).json({ message: `Xác minh email thất bại: ${error.message}` });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login request:', { email });
      if (!email || !password) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
      }

      const { accessToken, refreshToken, user } = await AuthModel.login(email, password);
      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        },
      });
    } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).json({ message: `Đăng nhập thất bại: ${error.message}` });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { idToken } = req.body;
      console.log('Google login request:', { idToken });
      if (!idToken) {
        return res.status(400).json({ message: 'Thiếu idToken' });
      }

      const { accessToken, refreshToken, user } = await AuthModel.googleLogin(idToken);
      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        },
      });
    } catch (error) {
      console.error('Error in googleLogin:', error);
      return res.status(500).json({ message: `Đăng nhập Google thất bại: ${error.message}` });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      console.log('Refresh token request');
      if (!refreshToken) {
        return res.status(400).json({ message: 'Thiếu refresh token' });
      }

      const { accessToken } = await AuthModel.refreshToken(refreshToken);
      return res.status(200).json({ success: true, data: { accessToken } });
    } catch (error) {
      console.error('Error in refreshToken:', error);
      return res.status(401).json({ message: `Làm mới token thất bại: ${error.message}` });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Forgot password request for email:', email);
      if (!email) {
        return res.status(400).json({ message: 'Thiếu email' });
      }

      await AuthModel.forgotPassword(email);
      return res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi' });
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      return res.status(500).json({ message: `Gửi email đặt lại mật khẩu thất bại: ${error.message}` });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      console.log('Reset password request with token:', token);
      if (!newPassword) {
        return res.status(400).json({ message: 'Thiếu mật khẩu mới' });
      }

      const success = await AuthModel.resetPassword(token, newPassword);
      if (success) {
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
      }
      return res.status(400).json({ message: 'Đặt lại mật khẩu thất bại' });
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return res.status(500).json({ message: `Đặt lại mật khẩu thất bại: ${error.message}` });
    }
  },

  logout: async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log('Logout request for user:', userId);
      await AuthModel.logout(userId);
      return res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      console.error('Error in logout:', error);
      return res.status(500).json({ message: `Đăng xuất thất bại: ${error.message}` });
    }
  },

  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Resend verification request for email:', email);
      if (!email) {
        return res.status(400).json({ message: 'Thiếu email' });
      }

      await AuthModel.resendVerificationEmail(email);
      return res.status(200).json({ message: 'Email xác minh đã được gửi lại' });
    } catch (error) {
      console.error('Error in resendVerification:', error);
      return res.status(500).json({ message: `Gửi lại email xác minh thất bại: ${error.message}` });
    }
  },
};

module.exports = AuthController;