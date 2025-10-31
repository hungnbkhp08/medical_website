import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          {/* Icon */}
          <div className="bg-red-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="text-8xl font-bold text-red-600 mb-4">403</h1>

          {/* Error Message */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập để tiếp tục.
          </p>

          {/* Suggestions */}
          <div className="bg-red-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Có thể do:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Tài khoản của bạn không có quyền truy cập trang này</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Đường dẫn không tồn tại hoặc đã bị thay đổi</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 text-gray-800 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all shadow-lg hover:shadow-xl"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
