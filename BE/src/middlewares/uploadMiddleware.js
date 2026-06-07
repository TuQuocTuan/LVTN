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

const upload = multer({ storage, limits, fileFilter });

export const uploadDishImage = upload.single('image');