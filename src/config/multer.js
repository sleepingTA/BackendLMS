const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, 'uploads/videos/');
        } else if (file.fieldname === 'material') {
            cb(null, 'uploads/materials/');
        } else if (file.fieldname === 'thumbnail') {
            cb(null, 'uploads/thumbnails/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('File video không hợp lệ'), false);
        }
    } else if (file.fieldname === 'material') {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File tài liệu không hợp lệ'), false);
        }
    } else if (file.fieldname === 'thumbnail') {
        if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File ảnh không hợp lệ, chỉ chấp nhận jpg, jpeg, png'), false);
        }
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: fileFilter,
});

module.exports = upload;