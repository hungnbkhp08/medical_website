import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to update CON_ID in .env
const updateEnvConId = (newConId) => {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const envPath = path.resolve(__dirname, '../.env');

        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            const conIdRegExp = /^CON_ID\s*=\s*['"]?[^'"\r\n]*['"]?/m;
            const newLine = `CON_ID='${newConId}'`;

            if (conIdRegExp.test(envContent)) {
                envContent = envContent.replace(conIdRegExp, newLine);
            } else {
                if (envContent.length > 0 && !envContent.endsWith('\n')) {
                    envContent += '\n';
                }
                envContent += `${newLine}\n`;
            }

            fs.writeFileSync(envPath, envContent, 'utf8');
            process.env.CON_ID = newConId;
            console.log("Successfully updated CON_ID in .env:", newConId);
        } else {
            console.error(".env file not found at", envPath);
        }
    } catch (err) {
        console.error("Error updating CON_ID in .env:", err.message);
    }
};

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

        const conversationId = conversation_id || process.env.CON_ID;
        if (conversationId) {
            requestData.conversation_id = conversationId;
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

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Intercept stream to grab conversation_id on the first chat
        response.data.on('data', (chunk) => {
            try {
                const str = chunk.toString();
                const match = str.match(/"conversation_id"\s*:\s*"([^"]+)"/);
                if (match && match[1]) {
                    const newConId = match[1];
                    if (newConId && !process.env.CON_ID) {
                        updateEnvConId(newConId);
                    }
                }
            } catch (err) {
                console.error("Error parsing stream for conversation_id:", err);
            }
        });

        response.data.pipe(res);
    } catch (error) {
        console.error("Error calling Dify API SEC:", error?.response?.data || error.message);
        // If headers are already sent (error during streaming), close the response.
        if (res.headersSent) {
            res.end();
        } else {
            res.status(500).json({ success: false, message: "Chatbot Sec error", error: error?.response?.data || error.message });
        }
    }
};

export const getChatSecMessages = async (req, res) => {
    try {
        // Lấy conversationId từ .env thay vì DB
        const conversationId = process.env.CON_ID;
        if (!conversationId) {
            return res.json({ success: true, conversationId: '', data: [] });
        }

        // Gọi Dify API GET /v1/messages?user=xxx&conversation_id=xxx
        const response = await axios.get(
            'https://api.dify.ai/v1/messages',
            {
                params: {
                    user: "admin-sec-user",
                    conversation_id: conversationId,
                    limit: 100,
                },
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_KEY_SEC}`,
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
        console.error("Error fetching Dify messages SEC:", error?.response?.data || error.message);
        // Nếu conversation không tìm thấy trên Dify
        if (error?.response?.status === 404) {
            return res.json({ success: true, conversationId: '', data: [] });
        }
        res.status(500).json({ success: false, message: "Error fetching messages", error: error?.response?.data || error.message });
    }
};
