import express from 'express';
import { getConversation, getConversationsList, sendMessage } from '../controllers/chatController.js';
import anyAuth from '../middlewares/anyAuth.js';
import upload from '../middlewares/multer.js';
const chatRouter = express.Router();

chatRouter.post('/conversation', anyAuth, getConversation);
chatRouter.get('/get-list', anyAuth,getConversationsList); // Added for consistency
chatRouter.post('/',upload.single('image'),anyAuth,sendMessage)
export default chatRouter;
