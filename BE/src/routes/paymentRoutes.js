import express from 'express';
import { vnpayIPN, createPaymentUrlRequest } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/vnpay-ipn', vnpayIPN);
router.post('/vnpay', createPaymentUrlRequest);

export default router;