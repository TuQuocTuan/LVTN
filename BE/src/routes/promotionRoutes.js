import express from 'express';
import { getAllPromotions, addPromotions, updatePromotion, deletePromotion, getCustomerVoucher, getCustomerVouchersHistory, giftVoucherToCustomer } from '../controllers/promotionController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/list', getAllPromotions);
router.post('/customer-voucher', getCustomerVoucher);
router.get('/customer-vouchers', verifyToken, getCustomerVouchersHistory);

router.post('/add', verifyToken, authorizeRoles('admin', 'super_admin'), addPromotions);
router.post('/update', verifyToken, authorizeRoles('admin', 'super_admin'), updatePromotion);
router.delete('/delete/:id', verifyToken, authorizeRoles('admin', 'super_admin'), deletePromotion);
router.post('/gift-voucher', verifyToken, authorizeRoles('admin', 'super_admin'), giftVoucherToCustomer);

export default router;