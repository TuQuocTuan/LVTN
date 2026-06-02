import express from 'express';
import { getDanhSachBan } from '../controllers/tableController.js';

const router = express.Router();

router.get('/', getDanhSachBan);
export default router;