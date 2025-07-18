import { apiClient } from './api';
import { APIRequest, PaginatedResponse } from '@/types/api';

export class BillingService {
  // 获取所有聊天记录（管理员专用）
  static async getChatRecords(params?: { 
    page?: number; 
    page_size?: number; 
    search?: string;
    user?: number;
    model?: number;
    status_code?: number;
  }): Promise<PaginatedResponse<APIRequest>> {
    return await apiClient.get('/admin/chat-records/', params);
  }

  // 获取聊天记录详情
  static async getChatRecord(id: number): Promise<APIRequest> {
    return await apiClient.get(`/admin/chat-records/${id}/`);
  }

  // 获取聊天记录统计信息
  static async getChatRecordsStatistics(): Promise<{
    total_requests: number;
    successful_requests: number;
    success_rate: number;
    total_cost: number;
    total_tokens: number;
    avg_duration_ms: number;
    daily_statistics: Array<{
      date: string;
      requests: number;
      cost: number;
      tokens: number;
    }>;
    message: string;
  }> {
    return await apiClient.get('/admin/chat-records/statistics/');
  }
} 