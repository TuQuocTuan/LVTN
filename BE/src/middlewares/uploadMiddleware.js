import multer from 'multer';

const storage = multer.memoryStorage();
const limits = { fileSize: 5 * 1024 * 1024 };

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Định dạng file không hợp lệ! Chỉ chấp nhận file ảnh.'), false);
    }
};

const upload = multer({ storage, limits, fileFilter }).single('image');

export const uploadDishImage = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: `Lỗi Multer: ${err.message}` });
        }
        next();
    });
};

export const uploadNewsImage = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: `Lỗi Multer: ${err.message}` });
        }
        next();
    });
};