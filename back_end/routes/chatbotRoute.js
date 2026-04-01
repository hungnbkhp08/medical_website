import express from 'express';
import { sendChatMessage } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/chat', sendChatMessage);

export default router;
