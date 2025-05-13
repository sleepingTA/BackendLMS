const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const EmailService = {
  // Gửi email xác thực
  sendVerificationEmail: async (email, token) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác thực email',
        html: `Vui lòng click vào link sau để xác thực email: <a href="${process.env.CLIENT_URL}/verify-email/${token}">Xác thực email</a>`,
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Lỗi khi gửi email xác thực: ${error.message}`);
    }
  },

  // Gửi email đặt lại mật khẩu
  sendResetPasswordEmail: async (email, token) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đặt lại mật khẩu',
        html: `Vui lòng click vào link sau để đặt lại mật khẩu: <a href="${process.env.CLIENT_URL}/reset-password/${token}">Đặt lại mật khẩu</a>`,
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Lỗi khi gửi email đặt lại mật khẩu: ${error.message}`);
    }
  },
};

module.exports = EmailService;