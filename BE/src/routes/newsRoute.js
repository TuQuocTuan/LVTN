import express from 'express';
import { uploadNewsImage } from '../middlewares/uploadMiddleware.js';
import { addNews, getNews } from '../controllers/newsController.js';

const router = express.Router();

router.get('/', getNews);
router.post('/add', uploadNewsImage, addNews);

export default router;