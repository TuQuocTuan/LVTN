import express from 'express';
import { createCustomer, editCustomer, getCustomers, deleteCustomer } from '../controllers/customerController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getCustomers);
router.post('/create', verifyToken, createCustomer);

router.put('/edit', verifyToken, authorizeRoles('admin', 'cashier', 'super_admin'), editCustomer);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'cashier', 'super_admin'), deleteCustomer);

export default router;