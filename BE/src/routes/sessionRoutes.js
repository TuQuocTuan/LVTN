import express from 'express';
import { openMenuCustomer, openTable } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/active', openTable);
router.get('/open-menu', openMenuCustomer);

export default router;