import React, { useState, useRef, useEffect, useContext } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const Typewriter = ({ text, onTyping }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    // 15ms per character gives a fast but visible streaming effect
    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (onTyping) onTyping();
      if (index > text.length) {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text, onTyping]);

  return <>{displayedText}</>;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là Trợ lý Y tế. Tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [animatingIndex, setAnimatingIndex] = useState(-1);
  
  const { backendUrl, userData } = useContext(AppContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/chatbot/chat`, {
        query: userMessage,
        conversation_id: conversationId,
        user: userData ? userData._id : "guest-user",
      });

      if (data.success) {
        setMessages(prev => {
          setAnimatingIndex(prev.length);
          return [...prev, { role: 'assistant', content: data.data.answer }];
        });
        if (data.data.conversation_id) {
            setConversationId(data.data.conversation_id);
        }
      } else {
        setMessages(prev => {
          setAnimatingIndex(prev.length);
          return [...prev, { role: 'assistant', content: 'Xin lỗi, tôi đã gặp lỗi. Vui lòng thử lại.' }];
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        setAnimatingIndex(prev.length);
        return [...prev, { role: 'assistant', content: 'Xin lỗi, có vấn đề khi kết nối tới máy chủ.' }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans text-gray-800">
      {isOpen ? (
        <div className="relative w-96 h-[600px] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-xl shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 overflow-hidden shadow-sm flex items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/8050/8050478.png" alt="Doctor Avatar" className="w-[120%] h-[120%] object-cover rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg leading-tight">Trợ lý Y tế</span>
                <span className="text-xs text-blue-100 flex items-center gap-1 font-medium mt-0.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></span> Trực tuyến
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition p-1 hover:bg-blue-700 rounded-full"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full shadow-sm border border-gray-200 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/8050/8050478.png" alt="Avatar" className="w-[120%] h-[120%] object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                  }`}
                >
                  {msg.role === 'assistant' && animatingIndex === idx ? (
                    <Typewriter text={msg.content} onTyping={scrollToBottom} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-end justify-start">
                <div className="w-8 h-8 rounded-full shadow-sm border border-gray-200 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/8050/8050478.png" alt="Avatar" className="w-[120%] h-[120%] object-cover" />
                </div>
                <div className="bg-white text-gray-800 max-w-[75%] p-4 rounded-2xl text-sm rounded-bl-sm shadow-sm border border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhắn tin cho trợ lý y tế..."
              className="flex-1 p-2 px-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              <SendIcon fontSize="small" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <ChatIcon fontSize="large" />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
