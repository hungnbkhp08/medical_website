import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';

const ChatbotSec = ({ logData, isOpen, setIsOpen }) => {
    const { backendUrl } = useContext(AdminContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Send initial log data for consultation when logData changes (e.g. clicking 'Tư vấn')
    useEffect(() => {
        if (logData) {
            const initialQuery = `Hãy tư vấn xử lý log bảo mật sau:\n- Rule ID: ${logData.rule_id || 'N/A'}\n- Mức độ: ${logData.severity_label || 'N/A'}\n- Nội dung: ${logData.msg || 'N/A'}\n- Dữ liệu chi tiết: ${logData.data || 'N/A'}`;
            handleSendMessage(initialQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logData]);

    const handleSendMessage = async (textToSend) => {
        const query = textToSend || input;
        if (!query.trim()) return;

        const userMessage = { text: query, sender: 'user' };
        // Immediately add user message and an empty bot message
        setMessages((prev) => [...prev, userMessage, { text: '', sender: 'bot' }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${backendUrl}/api/chatbot/chat-sec`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    user: "admin-sec-user"
                })
            });

            if (!response.ok) {
                throw new Error('Lỗi phản hồi từ máy chủ');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = '';

            setIsLoading(false);

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    // Store the last incomplete line back in buffer
                    buffer = lines.pop();

                    for (let line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataPayload = line.slice(6).trim();
                            if (!dataPayload) continue;

                            try {
                                const data = JSON.parse(dataPayload);
                                if (data.event === 'message' || data.event === 'agent_message') {
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        const lastIdx = newMsgs.length - 1;
                                        newMsgs[lastIdx] = {
                                            ...newMsgs[lastIdx],
                                            text: newMsgs[lastIdx].text + (data.answer || '')
                                        };
                                        return newMsgs;
                                    });
                                }
                            } catch (e) {
                                // Ignore partial JSON Parse errors
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("ChatbotSec API error:", error);
            setMessages((prev) => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                newMsgs[lastIdx] = {
                    ...newMsgs[lastIdx],
                    text: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.',
                    isError: true
                };
                return newMsgs;
            });
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
                title="Mở ChatbotSec"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end shadow-2xl rounded-2xl w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] overflow-hidden bg-white border border-gray-200 anime-fade-in">
            {/* Header */}
            <div className="bg-gray-800 text-white px-5 py-4 w-full flex justify-between items-center z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold leading-tight">ChatbotSec</h3>
                        <p className="text-[11px] text-gray-300">Tư vấn phân tích log bảo mật</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 w-full p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">Tôi là chuyên gia bảo mật ảo.<br/>Bạn có thể hỏi tôi bất kỳ điều gì về log hệ thống.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : msg.isError 
                                ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                        }`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start w-full">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3.5 shadow-sm flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-200 w-full shrink-0">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2 items-end"
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Nhập câu hỏi..."
                        className="flex-1 border bg-gray-50 border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:border-blue-500 focus:bg-white resize-none text-sm min-h-[44px] max-h-[120px]"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white h-[44px] w-[44px] rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center shrink-0 mb-[1px]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotSec;
