const CartModel = require("../models/cart.model");
const CourseModel = require("../models/course.model");
const EnrollmentModel = require("../models/enrollment.model");

const CartController = {
  // Lấy giỏ hàng của người dùng
  getCart: async (req, res) => {
    try {
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
      // Kiểm tra khóa học tồn tại
      const course = await CourseModel.findCourseById(course_id);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      // Kiểm tra xem người dùng đã mua khóa học chưa
      const enrollment = await EnrollmentModel.checkEnrollment(req.user.userId, course_id);
      if (enrollment) {
        return res.status(400).json({ message: "Bạn đã mua khóa học này" });
      }
      // Lấy hoặc tạo giỏ hàng
      let cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        const cartId = await CartModel.createCart(req.user.userId);
        cart = { id: cartId, user_id: req.user.userId };
      }
      // Thêm khóa học vào giỏ hàng
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
      const { course_id } = req.params;
      const cart = await CartModel.findCartByUserId(req.user.userId);
      if (!cart) {
        return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
      }
      const success = await CartModel.removeItemFromCart(cart.id, course_id);
      if (!success) {
        return res.status(404).json({ message: "Khóa học không có trong giỏ hàng" });
      }
      return res.status(200).json({ message: "Xóa khỏi giỏ hàng thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
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