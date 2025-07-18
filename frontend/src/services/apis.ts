import { apiClient } from './api';

export interface APIProvider {
  id: number;
  name: string;
  description: string;
  base_url: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIProviderCreateRequest {
  name: string;
  description?: string;
  base_url: string;
  api_key: string;
  is_active?: boolean;
}

export interface APIProviderUpdateRequest {
  name?: string;
  description?: string;
  base_url?: string;
  api_key?: string;
  is_active?: boolean;
}

export class APIProviderService {
  // 获取API提供商列表
  static async getProviders(params?: { page?: number; page_size?: number; search?: string }) {
    return await apiClient.get('/admin/providers/', params);
  }

  // 获取API提供商详情
  static async getProvider(id: number): Promise<APIProvider> {
    return await apiClient.get(`/admin/providers/${id}/`);
  }

  // 创建API提供商
  static async createProvider(data: APIProviderCreateRequest): Promise<APIProvider> {
    return await apiClient.post('/admin/providers/', data);
  }

  // 更新API提供商
  static async updateProvider(id: number, data: APIProviderUpdateRequest): Promise<APIProvider> {
    return await apiClient.put(`/admin/providers/${id}/`, data);
  }

  // 删除API提供商
  static async deleteProvider(id: number): Promise<void> {
    await apiClient.delete(`/admin/providers/${id}/`);
  }

  // 测试API提供商连接
  static async testProvider(id: number): Promise<{ success: boolean; message: string }> {
    return await apiClient.post(`/admin/providers/${id}/test/`);
  }

  // 同步模型
  static async syncModels(id: number): Promise<{ success: boolean; message: string; models_count: number }> {
    return await apiClient.post(`/admin/providers/${id}/sync_models/`);
  }
} 