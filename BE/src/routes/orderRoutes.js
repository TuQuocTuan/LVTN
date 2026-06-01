//Các đường dẫn API liên quan đến thực đơn
//=====================================================

import express from 'express';
import { createOrder, getCheckoutBill } from '../controllers/orderController.js';

const router = express.Router();

// Định nghĩa đường dẫn POST để hứng dữ liệu đặt món
router.post('/', createOrder);
router.get('/checkout/:session_id', getCheckoutBill);
export default router;