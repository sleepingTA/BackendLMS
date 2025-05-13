const OrderModel = require("../models/order.model");
const CourseModel = require("../models/course.model");

const OrderController = {
  // Lấy đơn hàng theo ID
  getOrderById: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await OrderModel.findOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.user_id !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Lấy tất cả đơn hàng của người dùng
  getUserOrders: async (req, res) => {
    try {
      const { userId } = req.user;
      const orders = await OrderModel.getOrdersByUser(userId);
      return res.status(200).json(orders);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Tạo đơn hàng mới
  createOrder: async (req, res) => {
    try {
      const { course_id, payment_method, discount_amount } = req.body;
      if (!course_id) {
        return res.status(400).json({ message: "Thiếu ID khóa học" });
      }
      const course = await CourseModel.findCourseById(course_id);
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      const orderData = {
        user_id: req.user.userId,
        course_id,
        payment_method: payment_method || "Bank Transfer",
        total_amount: course.discounted_price || course.price,
        discount_amount: discount_amount || 0,
      };
      const orderId = await OrderModel.createOrder(orderData);
      return res.status(201).json({ message: "Tạo đơn hàng thành công", orderId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }
      const order = await OrderModel.findOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.user_id !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền cập nhật" });
      }
      const success = await OrderModel.updateOrderStatus(orderId, status);
      if (!success) {
        return res.status(400).json({ message: "Cập nhật thất bại" });
      }
      return res.status(200).json({ message: "Cập nhật trạng thái đơn hàng thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Xóa đơn hàng
  deleteOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await OrderModel.findOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.user_id !== req.user.userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }
      const success = await OrderModel.deleteOrder(orderId);
      if (!success) {
        return res.status(400).json({ message: "Xóa thất bại" });
      }
      return res.status(200).json({ message: "Xóa đơn hàng thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = OrderController;