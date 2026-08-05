import express from 'express';
import { getDoanhThuDashboard, layDSmonHomnay, tungngaytrongTuan, tungngaytrongThang, tungthangtrongNam, tinhtienvon } from '../controllers/dashboardcontroller.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// router.use(verifyToken, authorizeRoles('admin', 'super_admin'));

router.post('/revenue', getDoanhThuDashboard);
router.get('/revenue-week', tungngaytrongTuan);
router.get('/revenue-month', tungngaytrongThang);
router.get('/revenue-year', tungthangtrongNam);
router.get('/dish-today', layDSmonHomnay);
router.get('/cost', tinhtienvon);

export default router;