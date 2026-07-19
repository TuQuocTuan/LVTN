import express from 'express';
import { createCustomer, editCustomer, getCustomers, deleteCustomer } from '../controllers/customerController.js';
const router = express.Router();

router.get('/', getCustomers);
router.post('/create', createCustomer);
router.put('/edit', editCustomer);
router.delete('/:id', deleteCustomer);

export default router;