import express from 'express';
import { getIngredients, addIngredients, updateIngredient, deleteIngredients, getIngredientsByCate } from '../controllers/ingredientController.js';

const router = express.Router();

router.get('/', getIngredients);
router.post('/add', addIngredients);
router.put('/update', updateIngredient);
router.get('/:category_id', getIngredientsByCate);
router.delete('/delete/:id', deleteIngredients);
export default router;