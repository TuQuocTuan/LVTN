import express from 'express';
import { getAllPromotions } from '../controllers/promotionController.js';

const router = express.Router();

router.get('/list', getAllPromotions);

export default router;