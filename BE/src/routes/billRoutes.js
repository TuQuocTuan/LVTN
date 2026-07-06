import express from 'express';
import { inBill } from '../controllers/billController.js';
const router = express.Router();

router.get('/:id', inBill);
export default router;