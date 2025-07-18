import { apiClient } from './api';
import { 
  User, 
  UserCreateRequest, 
  UserUpdateRequest, 
  PaginatedResponse,
  UserQuotasResponse 
} from '@/types';

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export class UserService {
  // 获取用户列表（管理员）
  static async getUsers(params?: UserListParams): Promise<PaginatedResponse<User>> {
    return await apiClient.get<PaginatedResponse<User>>('/admin/users/', params);
  }

  // 获取用户详情（管理员）
  static async getUser(id: number): Promise<User> {
    return await apiClient.get<User>(`/admin/users/${id}/`);
  }

  // 创建用户（管理员）
  static async createUser(userData: UserCreateRequest): Promise<User> {
    return await apiClient.post<User>('/admin/users/', userData);
  }

  // 更新用户（管理员）
  static async updateUser(id: number, userData: UserUpdateRequest): Promise<User> {
    return await apiClient.put<User>(`/admin/users/${id}/`, userData);
  }

  // 删除用户（管理员）
  static async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}/`);
  }

  // 重置用户密码（管理员）
  static async resetUserPassword(id: number, newPassword: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/reset-password/`, {
      new_password: newPassword,
    });
  }

  // 重置用户所有API Key（管理员）
  static async resetUserAllKeys(userId: number): Promise<{
    user_id: number;
    user_name: string;
    user_email: string;
    updated_keys: Array<{
      quota_id: number;
      model_group: string;
      old_key: string;
      new_key: string;
    }>;
    message: string;
  }> {
    return await apiClient.post(`/admin/users/${userId}/reset-all-keys/`);
  }

  // 获取当前用户的配额信息
  static async getUserQuotas(): Promise<UserQuotasResponse> {
    return await apiClient.get<UserQuotasResponse>('/quotas/');
  }
} 