import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from '@/stores';
import { AppLayout, ProtectedRoute } from '@/components';

// 页面组件
import { Login } from '@/pages/Auth/Login';
import { Profile } from '@/pages/Profile/Profile';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { UserManagement } from '@/pages/Users/UserManagement';
import { QuotaManagement } from '@/pages/Quotas/QuotaManagement';
import { APIProviderManagement } from '@/pages/APIs/APIProviderManagement';
import { ModelManagement } from '@/pages/Models/ModelManagement';
import { ModelGroupManagement } from '@/pages/ModelGroups/ModelGroupManagement';
import { ChatRecordsManagement } from '@/pages/Billing';

// 主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
    },
  },
};

// 内部组件用于处理认证错误
const AppContent = () => {
  const { checkAuth, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // 监听认证错误事件
    const handleAuthError = () => {
      clearAuth();
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [clearAuth, navigate]);

  return (
    <Routes>
      {/* 登录页面 */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        } 
      />

      {/* 受保护的路由 */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                {/* 默认重定向到仪表盘 */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* 仪表盘 */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* 个人资料 */}
                <Route path="/profile" element={<Profile />} />
                
                {/* 管理员功能 */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/quotas"
                  element={
                    <ProtectedRoute requireAdmin>
                      <QuotaManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/apis"
                  element={
                    <ProtectedRoute requireAdmin>
                      <APIProviderManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/models"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ModelManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/model-groups"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ModelGroupManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat-records"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ChatRecordsManagement />
                    </ProtectedRoute>
                  }
                />

                {/* 404 页面 */}
                <Route path="*" element={<div>页面未找到</div>} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntdApp>
        <Router>
          <AppContent />
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
