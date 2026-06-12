import express from 'express';
import { getCategories, getIngredientsCategories } from '../controllers/categoryController.js';
const router = express.Router();

router.get('/', getCategories);
router.get('/category_ingredients', getIngredientsCategories);
export default router;