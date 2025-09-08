import React, { useState } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans text-gray-800">
      {isOpen ? (
        <div className="relative w-96 h-[600px] bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Iframe Dify */}
          <iframe
              src="https://udify.app/chatbot/pJ4jFRAbi6eeSASC"
              style={{ border: 'none', width: '100%', height: '100%' }}
              frameborder="0"
              allow="microphone">
            </iframe>
          {/* Nút đóng ở dưới khung trắng */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 bg-white hover:bg-gray-200 rounded-full p-1 z-10 border shadow-sm"
          >
            <CloseIcon fontSize="small" />
          </button>
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
