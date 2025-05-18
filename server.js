require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const fs = require('fs');
const path = require('path');
const avatarDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
app.use('/uploads', express.static('uploads'));
app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials: true
}));
app.use(express.json());

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
app.use('/api', paymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});