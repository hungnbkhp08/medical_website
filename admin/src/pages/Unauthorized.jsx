import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          {/* Icon */}
          <div className="bg-red-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <ShieldAlert className="w-16 h-16 text-red-600" />
          </div>

          {/* Error Code */}
          <h1 className="text-8xl font-bold text-red-600 mb-4">403</h1>

          {/* Error Message */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản phù hợp.
          </p>

          {/* Suggestions */}
          <div className="bg-red-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
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

          {/* Action Button */}
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
