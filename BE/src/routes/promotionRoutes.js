import express from 'express';
import { getAllPromotions, addPromotions, updatePromotion, deletePromotion } from '../controllers/promotionController.js';

const router = express.Router();

router.get('/list', getAllPromotions);
router.post('/add', addPromotions);
router.post('/update', updatePromotion);
router.delete('/delete/:id', deletePromotion);

export default router;