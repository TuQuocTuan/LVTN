import express from 'express';
import { getAllUser, updateRoleUser, addUser, deleteUser, changePassword, ketCa, finalizeKetCa, quanlythoigianlam1ca, getShiftReports } from '../controllers/userController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin', 'super_admin'), getAllUser);
router.get('/ketca', verifyToken, ketCa);
router.post('/ketca', verifyToken, finalizeKetCa);
router.get('/shift', verifyToken, quanlythoigianlam1ca);
router.get('/shift-reports', verifyToken, authorizeRoles('admin', 'super_admin'), getShiftReports);
router.post('/add', verifyToken, authorizeRoles('admin', 'super_admin'), addUser);
router.put('/update', verifyToken, authorizeRoles('admin', 'super_admin'), updateRoleUser);
router.put('/change', verifyToken, changePassword);
router.put('/delete/:id', verifyToken, authorizeRoles('admin', 'super_admin'), deleteUser);

export default router;
