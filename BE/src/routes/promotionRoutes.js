import express from 'express';
import { getCustomerVoucher, getAllPromotions } from '../controllers/promotionController.js';

const router = express.Router();

router.get('/list', getAllPromotions);
router.post('/customer-voucher', getCustomerVoucher);

export default router;