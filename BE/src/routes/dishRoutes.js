import express from 'express';
import multer from 'multer';
import { addDish, getDishes, searchDishesByName, updateDish } from '../controllers/dishController.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }).single('image');

router.get('/', getDishes);
router.get('/search', searchDishesByName);
router.post('/', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: `Lỗi Multer: ${err.message}` });
        }
        next();
    });
}, addDish);
router.put('/update', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: `Lỗi Multer: ${err.message}` });
        }
        next();
    });
}, updateDish);
export default router;

