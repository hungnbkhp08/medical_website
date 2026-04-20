import axios from 'axios';

export const sendChatSecMessage = async (req, res, next) => {
    try {
        const { query, user = "admin-sec", conversation_id = "", files = [] } = req.body;
        
        const requestData = {
            inputs: {},
            query: query,
            response_mode: "streaming", 
            user: user,
            files: files
        };

        if (conversation_id) {
            requestData.conversation_id = conversation_id;
        }

        const response = await axios.post(
            'https://api.dify.ai/v1/chat-messages',
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_KEY_SEC}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        res.locals.difyData = response.data;
        next();
    } catch (error) {
        console.error("Error calling Dify API SEC:", error?.response?.data || error.message);
        res.status(500).json({ success: false, message: "Chatbot Sec error", error: error?.response?.data || error.message });
    }
};
