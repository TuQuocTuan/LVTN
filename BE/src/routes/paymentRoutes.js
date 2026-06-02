import express from 'express';
import { createMoMoPayment, momoIPNListener } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/momo', createMoMoPayment);
router.post('/momo-ipn', momoIPNListener);

export default router;