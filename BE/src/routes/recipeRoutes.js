import express from 'express';
import { getRecipeByDish } from '../controllers/recipeController.js';

const router = express.Router();

router.get('/:dish_id', getRecipeByDish);
export default router;