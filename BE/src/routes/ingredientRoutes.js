import express from 'express';
import { getIngredients, addIngredients, updateIngredient, deleteIngredients, huyNguyenLieu, huytuychon } from '../controllers/ingredientController.js';
// import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getIngredients);

// router.post('/add', verifyToken, authorizeRoles('admin', 'chef', 'super_admin', 'cashier'), addIngredients);
// router.put('/update', verifyToken, authorizeRoles('admin', 'chef', 'super_admin', 'cashier'), updateIngredient);
// router.delete('/delete/:id', verifyToken, authorizeRoles('admin', 'chef', 'super_admin', 'cashier'), deleteIngredients);

router.post('/add', addIngredients);
router.put('/update', updateIngredient);
router.get('/huy', huyNguyenLieu);
router.post('/huytuychon', huytuychon);
router.delete('/delete/:id', deleteIngredients);
export default router;