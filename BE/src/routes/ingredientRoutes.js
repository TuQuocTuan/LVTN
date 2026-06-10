import express from 'express';
import { getIngredients, addIngredients, updateIngredient, deleteIngredients } from '../controllers/ingredientController.js';

const router = express.Router();

router.get('/', getIngredients);
router.post('/add', addIngredients);
router.put('/update', updateIngredient);
router.delete('/delete/:id', deleteIngredients);
export default router;