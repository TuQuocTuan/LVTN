import express from 'express';
import { getDoanhThuDashboard, tungngaytrongTuan } from '../controllers/dashboardcontroller.js';
const router = express.Router();

router.post('/revenue', getDoanhThuDashboard);
router.get('/revenue-week', tungngaytrongTuan);
export default router;