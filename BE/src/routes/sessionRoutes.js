import express from 'express';
import { closeTable, openTable } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/active', openTable);
router.post('/closed', closeTable);


export default router;