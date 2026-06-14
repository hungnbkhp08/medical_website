import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const parseInline = (text, isUser = false) => {
  if (!text) return '';
  const parts = [];
  const regex = /(\[[^\]]+\]\([^)]+\)|`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('[') && token.includes('](')) {
      const closingBracket = token.indexOf('](');
      const linkText = token.slice(1, closingBracket);
      const url = token.slice(closingBracket + 2, -1);
      parts.push(
        <a 
          key={match.index} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-700 underline font-medium"
        >
          {linkText}
        </a>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
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

const HumanInputForm = ({ msg, onSubmitted, backendUrl, token, userData }) => {
  const [formValues, setFormValues] = useState(msg.resolvedDefaultValues || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(msg.submitted || false);
  const [error, setError] = useState('');

  const handleActionClick = async (actionId) => {
    setIsSubmitting(true);
    setError('');
    try {
      await axios.post(
        `${backendUrl}/api/chatbot/form/human_input/${msg.formToken}`,
        {
          inputs: formValues,
          action: actionId,
          user: userData ? userData._id : "guest-user"
        },
        {
          headers: { token }
        }
      );

      setSubmitted(true);
      onSubmitted({
        taskId: msg.taskId,
        actionId: actionId,
        formValues: formValues
      });
    } catch (err) {
      console.error("Error submitting human input form:", err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-gray-600 text-xs italic">
        Đã gửi xác nhận. Đang tiếp tục xử lý...
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col gap-3 text-gray-800">
      <div className="text-sm font-semibold text-blue-800 flex items-center gap-1.5 border-b pb-2">
        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
        Yêu cầu phản hồi từ bạn
      </div>
      
      <div className="text-xs whitespace-pre-line text-gray-700 bg-gray-50 p-2.5 rounded-lg font-medium leading-relaxed">
        {msg.formContent}
      </div>

      {msg.inputs && msg.inputs.map((input, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-0.5">
            {input.label || input.output_variable_name}
            {input.required && <span className="text-red-500">*</span>}
          </label>
          {input.type === 'paragraph' ? (
            <textarea
              value={formValues[input.output_variable_name] || ''}
              onChange={(e) => setFormValues(prev => ({ ...prev, [input.output_variable_name]: e.target.value }))}
              className="border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[60px]"
              disabled={isSubmitting}
            />
          ) : (
            <input
              type="text"
              value={formValues[input.output_variable_name] || ''}
              onChange={(e) => setFormValues(prev => ({ ...prev, [input.output_variable_name]: e.target.value }))}
              className="border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              disabled={isSubmitting}
            />
          )}
        </div>
      ))}

      {error && <div className="text-xs text-red-500 font-semibold">{error}</div>}

      <div className="flex gap-2 justify-end mt-1">
        {msg.actions && msg.actions.map((act, idx) => (
          <button
            key={idx}
            onClick={() => handleActionClick(act.id)}
            disabled={isSubmitting}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${
              act.button_style === 'primary' || act.button_style === 'default'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : act.button_style === 'warning'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : act.button_style === 'danger'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border'
            }`}
          >
            {act.title}
          </button>
        ))}
      </div>
    </div>
  );
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
  
  const { backendUrl, userData, token, loadUserProfileData } = useContext(AppContext);
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

  const handleResumeWorkflow = async (taskId) => {
    setIsLoading(true);

    try {
        const response = await fetch(`${backendUrl}/api/chatbot/workflow/${taskId}/events?user=${userData ? userData._id : "guest-user"}&continue_on_pause=true`, {
            headers: { 
                token,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            throw new Error('Lỗi kết nối stream');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let buffer = '';

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataPayload = line.slice(6).trim();
                        if (!dataPayload) continue;

                        try {
                            const eventData = JSON.parse(dataPayload);
                            
                            if (eventData.event === 'error') {
                                setIsLoading(false);
                                setMessages(prev => {
                                    const nextMsgs = [...prev];
                                    nextMsgs.push({ role: 'assistant', content: eventData.message || eventData.code || 'Lỗi xử lý từ máy chủ Dify.' });
                                    return nextMsgs;
                                });
                                break;
                            }

                            // 1. Nhận chunk văn bản
                            if ((eventData.event === 'text_chunk' && eventData.data?.text) || (eventData.event === 'node_chunk' && eventData.data?.text) || (eventData.event === 'message' && eventData.answer)) {
                                setIsLoading(false);
                                setMessages(prev => {
                                    const nextMsgs = [...prev];
                                    const last = nextMsgs[nextMsgs.length - 1];
                                    const text = eventData.event === 'message' ? eventData.answer : eventData.data.text;
                                    if (last && last.role === 'assistant' && last.type !== 'human_input') {
                                        last.content = (last.content || '') + text;
                                    } else {
                                        nextMsgs.push({ role: 'assistant', content: text });
                                    }
                                    return nextMsgs;
                                });
                            }
                            
                            // 2. Nếu tiếp tục bị tạm dừng
                            const status = eventData.status || eventData.data?.status || eventData.metadata?.status;
                            const isPaused = eventData.event === 'workflow_paused' || status === 'paused';
                            const isHumanInputEvent = eventData.event === 'human_input_required';
                            
                            if (isPaused || isHumanInputEvent) {
                                const taskIdToResume = eventData.workflow_run_id || eventData.data?.workflow_run_id || eventData.task_id || eventData.data?.task_id || eventData.data?.id || eventData.metadata?.task_id;
                                let reason = null;
                                
                                if (eventData.event === 'human_input_required') {
                                    reason = eventData.data || eventData;
                                } else {
                                    const reasons = eventData.reasons || eventData.data?.reasons || eventData.metadata?.reasons || [];
                                    reason = reasons.find(r => r.type === 'human_input_required' || r.TYPE === 'human_input_required');
                                }
                                
                                if (reason) {
                                    setMessages(prev => {
                                        // Avoid adding duplicate human input forms
                                        const lastMsg = prev[prev.length - 1];
                                        if (lastMsg && lastMsg.type === 'human_input' && lastMsg.formToken === reason.form_token) {
                                            return prev;
                                        }
                                        
                                        return [
                                            ...prev,
                                            {
                                                role: 'assistant',
                                                type: 'human_input',
                                                formToken: reason.form_token,
                                                taskId: taskIdToResume,
                                                formContent: reason.form_content,
                                                inputs: reason.inputs,
                                                actions: reason.actions || reason.user_actions,
                                                resolvedDefaultValues: reason.resolved_default_values,
                                                submitted: false
                                            }
                                        ];
                                    });
                                }
                            }
                        } catch {
                            // Bỏ qua lỗi parse dở dang
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error reading workflow events:", error);
        setMessages(prev => {
            const nextMsgs = [...prev];
            const last = nextMsgs[nextMsgs.length - 1];
            if (last && last.role === 'assistant' && last.type !== 'human_input') {
                last.content = 'Xin lỗi, có lỗi xảy ra trong quá trình nhận phản hồi.';
            }
            return nextMsgs;
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          query: userMessage,
          user: userData ? userData._id : "guest-user",
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối tới máy chủ');
      }

      if (response.status === 202) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Yêu cầu đang được xem xét.' }]);
        setIsLoading(false);
        if (loadUserProfileData) loadUserProfileData();
        return;
      }

      setMessages(prev => {
        setAnimatingIndex(prev.length);
        return [...prev, { role: 'assistant', content: '' }];
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Giữ lại phần chưa hoàn chỉnh sau \n cuối cùng

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataPayload = line.slice(6).trim();
              if (!dataPayload) continue;

              try {
                const eventData = JSON.parse(dataPayload);

                // 1. Nhận lỗi
                if (eventData.event === 'error') {
                  setMessages(prev => {
                    const nextMsgs = [...prev];
                    const last = nextMsgs[nextMsgs.length - 1];
                    if (last && last.role === 'assistant' && last.type !== 'human_input') {
                      last.content = eventData.message || 'Xin lỗi, có lỗi xảy ra.';
                    }
                    return nextMsgs;
                  });
                  break;
                }

                // 2. Nhận chunk văn bản
                if (eventData.event === 'message' && eventData.answer) {
                  setMessages(prev => {
                    const nextMsgs = [...prev];
                    const last = nextMsgs[nextMsgs.length - 1];
                    if (last && last.role === 'assistant' && last.type !== 'human_input') {
                      last.content = (last.content || '') + eventData.answer;
                    }
                    return nextMsgs;
                  });
                } else if (eventData.event === 'text_chunk' && eventData.data?.text) {
                  setMessages(prev => {
                    const nextMsgs = [...prev];
                    const last = nextMsgs[nextMsgs.length - 1];
                    if (last && last.role === 'assistant' && last.type !== 'human_input') {
                      last.content = (last.content || '') + eventData.data.text;
                    }
                    return nextMsgs;
                  });
                }

                // 3. Xử lý workflow paused / human input
                const status = eventData.status || eventData.data?.status || eventData.metadata?.status;
                const isPaused = eventData.event === 'workflow_paused' || status === 'paused';
                const isHumanInputEvent = eventData.event === 'human_input_required';
                
                if (isPaused || isHumanInputEvent) {
                  const taskId = eventData.workflow_run_id || eventData.data?.workflow_run_id || eventData.task_id || eventData.data?.task_id || eventData.data?.id || eventData.metadata?.task_id;
                  let reason = null;
                  
                  if (eventData.event === 'human_input_required') {
                      reason = eventData.data || eventData;
                  } else {
                      const reasons = eventData.reasons || eventData.data?.reasons || eventData.metadata?.reasons || [];
                      reason = reasons.find(r => r.type === 'human_input_required' || r.TYPE === 'human_input_required');
                  }
                  
                  if (reason) {
                    setMessages(prev => {
                      // Avoid adding duplicate human input forms
                      const lastMsg = prev[prev.length - 1];
                      if (lastMsg && lastMsg.type === 'human_input' && lastMsg.formToken === reason.form_token) {
                          return prev;
                      }
                      
                      return [
                        ...prev,
                        {
                          role: 'assistant',
                          type: 'human_input',
                          formToken: reason.form_token,
                          taskId: taskId,
                          formContent: reason.form_content,
                          inputs: reason.inputs,
                          actions: reason.actions || reason.user_actions,
                          resolvedDefaultValues: reason.resolved_default_values,
                          submitted: false
                        }
                      ];
                    });
                  }
                }
              } catch {
                // Bỏ qua lỗi parse dở dang
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const nextMsgs = [...prev];
        const last = nextMsgs[nextMsgs.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          last.content = 'Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này.';
        } else if (last && last.role !== 'assistant') {
          return [...prev, { role: 'assistant', content: 'Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này.' }];
        }
        return nextMsgs;
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
    <>
      {/* ── Expanded fullscreen mode ── */}
      {isOpen && isExpanded && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
          <div
            className="fixed inset-4 sm:inset-8 lg:inset-16 z-[70] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-sm z-10 shrink-0 rounded-t-3xl">
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
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  title="Thu nhỏ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4" />
                  </svg>
                </button>
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
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
              {isLoadingHistory && (
                <div className="flex justify-center items-center py-4">
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Đang tải lịch sử trò chuyện...
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-full shadow-sm border border-gray-200 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img src="https://cdn-icons-png.flaticon.com/512/8050/8050478.png" alt="Avatar" className="w-[120%] h-[120%] object-cover" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] text-sm leading-relaxed break-words ${
                      msg.role === 'user'
                        ? 'p-4 rounded-2xl shadow-sm bg-blue-600 text-white rounded-br-sm'
                        : msg.type === 'human_input'
                          ? 'w-full'
                          : 'p-4 rounded-2xl shadow-sm bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                    }`}
                  >
                    {msg.type === 'human_input' ? (
                      <HumanInputForm
                        msg={msg}
                        onSubmitted={({ taskId }) => {
                          setMessages(prev => {
                            const nextMsgs = [...prev];
                            nextMsgs[idx] = { ...nextMsgs[idx], submitted: true };
                            return nextMsgs;
                          });
                          handleResumeWorkflow(taskId);
                        }}
                        backendUrl={backendUrl}
                        token={token}
                        userData={userData}
                      />
                    ) : msg.role === 'assistant' && animatingIndex === idx ? (
                      <Typewriter text={msg.content} onTyping={scrollToBottom} />
                    ) : (
                      <Markdown text={msg.content} isUser={msg.role === 'user'} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 items-end justify-start">
                  <div className="w-9 h-9 rounded-full shadow-sm border border-gray-200 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/8050/8050478.png" alt="Avatar" className="w-[120%] h-[120%] object-cover" />
                  </div>
                  <div className="bg-white text-gray-800 max-w-[70%] p-4 rounded-2xl text-sm rounded-bl-sm shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-3 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhắn tin cho trợ lý y tế..."
                className="flex-1 p-3 px-4 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <SendIcon fontSize="small" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Normal floating mode ── */}
      <div className="fixed bottom-4 right-4 z-50 font-sans text-gray-800">
        {isOpen && !isExpanded ? (
          <div className="relative w-96 h-[600px] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-xl shadow-sm z-10 shrink-0">
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
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  title="Phóng to"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
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
                    className={`max-w-[75%] text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'p-3 rounded-2xl shadow-sm bg-blue-600 text-white rounded-br-sm'
                        : msg.type === 'human_input'
                          ? 'w-full'
                          : 'p-3 rounded-2xl shadow-sm bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                    }`}
                  >
                    {msg.type === 'human_input' ? (
                      <HumanInputForm
                        msg={msg}
                        onSubmitted={({ taskId }) => {
                          setMessages(prev => {
                            const nextMsgs = [...prev];
                            nextMsgs[idx] = { ...nextMsgs[idx], submitted: true };
                            return nextMsgs;
                          });
                          handleResumeWorkflow(taskId);
                        }}
                        backendUrl={backendUrl}
                        token={token}
                        userData={userData}
                      />
                    ) : msg.role === 'assistant' && animatingIndex === idx ? (
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
            <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2 shrink-0">
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
        ) : !isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            <ChatIcon fontSize="large" />
          </button>
        ) : null}
      </div>
    </>
  );
};

export default Chatbot;
