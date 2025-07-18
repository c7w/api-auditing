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