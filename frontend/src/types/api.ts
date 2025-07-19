// 基础API响应类型
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, any>;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  quota_count: number;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  name: string;
  password: string;
  password_confirm: string;
  is_super_admin?: boolean;
  is_active?: boolean;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  name?: string;
  is_super_admin?: boolean;
  is_active?: boolean;
}

// 配额相关类型
export interface UserQuota {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  model_group: number;
  model_group_name: string;
  api_key: string;
  masked_api_key: string;
  total_quota: string;
  used_quota: string;
  remaining_quota: string;
  usage_percentage: number;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  total_quota?: string;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  is_active?: boolean;
}

export interface UserQuotasResponse {
  user: string;
  quotas: Array<{
    id: number;
    name: string;
    description: string;
    model_group: string;
    model_group_description: string;
    masked_api_key: string;
    total_quota: string;
    used_quota: string;
    remaining_quota: string;
    usage_percentage: number;
    is_active: boolean;
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
  }>;
}

// API请求记录类型
export interface APIRequest {
  id: number;
  request_id: string;
  user: number;
  user_name: string;
  model: number | null;  // 可能为 null（当模型被删除时）
  model_group: number | null;  // 可能为 null（当模型组被删除时）
  
  // 快照字段（保留原始信息）
  model_name: string;
  model_provider_name: string;
  model_group_name: string;
  
  // 显示字段（优先使用快照，fallback 到外键）
  model_name_display: string;
  model_display_name: string;
  model_provider_name_display: string;
  model_group_name_display: string;
  
  method: string;
  endpoint: string;
  request_data: Record<string, any>;
  response_data: Record<string, any>;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: string;
  output_cost: string;
  total_cost: string;
  status_code: number;
  duration_ms: number;
  duration_seconds: number;
  is_successful: boolean;
  ip_address: string;
  user_agent: string;
  error_type?: string;
  error_message?: string;
  created_at: string;
}

export interface QuotaRequestsResponse {
  quota_info: {
    id: number;
    user: string;
    model_group: string;
    total_quota: string;
    used_quota: string;
    remaining_quota: string;
  };
  requests: APIRequest[];
  pagination: {
    count: number;
    page: number;
    pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface QuotaStatistics {
  total_requests: number;
  total_cost: string;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  avg_duration: number;
  success_requests: number;
  success_rate: number;
}

// 配额日志类型
export interface QuotaUsageLog {
  id: number;
  quota: number;
  user_name: string;
  model_group_name: string;
  action: string;
  amount: string;
  remaining: string;
  request_id: string;
  notes: string;
  created_at: string;
}

// 配额警告类型
export interface QuotaAlert {
  id: number;
  quota: number;
  user_name: string;
  model_group_name: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

// OpenAI兼容接口类型
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  permission: any[];
}

export interface ModelsListResponse {
  object: 'list';
  data: ModelInfo[];
}

export interface UsageResponse {
  quota: {
    total_quota: number;
    used_quota: number;
    remaining_quota: number;
    model_group: string;
    period_type: string;
    expires_at: string | null;
  };
  recent_requests: number;
  recent_cost: number;
} 