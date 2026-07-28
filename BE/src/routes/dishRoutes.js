import express from 'express';
import { uploadDishImage } from '../middlewares/uploadMiddleware.js';
import { addDish, deleteDish, getDishes, searchDishesByName, updateDish } from '../controllers/dishController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getDishes);
router.get('/search', searchDishesByName);

router.post('/', verifyToken, authorizeRoles('admin', 'chef', 'super_admin'), uploadDishImage, addDish);
router.put('/update', verifyToken, authorizeRoles('admin', 'chef', 'super_admin'), uploadDishImage, updateDish);
router.delete('/delete/:id', verifyToken, authorizeRoles('admin', 'chef', 'super_admin'), deleteDish);

export default router;

