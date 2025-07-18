import { apiClient } from './api';
import { ModelGroup, PaginatedResponse } from '@/types';

export interface ModelGroupCreateRequest {
  name: string;
  description?: string;
  model_ids: number[];
  is_active?: boolean;
}

export interface ModelGroupUpdateRequest extends Partial<ModelGroupCreateRequest> {}

export class ModelGroupService {
  // 获取模型组列表
  static async getModelGroups(params?: { 
    page?: number; 
    page_size?: number; 
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<ModelGroup>> {
    return await apiClient.get('/admin/model-groups/', params);
  }

  // 获取模型组详情
  static async getModelGroup(id: number): Promise<ModelGroup> {
    return await apiClient.get(`/admin/model-groups/${id}/`);
  }

  // 创建模型组
  static async createModelGroup(data: ModelGroupCreateRequest): Promise<ModelGroup> {
    return await apiClient.post('/admin/model-groups/', data);
  }

  // 更新模型组
  static async updateModelGroup(id: number, data: ModelGroupUpdateRequest): Promise<ModelGroup> {
    return await apiClient.put(`/admin/model-groups/${id}/`, data);
  }

  // 删除模型组
  static async deleteModelGroup(id: number): Promise<void> {
    await apiClient.delete(`/admin/model-groups/${id}/`);
  }

  // 获取模型组中的模型
  static async getModelGroupModels(id: number, params?: { page?: number; page_size?: number }) {
    return await apiClient.get(`/admin/model-groups/${id}/models/`, params);
  }

  // 添加模型到模型组
  static async addModelsToGroup(id: number, modelIds: number[]): Promise<{ success: boolean; message: string }> {
    return await apiClient.post(`/admin/model-groups/${id}/add-models/`, { model_ids: modelIds });
  }

  // 从模型组中移除模型
  static async removeModelsFromGroup(id: number, modelIds: number[]): Promise<{ success: boolean; message: string }> {
    return await apiClient.post(`/admin/model-groups/${id}/remove-models/`, { model_ids: modelIds });
  }
} 