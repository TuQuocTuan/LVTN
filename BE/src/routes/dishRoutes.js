import express from 'express';
import { addDish, getDishes, searchDishesByName } from '../controllers/dishController.js';

const router = express.Router();

router.get('/', getDishes);
router.get('/search', searchDishesByName);
router.post('/', addDish);
export default router;