import { create } from 'zustand';
import { User } from '@/types';
import { AuthService } from '@/services';
import { message } from 'antd';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await AuthService.login({ email, password });
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      message.success('登录成功');
    } catch (error: any) {
      set({ isLoading: false });
      
      // 处理不同类型的错误
      let errorMessage = '登录失败';
      
      if (error.response?.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      message.success('已退出登录');
    } catch (error) {
      // 即使API调用失败，也要清除本地状态
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: () => {
    const isAuthenticated = AuthService.isAuthenticated();
    const user = AuthService.getCurrentUser();
    
    set({
      isAuthenticated,
      user,
    });

    // 如果已认证，初始化API客户端
    if (isAuthenticated) {
      AuthService.initializeAuth();
    }
  },

  updateUser: (user: User) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
})); 