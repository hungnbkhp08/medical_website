import React from 'react';
import { Navigate } from 'react-router-dom';

// Component bảo vệ route yêu cầu người dùng phải đăng nhập
export const ProtectedRoute = ({ children, token }) => {
  if (!token) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};
