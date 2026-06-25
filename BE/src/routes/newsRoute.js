import express from 'express';
import { uploadNewsImage } from '../middlewares/uploadMiddleware.js';
import { addNews, delNews, getNews, updateNews } from '../controllers/newsController.js';

const router = express.Router();

router.get('/', getNews);
router.post('/add', uploadNewsImage, addNews);
router.put('/update', uploadNewsImage, updateNews);
router.delete('/delete/:id', delNews);

export default router;