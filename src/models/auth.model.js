const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const EmailService = require('../services/email.service');
const admin = require('../config/firebase');

const AuthModel = {
  // Đăng ký người dùng mới
  register: async (email, password, full_name, role = 'User') => {
    try {
      console.log('Registering user:', { email, full_name, role });
      if (!email || !password || !full_name) {
        throw new Error('Thiếu email, mật khẩu hoặc họ tên');
      }

      // Kiểm tra email đã tồn tại
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        throw new Error('Email đã tồn tại');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

      const [result] = await db.execute(
        'INSERT INTO users (email, password, full_name, role, verification_token, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, full_name, role, verificationToken, false]
      );

      await EmailService.sendVerificationEmail(email, verificationToken);
      return result.insertId;
    } catch (error) {
      console.error('Error in register:', error);
      throw new Error(`Lỗi khi đăng ký: ${error.message}`);
    }
  },

  // Xác minh email
  verifyEmail: async (token) => {
    try {
      console.log('Verifying token:', token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);

      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [decoded.email]);
      if (rows.length === 0) {
        throw new Error('Email không tồn tại');
      }
      const user = rows[0];
      if (user.email_verified) {
        throw new Error('Email đã được xác minh');
      }
      if (user.verification_token !== token) {
        throw new Error('Token xác minh không khớp');
      }

      const [result] = await db.execute(
        'UPDATE users SET email_verified = true, verification_token = NULL WHERE email = ? AND verification_token = ?',
        [decoded.email, token]
      );
      console.log('Update result:', result);

      if (result.affectedRows === 0) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn');
      }
      return true;
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      throw new Error(`Lỗi khi xác thực email: ${error.message}`);
    }
  },

  // Đăng nhập
  login: async (email, password) => {
    try {
      console.log('Login attempt for email:', email);
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }
      const user = rows[0];

      if (!user.email_verified) {
        throw new Error('Vui lòng xác thực email trước khi đăng nhập');
      }
      if (!user.is_active) {
        throw new Error('Tài khoản đã bị khóa');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await db.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

      return { accessToken, refreshToken, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } };
    } catch (error) {
      console.error('Error in login:', error);
      throw new Error(`Lỗi khi đăng nhập: ${error.message}`);
    }
  },

  // Làm mới token
  refreshToken: async (refreshToken) => {
    try {
      console.log('Refreshing token');
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ? AND refresh_token = ?',
        [decoded.userId, refreshToken]
      );

      if (!rows.length) {
        throw new Error('Refresh token không hợp lệ');
      }

      const user = rows[0];
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw new Error(`Lỗi khi làm mới token: ${error.message}`);
    }
  },

  // Quên mật khẩu
  forgotPassword: async (email) => {
    try {
      console.log('Forgot password request for email:', email);
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) {
        throw new Error('Email không tồn tại');
      }

      const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      await db.execute(
        'UPDATE users SET reset_token = ? WHERE email = ?',
        [resetToken, email]
      );

      await EmailService.sendResetPasswordEmail(email, resetToken);
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      throw new Error(`Lỗi khi gửi yêu cầu đặt lại mật khẩu: ${error.message}`);
    }
  },

  // Đặt lại mật khẩu
  resetPassword: async (token, newPassword) => {
    try {
      console.log('Resetting password with token:', token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [result] = await db.execute(
        'UPDATE users SET password = ?, reset_token = NULL WHERE email = ? AND reset_token = ?',
        [hashedPassword, decoded.email, token]
      );

      if (result.affectedRows === 0) {
        throw new Error('Token không hợp lệ hoặc đã được sử dụng');
      }
      return true;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      throw new Error(`Lỗi khi đặt lại mật khẩu: ${error.message}`);
    }
  },

  // Đăng nhập Google
  googleLogin: async (idToken) => {
    try {
      console.log('Google login with idToken:', idToken);
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const email = decodedToken.email;
      const full_name = decodedToken.name || 'Google User';

      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      let user;

      if (rows.length === 0) {
        const [result] = await db.execute(
          'INSERT INTO users (email, full_name, role, email_verified, is_active) VALUES (?, ?, ?, ?, ?)',
          [email, full_name, 'User', true, 1]
        );
        user = { id: result.insertId, email, full_name, role: 'User' };
      } else {
        user = rows[0];
        if (!user.is_active) {
          throw new Error('Tài khoản đã bị khóa');
        }
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await db.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

      return { accessToken, refreshToken, user };
    } catch (error) {
      console.error('Error in googleLogin:', error);
      throw new Error(`Xác thực Google thất bại: ${error.message}`);
    }
  },

  // Đăng xuất
  logout: async (userId) => {
    try {
      console.log('Logging out user:', userId);
      await db.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Error in logout:', error);
      throw new Error(`Lỗi khi đăng xuất: ${error.message}`);
    }
  },

  // Gửi lại email xác minh
  resendVerificationEmail: async (email) => {
    try {
      console.log('Resending verification email to:', email);
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) {
        throw new Error('Email không tồn tại');
      }
      const user = rows[0];

      if (user.email_verified) {
        throw new Error('Email đã được xác minh');
      }

      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      await db.execute(
        'UPDATE users SET verification_token = ? WHERE email = ?',
        [verificationToken, email]
      );

      await EmailService.sendVerificationEmail(email, verificationToken);
      return true;
    } catch (error) {
      console.error('Error in resendVerificationEmail:', error);
      throw new Error(`Lỗi khi gửi lại email xác thực: ${error.message}`);
    }
  },
};

module.exports = AuthModel;