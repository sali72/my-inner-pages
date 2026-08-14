export interface UserPreferencesResponse {
  mode: string;
  accent: string;
  fontStyle: string;
  fontSize: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string | null;
  login_count?: number;
  preferences?: UserPreferencesResponse | null;
  feedback_triggers?: Record<string, boolean>;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface SessionResponse {
  family_id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address?: string | null;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total_count: number;
}
