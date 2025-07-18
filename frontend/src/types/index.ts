// 用户相关类型
export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  name: string; // 后端返回的显示名称
  quota_count: number;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_super_admin: boolean; // 后端主要使用这个字段
  date_joined?: string;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

// 配额相关类型
export interface Quota {
  id: number;
  name: string;
  description: string;
  user: number;
  user_name: string;
  user_email: string;
  model_group: number;
  model_group_name: string;
  total_quota: string;
  used_quota: string;
  remaining_quota: string;
  usage_percentage: number;
  api_key: string;
  masked_api_key: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserQuota {
  id: number;
  name: string;
  description: string;
  user: number;
  user_name: string;
  user_email: string;
  model_group: number;
  model_group_name: string;
  model_group_description: string;
  total_quota: string;
  used_quota: string;
  remaining_quota: string;
  api_key: string;
  masked_api_key: string;
  usage_percentage: number;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  model_count: number;
  models: Array<{
    id: number;
    name: string;
    display_name: string;
    provider_name: string;
    model_type: string;
    context_length: number;
    input_price_per_1m: string;
    output_price_per_1m: string;
    capabilities: any;
  }>;
}

export interface QuotaCreateRequest {
  name: string;
  description?: string;
  user: number;
  model_group: number;
  total_quota: string;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  is_active?: boolean;
}

export interface QuotaUpdateRequest {
  name?: string;
  description?: string;
  model_group?: number;
  total_quota?: string;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  is_active?: boolean;
}

export interface UserQuotasResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Quota[];
}

// API提供商类型
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

// AI模型类型
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

// 模型组类型
export interface ModelGroup {
  id: number;
  name: string;
  description: string;
  model_ids: number[];
  default_quota: string;
  is_public: boolean;
  allowed_users: number[];
  is_active: boolean;
  model_count: number;
  model_names: string[];
  models_info: Array<{
    id: number;
    name: string;
    display_name: string;
    provider_name: string;
  }>;
  created_at: string;
  updated_at: string;
}

// 认证相关类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

// 通用分页响应类型
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// 表格分页参数
export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
}

// API响应错误类型
export interface APIError {
  message: string;
  code?: string;
  details?: any;
} 