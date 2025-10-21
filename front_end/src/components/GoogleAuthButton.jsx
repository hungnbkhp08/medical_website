// src/components/GoogleAuthButton.jsx
import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

const GoogleAuthButton = ({ type = 'login', backendUrl, setToken }) => {
  const navigate = useNavigate();

  // Xử lý khi đăng nhập/đăng ký Google thành công
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const endpoint = type === 'signup' 
        ? `${backendUrl}/api/user/google-signup`
        : `${backendUrl}/api/user/google-login`;

      const { data } = await axios.post(endpoint, {
        credential: credentialResponse.credential,
      });

      if (data.success) {
        if (type === 'login') {
          localStorage.setItem('token', data.token);
          setToken?.(data.token);
          toast.success('Đăng nhập bằng Google thành công');
          navigate('/');
        } else {
          localStorage.setItem('token', data.token);
          setToken?.(data.token);
          toast.success('Đăng ký bằng Google thành công');
          navigate('/');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || `${type === 'signup' ? 'Đăng ký' : 'Đăng nhập'} bằng Google thất bại`);
    }
  };

  const handleGoogleError = () => {
    toast.error(`${type === 'signup' ? 'Đăng ký' : 'Đăng nhập'} bằng Google thất bại`);
  };

  return (
    <div className="w-full mt-4">
      {/* Divider */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 text-sm">HOẶC</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Google Login Button - Custom styled */}
      <div className="google-login-wrapper w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          theme="outline"
          size="large"
          text={type === 'signup' ? 'signup_with' : 'signin_with'}
          width="100%"
          locale="vi"
        />
      </div>

      {/* Custom Styled Button as fallback or alternative */}
      <style jsx>{`
        .google-login-wrapper {
          display: flex;
          justify-content: center;
        }
        .google-login-wrapper > div {
          width: 100% !important;
        }
        .google-login-wrapper iframe {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthButton;
