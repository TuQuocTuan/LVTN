import express from 'express';
import { openMenuCustomer, openTable, closeTable } from '../controllers/sessionController.js';

const router = express.Router();


router.post('/serving', openTable);
router.post('/open-menu', openMenuCustomer);
router.post('/close', closeTable);

export default router;