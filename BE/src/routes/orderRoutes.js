//Các đường dẫn API liên quan đến thực đơn
//=====================================================

import express from 'express';
import { createOrder, getCheckoutBillandCloseSession, getPendingOrders, updateOrderStatus, getOrderBySession } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.post('/checkout', getCheckoutBillandCloseSession);
router.get('/pendingOrders', getPendingOrders);
router.post('/completeOrder', updateOrderStatus);
router.get('/:session_id', getOrderBySession);
export default router;