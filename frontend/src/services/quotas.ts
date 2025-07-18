import { apiClient } from './api';
import { Quota, QuotaCreateRequest, QuotaUpdateRequest } from '@/types';
import { UserQuotasResponse } from '@/types/api';

export interface QuotaListParams {
  page?: number;
  page_size?: number;
  user_id?: number;
  model_group_id?: number;
}

export interface QuotaRequestParams {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface QuotaLogParams {
  page?: number;
  page_size?: number;
  quota_id?: number;
}

export interface QuotaAlertParams {
  page?: number;
  page_size?: number;
  quota_id?: number;
  user_id?: number;
  is_resolved?: boolean;
}

export class QuotaService {
  // 获取配额列表（管理员）
  static async getQuotas(params?: { page?: number; page_size?: number; search?: string }) {
    return await apiClient.get('/admin/quotas/', params);
  }

  // 获取配额详情
  static async getQuota(id: number): Promise<Quota> {
    return await apiClient.get(`/admin/quotas/${id}/`);
  }

  // 创建配额
  static async createQuota(data: QuotaCreateRequest): Promise<Quota> {
    return await apiClient.post('/admin/quotas/', data);
  }

  // 更新配额
  static async updateQuota(id: number, data: QuotaUpdateRequest): Promise<Quota> {
    return await apiClient.put(`/admin/quotas/${id}/`, data);
  }

  // 删除配额
  static async deleteQuota(id: number): Promise<void> {
    await apiClient.delete(`/admin/quotas/${id}/`);
  }

  // 重置API密钥
  static async resetApiKey(quotaId: number): Promise<{ api_key: string }> {
    return await apiClient.post(`/admin/quotas/${quotaId}/reset_api_key/`);
  }

  // 获取配额统计
  static async getQuotaStats(quotaId: number) {
    return await apiClient.get(`/admin/quotas/${quotaId}/stats/`);
  }

  // 获取配额使用记录
  static async getQuotaUsageRecords(quotaId: number, params?: { page?: number; page_size?: number }) {
    return await apiClient.get(`/admin/quotas/${quotaId}/usage-records/`, params);
  }

  // 获取用户的配额（用户端）
  static async getUserQuotas(params?: { page?: number; page_size?: number }): Promise<UserQuotasResponse> {
    return await apiClient.get('/quotas/', params);
  }

  // 用户查看自己的完整API Key
  static async getUserApiKey(quotaId: number): Promise<{ quota_id: number; model_group: string; api_key: string; masked_api_key: string }> {
    return await apiClient.get(`/quotas/${quotaId}/api_key/`);
  }

  // 用户重置自己的API Key
  static async resetUserApiKey(quotaId: number): Promise<{ quota_id: number; model_group: string; api_key: string; masked_api_key: string; message: string }> {
    return await apiClient.post(`/quotas/${quotaId}/reset_api_key/`);
  }
} 