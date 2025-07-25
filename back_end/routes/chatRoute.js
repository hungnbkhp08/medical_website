import express from 'express';
import { getConversation, getConversationsList, sendMessage } from '../controllers/chatController.js';
import anyAuth from '../middlewares/anyAuth.js';

const chatRouter = express.Router();

chatRouter.post('/conversation', anyAuth, getConversation);
chatRouter.post('/', anyAuth, sendMessage);
chatRouter.get('/get-list', anyAuth,getConversationsList); // Added for consistency

export default chatRouter;
