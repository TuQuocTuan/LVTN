import express from 'express';
import { getReviewList, addReview } from '../controllers/reviewController.js';
const router = express.Router();


router.get('/', getReviewList);
router.post('/add', addReview);

export default router;
