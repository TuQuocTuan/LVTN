import express from 'express';
import { openMenuCustomer, openTable } from '../controllers/sessionController.js';

const router = express.Router();


router.post('/serving', openTable);
router.post('/open-menu', openMenuCustomer);

export default router;