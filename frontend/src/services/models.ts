import { apiClient } from './api';

export interface AIModel {
  id: number;
  provider: number;
  provider_name: string;
  name: string;
  display_name: string;
  description: string;
  input_price_per_1m: string;
  output_price_per_1m: string;
  context_length: number;
  max_output_tokens?: number;
  capabilities: any;
  model_type: string;
  is_active: boolean;
  is_available: boolean;
  external_id: string;
  last_updated_from_api?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelCreateRequest {
  provider: number;
  name: string;
  display_name: string;
  description?: string;
  input_price_per_1m: string;
  output_price_per_1m: string;
  context_length?: number;
  max_output_tokens?: number;
  capabilities?: any;
  model_type?: string;
  is_active?: boolean;
}

export interface ModelUpdateRequest {
  display_name?: string;
  description?: string;
  input_price_per_1m?: string;
  output_price_per_1m?: string;
  context_length?: number;
  max_output_tokens?: number;
  capabilities?: any;
  model_type?: string;
  is_active?: boolean;
  is_available?: boolean;
}

export class ModelService {
  // 获取AI模型列表
  static async getModels(params?: { 
    page?: number; 
    page_size?: number; 
    search?: string;
    provider?: number;
    is_active?: boolean;
  }) {
    return await apiClient.get('/admin/ai-models/', params);
  }

  // 获取AI模型详情
  static async getModel(id: number): Promise<AIModel> {
    return await apiClient.get(`/admin/ai-models/${id}/`);
  }

  // 创建AI模型
  static async createModel(data: ModelCreateRequest): Promise<AIModel> {
    return await apiClient.post('/admin/ai-models/', data);
  }

  // 更新AI模型
  static async updateModel(id: number, data: ModelUpdateRequest): Promise<AIModel> {
    return await apiClient.put(`/admin/ai-models/${id}/`, data);
  }

  // 删除AI模型
  static async deleteModel(id: number): Promise<void> {
    await apiClient.delete(`/admin/ai-models/${id}/`);
  }
} 