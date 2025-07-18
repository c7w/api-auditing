import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';

export class ApiClient {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证头
    this.axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 错误处理
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token过期或无效，清除本地存储
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // 只有在不是登录页面时才跳转
          if (!window.location.pathname.includes('/login')) {
            // 使用 React Router 的方式跳转，而不是直接修改 window.location
            window.dispatchEvent(new CustomEvent('auth-error'));
          }
        } else if (error.response?.status >= 500) {
          message.error('服务器错误，请稍后重试');
        } else if (error.response?.data?.error) {
          message.error(error.response.data.error);
        } else if (error.response?.data?.detail) {
          message.error(error.response.data.detail);
        }
        return Promise.reject(error);
      }
    );
  }

  // 通用请求方法
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.axios.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.axios.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.axios.put(url, data);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.axios.patch(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.axios.delete(url);
    return response.data;
  }

  // 设置认证token
  setAuthToken(token: string) {
    this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // 清除认证token
  clearAuthToken() {
    delete this.axios.defaults.headers.common['Authorization'];
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(); 