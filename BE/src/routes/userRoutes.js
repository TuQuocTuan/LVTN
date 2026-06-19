import express from 'express';
import { getAllUser, updateRoleUser, addUser } from '../controllers/userController.js';
const router = express.Router();

router.get('/', getAllUser);
router.post('/add', addUser);
router.put('/update', updateRoleUser);
export default router;
