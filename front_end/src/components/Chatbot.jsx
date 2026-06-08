import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const parseInline = (text, isUser = false) => {
  if (!text) return '';
  const parts = [];
  const regex = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code 
          key={match.index} 
          className={isUser 
            ? "bg-blue-700 text-blue-100 px-1 py-0.5 rounded font-mono text-xs font-semibold" 
            : "bg-gray-100 text-red-500 px-1.5 py-0.5 rounded font-mono text-xs font-semibold"
          }
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
};

const Markdown = ({ text, isUser = false }) => {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let currentList = null;
  let currentCodeBlock = null;

  const commitCurrentList = (key) => {
    if (currentList) {
      const ListTag = currentList.type;
      const listClass = currentList.type === 'ul' ? 'list-disc pl-5 mb-2 space-y-1' : 'list-decimal pl-5 mb-2 space-y-1';
      blocks.push(
        <ListTag key={key} className={listClass}>
          {currentList.items.map((item, i) => (
            <li key={i}>{parseInline(item, isUser)}</li>
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  const commitCodeBlock = (key) => {
    if (currentCodeBlock) {
      blocks.push(
        <pre key={key} className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 font-mono text-xs max-w-full">
          <code>{currentCodeBlock.code.join('\n')}</code>
        </pre>
      );
      currentCodeBlock = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (currentCodeBlock) {
        commitCodeBlock(`code-${i}`);
      } else {
        commitCurrentList(`list-${i}`);
        currentCodeBlock = { code: [] };
      }
      continue;
    }

    if (currentCodeBlock) {
      currentCodeBlock.code.push(line);
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      commitCurrentList(`list-${i}`);
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const HeaderTag = `h${level}`;
      const headerClasses = {
        1: 'text-xl font-extrabold my-2 border-b pb-1 border-gray-200',
        2: 'text-lg font-bold my-2',
        3: 'text-base font-bold my-1.5',
        4: 'text-sm font-semibold my-1',
        5: 'text-xs font-semibold my-1',
        6: 'text-xs font-medium my-1 text-gray-500'
      };

      blocks.push(
        <HeaderTag key={`h-${i}`} className={headerClasses[level] || 'font-bold'}>
          {parseInline(content, isUser)}
        </HeaderTag>
      );
      continue;
    }

    const ulMatch = line.match(/^[\*\-\+]\s+(.*)$/);
    if (ulMatch) {
      const content = ulMatch[1];
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(content);
      } else {
        commitCurrentList(`list-${i}`);
        currentList = { type: 'ul', items: [content] };
      }
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      const content = olMatch[1];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(content);
      } else {
        commitCurrentList(`list-${i}`);
        currentList = { type: 'ol', items: [content] };
      }
      continue;
    }

    if (!line.trim()) {
      commitCurrentList(`list-${i}`);
      blocks.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    commitCurrentList(`list-${i}`);
    blocks.push(
      <p key={`p-${i}`} className="mb-2 leading-relaxed">
        {parseInline(line, isUser)}
      </p>
    );
  }

  commitCurrentList('list-end');
  commitCodeBlock('code-end');

  return <div className="markdown-body text-sm space-y-1">{blocks}</div>;
};

const Typewriter = ({ text, onTyping }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (onTyping) onTyping();
      if (index > text.length) {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <Markdown text={displayedText} isUser={false} />;
};

const DEFAULT_MESSAGE = { role: 'assistant', content: 'Xin chào! Tôi là Trợ lý Y tế. Tôi có thể giúp gì cho bạn hôm nay?' };

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState(-1);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const { backendUrl, userData, token } = useContext(AppContext);
  const messagesEndRef = useRef(null);

  // Load lịch sử tin nhắn từ backend khi mở chatbot
  // Backend tự lấy conversationId từ DB user → gọi Dify API GET /v1/messages
  useEffect(() => {
    if (isOpen && !historyLoaded && userData?._id && token) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const { data } = await axios.post(`${backendUrl}/api/chatbot/messages`, {}, {
            headers: { token }
          });

          if (data.success && data.data && data.data.length > 0) {
            // Dify trả messages theo thứ tự mới nhất trước, cần reverse
            const historyMessages = [];
            
            for (const msg of data.data) {
              historyMessages.push({ role: 'user', content: msg.query });
              historyMessages.push({ role: 'assistant', content: msg.answer });
            }
            
            setMessages([DEFAULT_MESSAGE, ...historyMessages]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        } finally {
          setIsLoadingHistory(false);
          setHistoryLoaded(true);
        }
      };
      loadHistory();
    } else if (isOpen && !userData?._id) {
      setHistoryLoaded(true);
    }
  }, [isOpen, historyLoaded, token, backendUrl, userData]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
        user: userData ? userData._id : "guest-user",
      }, {
        headers: { token }
      });

      if (data.success) {
        setMessages(prev => {
          setAnimatingIndex(prev.length);
          return [...prev, { role: 'assistant', content: data.data.answer }];
        });
      } else {
        setMessages(prev => {
          setAnimatingIndex(prev.length);
          return [...prev, { role: 'assistant', content: data.message || 'Xin lỗi, có lỗi xảy ra.' }];
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        setAnimatingIndex(prev.length);
        return [...prev, { role: 'assistant', content: 'Xin lỗi, tôi không thể trả lời câu hỏi của bạn!' }];
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
        <>
        {/* Backdrop overlay when expanded */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
            style={{ transition: 'opacity 0.3s ease' }}
          />
        )}
        <div
          className={`relative bg-white flex flex-col overflow-hidden border border-gray-200 shadow-xl ${
            isExpanded
              ? 'fixed inset-4 sm:inset-8 lg:inset-16 z-50 rounded-3xl'
              : 'w-96 h-[600px] rounded-xl'
          }`}
          style={{ transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
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
            <div className="flex items-center gap-1">
              {/* Expand / Collapse button */}
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
              >
                {isExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                  </svg>
                )}
              </button>
              {/* Close button */}
              <button
                onClick={() => { setIsExpanded(false); setIsOpen(false); }}
                className="text-white/70 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
                title="Đóng"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {isLoadingHistory && (
              <div className="flex justify-center items-center py-4">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Đang tải lịch sử trò chuyện...
                </div>
              </div>
            )}
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
                    <Markdown text={msg.content} isUser={msg.role === 'user'} />
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
        </>
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
