import { apiClient } from './api';

export interface DashboardStats {
  totalUsers: number;
  totalQuotas: number;
  totalCost: number;
  activeModels: number;
}

export interface UsageData {
  date: string;
  requests: number;
  cost: number;
}

export interface ModelUsageData {
  name: string;
  value: number;
  color: string;
}

export class DashboardService {
  // 获取仪表盘统计数据
  static async getDashboardStats() {
    return await apiClient.get('/dashboard/stats/');
  }

  // 获取管理员统计
  static async getAdminStats() {
    return await apiClient.get('/admin/dashboard/stats/');
  }

  // 获取用户统计
  static async getUserStats() {
    return await apiClient.get('/user/dashboard/stats/');
  }

  // 获取使用量数据（暂时返回模拟数据，后续可以从后端API获取）
  static async getUsageData(): Promise<UsageData[]> {
    // 模拟数据 - 后续可以从后端API获取真实数据
    return [
      { date: '2024-01-01', requests: 120, cost: 0.45 },
      { date: '2024-01-02', requests: 150, cost: 0.67 },
      { date: '2024-01-03', requests: 89, cost: 0.32 },
      { date: '2024-01-04', requests: 200, cost: 0.89 },
      { date: '2024-01-05', requests: 178, cost: 0.76 },
      { date: '2024-01-06', requests: 234, cost: 1.12 },
      { date: '2024-01-07', requests: 190, cost: 0.94 },
    ];
  }

  // 获取模型使用分布（暂时返回模拟数据）
  static async getModelUsageData(): Promise<ModelUsageData[]> {
    return [
      { name: 'GPT-4', value: 45, color: '#8884d8' },
      { name: 'GPT-3.5', value: 30, color: '#82ca9d' },
      { name: 'Claude', value: 15, color: '#ffc658' },
      { name: 'Gemini', value: 10, color: '#ff7300' },
    ];
  }

  // 获取成本趋势数据（暂时返回模拟数据）
  static async getCostTrendData(): Promise<Array<{ month: string; cost: number }>> {
    return [
      { month: '10月', cost: 128.5 },
      { month: '11月', cost: 156.8 },
      { month: '12月', cost: 189.2 },
      { month: '1月', cost: 234.6 },
    ];
  }
} 