import express from 'express';
import { getConversation, sendMessage } from '../controllers/chatController.js';
import anyAuth from '../middlewares/anyAuth.js';

const chatRouter = express.Router();

chatRouter.post('/conversation', anyAuth, getConversation);
chatRouter.post('/', anyAuth, sendMessage);

export default chatRouter;
