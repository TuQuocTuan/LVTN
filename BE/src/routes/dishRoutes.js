import express from 'express';
import { getDishes } from '../controllers/dishController.js';

const router = express.Router();

router.get('/', getDishes);
export default router;