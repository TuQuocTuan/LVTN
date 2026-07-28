import express from 'express';
import { uploadNewsImage } from '../middlewares/uploadMiddleware.js';
import { addNews, delNews, getNews, updateNews } from '../controllers/newsController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getNews);

router.post('/add', verifyToken, authorizeRoles('admin', 'super_admin'), uploadNewsImage, addNews);
router.put('/update', verifyToken, authorizeRoles('admin', 'super_admin'), uploadNewsImage, updateNews);
router.delete('/delete/:id', verifyToken, authorizeRoles('admin', 'super_admin'), delNews);

export default router;