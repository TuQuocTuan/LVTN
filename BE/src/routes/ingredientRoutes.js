import express from 'express';
import { getIngredients, addIngredients, updateIngredient, deleteIngredients } from '../controllers/ingredientController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getIngredients);

router.post('/add', verifyToken, authorizeRoles('admin', 'chef', 'super_admin'), addIngredients);
router.put('/update', verifyToken, authorizeRoles('admin', 'chef', 'super_admin'), updateIngredient);
router.delete('/delete/:id', verifyToken, authorizeRoles('admin', 'chef', 'super_admin'), deleteIngredients);

export default router;