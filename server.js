require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const payOS = require('./src/config/payos');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads/avatars nếu chưa tồn tại
const avatarDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

app.use('/uploads', express.static('uploads'));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json());

// Middleware debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} ${res.statusCode}`);
  next();
});

// Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const categoryRoutes = require('./src/routes/category.routes');
const courseRoutes = require('./src/routes/course.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const reviewRoutes = require('./src/routes/review.routes');
const cartRoutes = require('./src/routes/cart.routes');
const lessonRoutes = require('./src/routes/lesson.routes');
const enrollmentRoutes = require('./src/routes/enrollment.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', lessonRoutes); 
app.use('/api', reviewRoutes); 
app.use('/api', enrollmentRoutes);
app.use('/api', cartRoutes);
app.use('/api/payments', paymentRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

});