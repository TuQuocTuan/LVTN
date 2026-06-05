//Các đường dẫn API liên quan đến thực đơn
//=====================================================

import express from 'express';
import { createOrder, getCheckoutBillandCloseSession, getPendingOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

// Định nghĩa đường dẫn POST để hứng dữ liệu đặt món
router.post('/', createOrder);
router.post('/checkout', getCheckoutBillandCloseSession);
router.get('/pendingOrders', getPendingOrders);
router.post('/completeOrder', updateOrderStatus);
export default router;