import express from 'express';
import { getDoanhThuDashboard, layDSmonHomnay, tungngaytrongTuan, tinhtienvon } from '../controllers/dashboardcontroller.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// router.use(verifyToken, authorizeRoles('admin', 'super_admin'));

router.post('/revenue', getDoanhThuDashboard);
router.get('/revenue-week', tungngaytrongTuan);
router.get('/dish-today', layDSmonHomnay);
router.get('/cost', tinhtienvon);

export default router;