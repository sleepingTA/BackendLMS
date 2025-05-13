const multer = require('multer');

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File quá lớn, kích thước tối đa là 500MB' });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
};

module.exports = handleMulterError;