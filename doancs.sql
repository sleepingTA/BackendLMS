-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS e_learning;
USE e_learning;

-- Bảng users: Lưu thông tin người dùng
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Instructor', 'User') DEFAULT 'User',
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    refresh_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng categories: Lưu danh mục khóa học
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng courses: Lưu thông tin khóa học
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    created_by INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discounted_price DECIMAL(10, 2) GENERATED ALWAYS AS (price * (1 - discount_percentage / 100)) STORED,
    thumbnail_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    total_students INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lessons: Lưu thông tin bài học
CREATE TABLE lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_number INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Bảng videos: Lưu thông tin video bài học
CREATE TABLE videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(255) NOT NULL,
    order_number INT DEFAULT 0,
    duration INT,
    is_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Bảng materials: Lưu thông tin tài liệu bài học
CREATE TABLE materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Bảng cart: Lưu thông tin giỏ hàng của người dùng
CREATE TABLE cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id)
);

-- Bảng cart_items: Lưu các khóa học trong giỏ hàng
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    course_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (cart_id, course_id)
);

-- Bảng payments: Lưu thông tin thanh toán cho giỏ hàng
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    cart_id INT NOT NULL,
    payment_method ENUM('Bank Transfer', 'Credit Card', 'PayPal', 'Mobile Payment') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE
);

-- Bảng enrollments: Lưu thông tin đăng ký khóa học
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (user_id, course_id)
);

-- Bảng reviews: Lưu đánh giá khóa học
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
ALTER TABLE payments MODIFY COLUMN amount DECIMAL(10,2);
ALTER TABLE payments
ADD COLUMN payos_order_code VARCHAR(50) UNIQUE,
ADD COLUMN payos_checkout_url VARCHAR(255);
-- Trigger để tự động đăng ký khóa học và xóa giỏ hàng khi thanh toán thành công
DELIMITER //
CREATE TRIGGER enroll_user_after_payment
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'Success' AND OLD.status != 'Success' THEN
        -- Thêm tất cả khóa học trong giỏ hàng vào enrollments
        INSERT INTO enrollments (user_id, course_id, enrolled_at)
        SELECT c.user_id, ci.course_id, NOW()
        FROM cart c
        JOIN cart_items ci ON c.id = ci.cart_id
        WHERE c.id = NEW.cart_id
        ON DUPLICATE KEY UPDATE enrolled_at = NOW();
        
        -- Xóa các mục trong giỏ hàng
        DELETE FROM cart_items WHERE cart_id = NEW.cart_id;
        
        -- Cập nhật total_students cho các khóa học
        UPDATE courses co
        SET co.total_students = (
            SELECT COUNT(*) 
            FROM enrollments e 
            WHERE e.course_id = co.id
        )
        WHERE co.id IN (
            SELECT course_id 
            FROM cart_items 
            WHERE cart_id = NEW.cart_id
        );
    END IF;
END //
DELIMITER ;
-- Trigger để tự động tăng total_students sau khi thêm mới enrollment
DELIMITER //
CREATE TRIGGER increment_total_students_after_enrollment
AFTER INSERT ON enrollments
FOR EACH ROW
BEGIN
    -- Tăng số lượng total_students trong bảng courses
    UPDATE courses
    SET total_students = total_students + 1
    WHERE id = NEW.course_id;
END //
DELIMITER ;
-- Trigger để cập nhật giá giảm giá khi thay đổi giá hoặc phần trăm giảm giá
DELIMITER //
CREATE TRIGGER update_discounted_price
BEFORE UPDATE ON courses
FOR EACH ROW
BEGIN
    SET NEW.discounted_price = NEW.price * (1 - NEW.discount_percentage / 100);
END //
DELIMITER ;

-- Chỉ mục để tối ưu hóa truy vấn
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_items_cart_course ON cart_items(cart_id, course_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_cart_id ON payments(cart_id);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_videos_lesson_id ON videos(lesson_id);
CREATE INDEX idx_materials_lesson_id ON materials(lesson_id);
CREATE INDEX idx_payments_payos_order_code ON payments(payos_order_code);

INSERT INTO users (email, password, full_name, role, avatar, email_verified) VALUES
('admin@example.com', 'hashed_password_1', 'Admin User', 'Admin', 'avatar1.png', TRUE),
('instructor1@example.com', 'hashed_password_2', 'Instructor One', 'Instructor', 'avatar2.png', TRUE),
('user1@example.com', 'hashed_password_3', 'User One', 'User', 'avatar3.png', TRUE),
('user2@example.com', 'hashed_password_4', 'User Two', 'User', 'avatar4.png', TRUE);
INSERT INTO categories (name, description) VALUES
('Web Development', 'Courses on HTML, CSS, JavaScript, and modern web frameworks'),
('Data Science', 'Courses on data analysis, machine learning, and AI'),
('Graphic Design', 'Courses on Photoshop, Illustrator, and visual design');


INSERT INTO courses (title, description, category_id, created_by, price, discount_percentage, thumbnail_url) VALUES
('AI & Machine Learning Full Course', 'Comprehensive course on AI and Machine Learning from scratch.', 2, 2, 59.99, 10, 'ai&machinelearning.jpg'),
('AI and ML Introduction', 'Learn the fundamentals of AI and Machine Learning.', 2, 2, 49.99, 15, 'ai_and_ml.jpg'),
('AI and Machine Learning Courses Overview', 'A quick overview of top-rated AI/ML courses.', 2, 2, 39.99, 5, 'AI-And-Machine-Learning-Courses.jpg'),
('Artificial Intelligence Explained', 'Understand AI from the ground up.', 2, 2, 44.99, 0, 'Artificial-intelligence.jpg'),
('Top Machine Learning Courses', 'Best courses to learn ML online.', 2, 2, 54.99, 20, 'best_machine_learning_course.webp'),
('Machine Learning Specialization', 'Specialization program in Machine Learning.', 2, 2, 69.99, 25, 'coursera.png'),
('MAD Landscape 2024 - AI Overview', 'Exploring the MAD landscape in modern AI.', 2, 2, 29.99, 0, 'firstmark-mad-landscape-open-graph_purple-1.jpeg'),
('Google Machine Learning Crash Course', 'ML crash course by Google for beginners.', 2, 2, 0.00, 0, 'Google-machine-Learning.png'),
('AI & ML in 11 Hours - Intellipaat', 'Fast-track AI & ML learning.', 2, 2, 39.99, 30, 'intellipaat.jpg'),
('Understand the Basics of Machine Learning', 'Start your ML journey with this beginner-friendly course.', 2, 2, 34.99, 10, 'Understand_the_Basic_of_ML.jpg');

INSERT INTO lessons (course_id, title, description, order_number, created_at, updated_at) VALUES
(4, 'Introduction', 'Giới thiệu về khóa học Trí tuệ Nhân tạo.', 1, NOW(), NOW()),
(4, 'Getting Set Up', 'Cài đặt môi trường cần thiết cho khóa học.', 2, NOW(), NOW()),
(4, 'Vector Models and Text Preprocessing', 'Học về mô hình vector và tiền xử lý văn bản.', 3, NOW(), NOW()),
(4, 'Probabilistic Models (Introduction)', 'Giới thiệu về các mô hình xác suất.', 4, NOW(), NOW()),
(4, 'Markov Models (Intermediate)', 'Khám phá mô hình Markov ở mức trung cấp.', 5, NOW(), NOW()),
(4, 'Article Spinner (Intermediate)', 'Tìm hiểu cách tạo bài viết tự động ở mức trung cấp.', 6, NOW(), NOW()),
(4, 'Cipher Decryption (Advanced)', 'Giải mã mật mã ở cấp độ nâng cao.', 7, NOW(), NOW()),
(4, 'Machine Learning Models (Introduction)', 'Giới thiệu về các mô hình học máy.', 8, NOW(), NOW()),
(4, 'Spam Detection', 'Phát hiện thư rác bằng các kỹ thuật AI.', 9, NOW(), NOW()),
(4, 'Sentiment Analysis', 'Phân tích cảm xúc trong văn bản.', 10, NOW(), NOW()),
(4, 'Text Summarization', 'Tóm tắt văn bản bằng AI.', 11, NOW(), NOW()),
(4, 'Topic Modeling', 'Mô hình hóa chủ đề trong dữ liệu.', 12, NOW(), NOW()),
(4, 'Latent Semantic Analysis (Latent Semantic Analysis)', 'Phân tích ngữ nghĩa tiềm ẩn.', 13, NOW(), NOW()),
(4, 'Deep Learning (Introduction)', 'Giới thiệu về học sâu.', 14, NOW(), NOW()),
(4, 'The Neuron', 'Hiểu về neuron trong mạng nơ-ron.', 15, NOW(), NOW()),
(4, 'Feedforward Artificial Neural Networks', 'Mạng nơ-ron hướng tới trước.', 16, NOW(), NOW()),
(4, 'Convolutional Neural Networks', 'Mạng nơ-ron tích chập.', 17, NOW(), NOW()),
(4, 'Recurrent Neural Networks', 'Mạng nơ-ron hồi tiếp.', 18, NOW(), NOW()),
(4, 'Course Conclusion', 'Kết luận khóa học.', 19, NOW(), NOW()),
(4, 'Setting Up Your Environment FAQ', 'Câu hỏi thường gặp về cài đặt môi trường.', 20, NOW(), NOW()),
(4, 'Extra Help With Python Coding for Beginners', 'Hỗ trợ lập trình Python cho người mới bắt đầu.', 21, NOW(), NOW()),
(4, 'Effective Learning Strategies for Machine Learning', 'Chiến lược học tập hiệu quả cho học máy.', 22, NOW(), NOW()),
(4, 'Appendix FAQ Finale', 'Phụ lục và câu hỏi thường gặp cuối cùng.', 23, NOW(), NOW());



