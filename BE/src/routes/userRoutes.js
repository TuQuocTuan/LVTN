import express from 'express';
import { getAllUser, updateRoleUser, addUser, deleteUser, changePassword, ketCa, finalizeKetCa, quanlythoigianlam1ca, getShiftReports } from '../controllers/userController.js';
const router = express.Router();

router.get('/', getAllUser);
router.get('/ketca', ketCa);
router.post('/ketca', finalizeKetCa);
router.get('/shift', quanlythoigianlam1ca);
router.get('/shift-reports', getShiftReports);
router.post('/add', addUser);
router.put('/update', updateRoleUser);
router.put('/change', changePassword);
router.put('/delete/:id', deleteUser);
export default router;
