// src/components/Chatbot.jsx
import React, { useState } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Xin chào! Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    newMessages.push({ sender: 'bot', text: `Bạn vừa nói: "${input}"` });

    setMessages(newMessages);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans text-gray-800">
      {isOpen ? (
        <div className="w-80 bg-white border rounded-xl shadow-xl flex flex-col text-sm">
          <div className="bg-blue-600 text-white p-3 font-semibold rounded-t-xl flex justify-between items-center text-base">
            <span>Trợ lý ảo</span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
              <CloseIcon fontSize="small" />
            </button>
          </div>
          <div className="p-3 h-64 overflow-y-auto flex flex-col gap-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg leading-snug max-w-[85%] ${
                  msg.sender === 'bot'
                    ? 'bg-gray-100 self-start text-gray-900'
                    : 'bg-blue-100 self-end text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="flex border-t p-3 gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={input}
              placeholder="Nhập tin nhắn..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              onClick={handleSend}
            >
              Gửi
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <ChatIcon />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
