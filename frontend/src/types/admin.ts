export interface LifetimeStats {
  total_users: number;
  total_journals: number;
  total_chats: number;
  verified_users: number;
}

export interface SummaryStats {
  lifetime: LifetimeStats;
  signups_current_period: number;
  signups_prev_period: number;
  active_users_period: number;
  active_users_prev_period: number;
  journals_current_period: number;
  journals_prev_period: number;
  chats_current_period: number;
  chats_prev_period: number;
}

export interface DailySignup {
  date: string;
  count: number;
}

export interface AcquisitionStats {
  signups_today: number;
  signups_period: number;
  google_oauth_count: number;
  email_password_count: number;
  verified_count: number;
  unverified_stale_count: number;
  daily_signups: DailySignup[];
}

export interface EngagementStats {
  wau: number;
  mau: number;
  stickiness: number;
  returning_users: number;
  return_rate: number;
  engaged_users: number;
  avg_entries_per_active_user: number;
  avg_journal_length: number;
}

export interface AdminStatsResponse {
  period: string;
  period_days: number;
  summary: SummaryStats;
  acquisition: AcquisitionStats;
  engagement: EngagementStats;
}

export interface UserItemSchema {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  auth_provider: string;
  login_count: number;
  journal_count: number;
  chat_count: number;
  created_at: string;
  last_login?: string | null;
}

export type UserItem = UserItemSchema;

export interface UserStatusUpdate {
  is_active: boolean;
}

export interface UserListResponse {
  total: number;
  skip: number;
  limit: number;
  users: UserItemSchema[];
}

export interface LiteLLMParams {
  model: string;
  api_base?: string | null;
  api_key?: string | null;
  rpm?: number | null;
  tpm?: number | null;
}

export interface ProviderConfig {
  id?: string | null;
  model_name: string;
  litellm_params: LiteLLMParams;
  order?: number | null;
  is_active: boolean;
}

export interface ProviderTestResult {
  index: number;
  model: string;
  status: string;
  latency: number;
  details: string;
}

export interface DiagnosticsResponse {
  total_models: number;
  working_models: number;
  failed_models: number;
  results: ProviderTestResult[];
}
