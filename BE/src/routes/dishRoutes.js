import express from 'express';
import { getDishes, searchDishesByName } from '../controllers/dishController.js';

const router = express.Router();

router.get('/', getDishes);
router.get('/search', searchDishesByName);
export default router;