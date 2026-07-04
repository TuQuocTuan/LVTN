import express from 'express';
import { getDoanhThuDashboard } from '../controllers/dashboardcontroller.js';
const router = express.Router();

router.post('/revenue', getDoanhThuDashboard);
export default router;