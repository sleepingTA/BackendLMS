const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const AuthController = {
  register: async (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'Thiếu email, mật khẩu hoặc họ tên' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const result = await UserModel.create(email, hashedPassword, full_name, 'User', null, verificationToken);

      const verificationUrl = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác minh email của bạn',
        html: `Vui lòng nhấp vào liên kết này để xác minh email: <a href="${verificationUrl}">${verificationUrl}</a>`,
      });

      return res.status(201).json({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh.', userId: result.insertId });
    } catch (error) {
      return res.status(500).json({ message: 'Đăng ký thất bại: ' + error.message });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      const user = await UserModel.findByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: 'Mã xác minh không hợp lệ hoặc đã hết hạn' });
      }

      const success = await UserModel.updateEmailVerified(user.id, true);
      if (success) {
        await UserModel.setVerificationToken(user.id, null);
        return res.status(200).json({ message: 'Xác minh email thành công' });
      }
      return res.status(400).json({ message: 'Xác minh thất bại' });
    } catch (error) {
      return res.status(500).json({ message: 'Xác minh email thất bại: ' + error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      }

      if (!user.is_active) {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }

      if (!user.email_verified) {
        return res.status(403).json({ message: 'Vui lòng xác minh email trước khi đăng nhập' });
      }

      const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await UserModel.setRefreshToken(user.id, refreshToken);

      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Đăng nhập thất bại: ' + error.message });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { idToken } = req.body;
      console.log('Received idToken:', idToken); // Log idToken
      if (!idToken) {
        return res.status(400).json({ message: 'Thiếu idToken' });
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken); // Dòng 89
      console.log('Decoded token:', decodedToken); // Log decoded token
      const { email, name } = decodedToken;

      let user = await UserModel.findByEmail(email);
      console.log('User from DB:', user); // Log user
      if (!user) {
        const full_name = name || email.split('@')[0];
        const result = await UserModel.create(email, null, full_name, 'User', null, null, true);
        user = await UserModel.findById(result.insertId);
        console.log('Created user:', user); // Log new user
      }

      if (!user.is_active) {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }

      const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await UserModel.setRefreshToken(user.id, refreshToken);

      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        },
      });
    } catch (error) {
      console.error('Lỗi trong googleLogin:', error);
      return res.status(500).json({ message: 'Đăng nhập Google thất bại: ' + error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Thiếu refresh token' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.userId);
      if (!user || user.refresh_token !== refreshToken) {
        return res.status(401).json({ message: 'Refresh token không hợp lệ' });
      }

      const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.status(200).json({ success: true, data: { accessToken } });
    } catch (error) {
      return res.status(401).json({ message: 'Refresh token thất bại: ' + error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Email không tồn tại' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      await UserModel.setResetToken(user.id, resetToken, Date.now() + 3600000);

      const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đặt lại mật khẩu',
        html: `Vui lòng nhấp vào liên kết này để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a>`,
      });

      return res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi' });
    } catch (error) {
      return res.status(500).json({ message: 'Gửi email đặt lại mật khẩu thất bại: ' + error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ message: 'Thiếu mật khẩu mới' });
      }

      const user = await UserModel.findByResetToken(token);
      if (!user || user.reset_token_expires < Date.now()) {
        return res.status(400).json({ message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const success = await UserModel.updatePassword(user.id, hashedPassword);
      if (success) {
        await UserModel.setResetToken(user.id, null, null);
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
      }
      return res.status(400).json({ message: 'Đặt lại mật khẩu thất bại' });
    } catch (error) {
      return res.status(500).json({ message: 'Đặt lại mật khẩu thất bại: ' + error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const userId = req.user.userId;
      await UserModel.setRefreshToken(userId, null);
      return res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      return res.status(500).json({ message: 'Đăng xuất thất bại: ' + error.message });
    }
  },

  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Email không tồn tại' });
      }
      if (user.email_verified) {
        return res.status(400).json({ message: 'Email đã được xác minh' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      await UserModel.setVerificationToken(user.id, verificationToken);

      const verificationUrl = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác minh email của bạn',
        html: `Vui lòng nhấp vào liên kết này để xác minh email: <a href="${verificationUrl}">${verificationUrl}</a>`,
      });

      return res.status(200).json({ message: 'Email xác minh đã được gửi lại' });
    } catch (error) {
      return res.status(500).json({ message: 'Gửi lại email xác minh thất bại: ' + error.message });
    }
  },
  
};

module.exports = AuthController;