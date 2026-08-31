import type {
  UserResponse,
  LoginResponse,
  SessionResponse,
  SessionListResponse,
} from '@/types';

export type { UserResponse, LoginResponse, SessionResponse, SessionListResponse };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });
  if (!response.ok) {
    if (response.status === 401 && !isRetry) {
      const isAuthEndpoint =
        path.includes('/auth/refresh') ||
        path.includes('/auth/login') ||
        path.includes('/auth/register');

      if (!isAuthEndpoint) {
        if (isRefreshing) {
          const refreshed = await new Promise<boolean>((resolve) => {
            subscribeTokenRefresh(resolve);
          });
          if (refreshed) {
            return request<T>(path, options, true);
          }
        } else {
          isRefreshing = true;
          try {
            await authService.refreshToken();
            isRefreshing = false;
            onRefreshed(true);
            return request<T>(path, options, true);
          } catch {
            isRefreshing = false;
            onRefreshed(false);
          }
        }
      }
    }

    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((err: any) => err.msg || JSON.stringify(err)).join('; ');
      } else if (typeof body.message === 'string') {
        detail = body.message;
      } else if (typeof body.error === 'string') {
        detail = body.error;
      } else if (body.detail && typeof body.detail === 'object') {
        detail = JSON.stringify(body.detail);
      }
    } catch (error) {
      console.error('Failed to parse error response body:', error);
    }
    throw new Error(detail);
  }
  return response.json();
}

export const authService = {
  async checkStatus(): Promise<UserResponse | null> {
    try {
      return await request<UserResponse>('/auth/verify');
    } catch {
      try {
        const refreshed = await authService.refreshToken();
        return refreshed.user;
      } catch {
        return null;
      }
    }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async refreshToken(): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/refresh', {
      method: 'POST',
    });
  },

  async getSessions(): Promise<SessionListResponse> {
    return request<SessionListResponse>('/auth/sessions');
  },

  async revokeSession(familyId: string): Promise<void> {
    await request(`/auth/sessions/${familyId}`, { method: 'DELETE' });
  },

  async revokeOtherSessions(): Promise<void> {
    await request('/auth/sessions/revoke-others', { method: 'POST' });
  },

  async register(email: string, password: string, confirmPassword: string): Promise<void> {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with local cleanup even if the server request fails.
    }
  },

  async verifyEmail(token: string): Promise<void> {
    await request(`/auth/verify-email/${token}`, { method: 'GET' });
  },

  async resendVerification(email: string): Promise<void> {
    await request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string): Promise<void> {
    await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
