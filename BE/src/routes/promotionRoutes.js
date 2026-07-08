import express from 'express';
import { getAllPromotions, addPromotions, updatePromotion, deletePromotion, getCustomerVoucher, getCustomerVouchersHistory, giftVoucherToCustomer } from '../controllers/promotionController.js';

const router = express.Router();

router.get('/list', getAllPromotions);
router.post('/customer-voucher', getCustomerVoucher);
router.post('/add', addPromotions);
router.post('/update', updatePromotion);
router.delete('/delete/:id', deletePromotion);
router.get('/customer-vouchers', getCustomerVouchersHistory);
router.post('/gift-voucher', giftVoucherToCustomer);

export default router;