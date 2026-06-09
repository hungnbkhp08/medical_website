import axios from 'axios';
import userModel from '../models/userModel.js';
import resultModel from '../models/resultModel.js';

// POST /api/chatbot/messages - Lấy lịch sử tin nhắn từ Dify dựa vào conversationId trong DB user
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.body;

        // Lấy conversationId từ DB user
        const user = await userModel.findById(userId).select('conversationId');
        if (!user || !user.conversationId) {
            return res.json({ success: true, conversationId: '', data: [] });
        }

        const conversationId = user.conversationId;

        // Gọi Dify API GET /v1/messages?user=xxx&conversation_id=xxx
        const response = await axios.get(
            'https://api.dify.ai/v1/messages',
            {
                params: {
                    user: userId,
                    conversation_id: conversationId,
                    limit: 100,
                },
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            conversationId: conversationId,
            data: response.data.data || []
        });
    } catch (error) {
        console.error("Error fetching Dify messages:", error?.response?.data || error.message);
        // Nếu conversation không tìm thấy trên Dify, reset conversationId
        if (error?.response?.status === 404) {
            const { userId } = req.body;
            if (userId) {
                await userModel.findByIdAndUpdate(userId, { conversationId: '' });
            }
            return res.json({ success: true, conversationId: '', data: [] });
        }
        res.status(500).json({ success: false, message: "Error fetching messages", error: error?.response?.data || error.message });
    }
};

// POST /api/chatbot/chat - Gửi tin nhắn tới Dify
export const sendChatMessage = async (req, res, next) => {
    try {
        const { query, user = "web-user", files = [], userId } = req.body;
        
        // Lấy conversationId từ DB user
        let conversationId = '';
        if (userId) {
            const dbUser = await userModel.findById(userId).select('conversationId');
            if (dbUser && dbUser.conversationId) {
                conversationId = dbUser.conversationId;
            }
        }

        const requestData = {
            inputs: {},
            query: query,
            response_mode: "blocking",
            user: userId || user,
            files: files
        };

        if (conversationId) {
            requestData.conversation_id = conversationId;
        }

        const response = await axios.post(
            'https://api.dify.ai/v1/chat-messages',
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Lưu conversationId vào DB nếu là conversation mới
        const newConversationId = response.data?.conversation_id;
        if (newConversationId && userId && newConversationId !== conversationId) {
            await userModel.findByIdAndUpdate(userId, { conversationId: newConversationId });
        }

        res.locals.difyData = response.data;
        next();
    } catch (error) {
        console.error("Error calling Dify API:", error?.response?.data || error.message);
        res.status(500).json({ success: false, message: "Chatbot error", error: error?.response?.data || error.message });
    }
};

// GET /api/chatbot/diagnoses - Lấy danh sách chẩn đoán dựa trên conversationId
export const getDiagnosesByConversationId = async (req, res) => {
    try {
        const conversationId = req.query.conversationId || req.body.conversationId;

        if (!conversationId) {
            return res.status(400).json({ success: false, message: "Missing conversationId parameter" });
        }

        // 1. Tìm user theo conversationId
        const user = await userModel.findOne({ conversationId }).select('_id');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found with the provided conversationId" });
        }

        // 2. Lấy dữ liệu diagnosis từ bảng result theo userId
        const results = await resultModel.find({ userId: user._id }).select('diagnosis');
        
        // 3. Chuyển thành list string
        const diagnoses = results.map(r => r.diagnosis).filter(d => d);
        const diagnosisString = diagnoses.join(',');

        res.json({
            success: true,
            userId: user._id,
            diagnoses: diagnoses,
            diagnosisList: diagnosisString
        });
    } catch (error) {
        console.error("Error in getDiagnosesByConversationId:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
