import express from 'express';
import { uploadDishImage } from '../middlewares/uploadMiddleware.js';
import { addDish, deleteDish, getDishes, searchDishesByName, updateDish } from '../controllers/dishController.js';

const router = express.Router();

router.get('/', getDishes);
router.get('/search', searchDishesByName);
router.post('/', uploadDishImage, addDish);
router.put('/update', uploadDishImage, updateDish);
router.delete('/delete/:id', deleteDish);
export default router;

