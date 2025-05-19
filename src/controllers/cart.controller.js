const CartModel = require("../models/cart.model");
const CourseModel = require("../models/course.model");
const EnrollmentModel = require("../models/enrollment.model");

const CartController = {
  // Lấy giỏ hàng
  getCart: async (req, res) => {
    try {
      console.log('User ID from authMiddleware:', req.user.userId); // Log để debug
      const cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
      }
      const cartItems = await CartModel.getCartItems(cart.id);
      return res.status(200).json({ cart, items: cartItems });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Thêm khóa học vào giỏ hàng
  addToCart: async (req, res) => {
    try {
      const { course_id } = req.body;
      if (!course_id) {
        return res.status(400).json({ message: "Thiếu ID khóa học" });
      }
      const course = await CourseModel.findCourseById(course_id);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      const enrollment = await EnrollmentModel.checkEnrollment(req.user.userId, course_id);
      if (enrollment) {
        return res.status(400).json({ message: "Bạn đã mua khóa học này" });
      }
      let cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        const cartId = await CartModel.createCart(req.user.userId);
        cart = { id: cartId, user_id: req.user.userId };
      }
      const success = await CartModel.addItemToCart(cart.id, course_id);
      if (!success) {
        return res.status(400).json({ message: "Khóa học đã có trong giỏ hàng" });
      }
      return res.status(201).json({ message: "Thêm vào giỏ hàng thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa khóa học khỏi giỏ hàng
  removeFromCart: async (req, res) => {
    try {
      const { courseId } = req.params; // Sửa thành courseId để khớp với route
      console.log('Received courseId from params:', courseId); // Log để debug
      const parsedCourseId = parseInt(courseId, 10);
      if (isNaN(parsedCourseId) || parsedCourseId <= 0) {
        return res.status(400).json({ success: false, message: 'ID khóa học không hợp lệ' });
      }
      console.log('Parsed courseId:', parsedCourseId); // Log để debug
      const cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });
      }
      const success = await CartModel.removeItemFromCart(cart.id, parsedCourseId);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Khóa học không có trong giỏ hàng' });
      }
      return res.status(200).json({ success: true, message: 'Xóa khỏi giỏ hàng thành công' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Làm trống giỏ hàng
  clearCart: async (req, res) => {
    try {
      const cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
      }
      await CartModel.clearCart(cart.id);
      return res.status(200).json({ message: "Làm trống giỏ hàng thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = CartController;