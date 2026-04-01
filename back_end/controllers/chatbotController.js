import axios from 'axios';

export const sendChatMessage = async (req, res) => {
    try {
        const { query, user = "web-user", conversation_id = "", files = [] } = req.body;
        
        const requestData = {
            inputs: {},
            query: query,
            response_mode: "blocking", // Use blocking to return a complete response easily
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
                    'Authorization': `Bearer ${process.env.DIFY_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error calling Dify API:", error?.response?.data || error.message);
        res.status(500).json({ success: false, message: "Chatbot error", error: error?.response?.data || error.message });
    }
};
