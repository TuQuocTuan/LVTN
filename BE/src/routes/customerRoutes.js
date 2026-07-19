import express from 'express';
import { createCustomer, editCustomer } from '../controllers/customerController.js';
const router = express.Router();

router.post('/create', createCustomer);
router.put('/edit', editCustomer);

export default router;