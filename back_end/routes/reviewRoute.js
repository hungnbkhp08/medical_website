import express from 'express';
import { submitReview,getListReview  } from '../controllers/reviewController.js';
import authUser from '../middlewares/authUser.js';
const reviewRoute = express.Router();
reviewRoute.post('/review-doctor',authUser, submitReview);
reviewRoute.post('/get-list', getListReview);
export default reviewRoute;