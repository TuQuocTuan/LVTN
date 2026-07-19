import express from 'express';
import { getDanhSachBan, getSessionByTable } from '../controllers/tableController.js';

const router = express.Router();

router.get('/', getDanhSachBan);
router.get('/getsession', getSessionByTable);
export default router;