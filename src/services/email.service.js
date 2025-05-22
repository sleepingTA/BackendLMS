
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const EmailService = {
  sendVerificationEmail: async (email, token) => {
    try {
      const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;
      console.log('Generating verification URL:', verificationUrl);
      console.log('Sending verification email to:', email);
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác thực email',
        html: `Vui lòng click vào link sau để xác thực email: <a href="${verificationUrl}">Xác thực email</a>`,
      };
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully');
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error(`Lỗi khi gửi email xác thực: ${error.message}`);
    }
  },

  sendResetPasswordEmail: async (email, token) => {
    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      console.log('Generating reset password URL:', resetUrl);
      console.log('Sending reset password email to:', email);
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đặt lại mật khẩu',
        html: `Vui lòng click vào link sau để đặt lại mật khẩu: <a href="${resetUrl}">Đặt lại mật khẩu</a>`,
      };
      await transporter.sendMail(mailOptions);
      console.log('Reset password email sent successfully');
    } catch (error) {
      console.error('Error sending reset password email:', error);
      throw new Error(`Lỗi khi gửi email đặt lại mật khẩu: ${error.message}`);
    }
  },
};

module.exports = EmailService;