import express from 'express';
import { getAllUser, updateRoleUser, addUser, deleteUser, changePassword } from '../controllers/userController.js';
const router = express.Router();

router.get('/', getAllUser);
router.post('/add', addUser);
router.put('/update', updateRoleUser);
router.put('/change', changePassword);
router.put('/delete/:id', deleteUser);
export default router;
