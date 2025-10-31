import React from 'react';
import { Navigate } from 'react-router-dom';

// Component bảo vệ route dành cho Admin
export const AdminProtectedRoute = ({ children, aToken }) => {
  if (!aToken) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// Component bảo vệ route dành cho Doctor
export const DoctorProtectedRoute = ({ children, dToken }) => {
  if (!dToken) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};
