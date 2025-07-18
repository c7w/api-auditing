import { apiClient } from './api';
import { LoginRequest, LoginResponse, PasswordChangeRequest, User } from '@/types';

export class AuthService {
  // 用户登录
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('开始登录，发送的数据:', credentials);
    
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
      console.log('登录响应:', response);
      
      // 检查响应数据
      if (!response.access_token || !response.user) {
        console.error('登录响应缺少必要字段:', response);
        throw new Error('登录响应数据不完整');
      }
      
      // 存储token和用户信息
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // 设置API客户端的认证token
      apiClient.setAuthToken(response.access_token);
      console.log('登录成功，token已设置');
      
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 存储登录凭证
  static storeAuthData(response: LoginResponse) {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // 设置API客户端的认证头
    apiClient.setAuthToken(response.access_token);
  }

  // 用户登出
  static async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout/', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      // 即使登出API失败，也要清除本地存储
      console.error('Logout API failed:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // 清除API客户端的认证token
      apiClient.clearAuthToken();
    }
  }

  // 修改密码
  static async changePassword(data: PasswordChangeRequest): Promise<void> {
    await apiClient.post('/auth/change-password/', data);
  }

  // 获取用户资料
  static async getProfile(): Promise<User> {
    return await apiClient.get<User>('/profile/');
  }

  // 更新用户资料
  static async updateProfile(data: Partial<User>): Promise<User> {
    return await apiClient.put<User>('/profile/', data);
  }

  // 获取当前用户信息（从localStorage）
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 检查是否为超级管理员
  static isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_super_admin || false;
  }

  // 初始化认证状态（应用启动时调用）
  static initializeAuth(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      apiClient.setAuthToken(token);
    }
  }

  // 清除所有认证数据（调试用）
  static clearAllAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    apiClient.clearAuthToken();
    console.log('所有认证数据已清除');
  }
} 