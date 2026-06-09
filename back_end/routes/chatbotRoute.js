import express from 'express';
import { sendChatMessage, getChatMessages, getDiagnosesByConversationId } from '../controllers/chatbotController.js';
import { sendChatSecMessage, getChatSecMessages } from '../controllers/chatbotSecController.js';
import { inputValidation } from '../middlewares/layer1-input-validation.js';
import authUser from '../middlewares/authUser.js';
import { outputValidation } from '../middlewares/layer3-output-validation.js';
import { hitlCheck } from '../middlewares/layer4-hitl.js';
import { rateLimiter } from '../middlewares/layer5-rate-limiter.js';


const router = express.Router();

router.post('/messages', authUser, getChatMessages);
router.post('/chat', authUser, rateLimiter, inputValidation, hitlCheck, sendChatMessage, outputValidation);
router.post('/chat-sec', rateLimiter, sendChatSecMessage);
router.get('/chat-sec/messages', getChatSecMessages);
router.get('/diagnoses', getDiagnosesByConversationId);

export default router;
