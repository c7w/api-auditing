import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 如果需要管理员权限但用户不是管理员，显示无权限页面
  if (requireAdmin && !user?.is_super_admin) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column'
      }}>
        <h3>访问被拒绝</h3>
        <p>您没有权限访问此页面</p>
      </div>
    );
  }

  return <>{children}</>;
}; 