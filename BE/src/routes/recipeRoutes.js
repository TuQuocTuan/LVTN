import express from 'express';
import { getRecipeByDish, getRecipelist, searchRecipe, addRecipes, updateRecipes, deleteRecipe, getAllVersionByDish, getRecipeByVersion } from '../controllers/recipeController.js';

const router = express.Router();

router.get('/', getRecipelist);
router.get('/search', searchRecipe);
router.post('/add', addRecipes);
router.put('/update', updateRecipes);
router.delete('/delete', deleteRecipe);
router.get('/version', getAllVersionByDish);
router.get('/by-version', getRecipeByVersion);
router.get('/:dish_id', getRecipeByDish);

export default router;