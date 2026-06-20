import express from 'express';
import { getAllUser, updateRoleUser, addUser, deleteUser } from '../controllers/userController.js';
const router = express.Router();

router.get('/', getAllUser);
router.post('/add', addUser);
router.put('/update', updateRoleUser);
router.put('/delete/:id', deleteUser);
export default router;
