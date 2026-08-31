import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../authService';

describe('authService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('checkStatus returns user when /auth/verify succeeds', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', is_verified: true, role: 'user' };
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const result = await authService.checkStatus();
    expect(result).toEqual(mockUser);
  });

  it('checkStatus attempts refreshToken when /auth/verify returns 401 and returns refreshed user', async () => {
    const mockRefreshedUser = { id: 'user-123', email: 'test@example.com', is_verified: true, role: 'user' };
    
    globalThis.fetch = vi.fn()
      // First call: /auth/verify returns 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Token expired' }),
      })
      // Second call from silent refresh: /auth/refresh returns 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'new-access-token',
          token_type: 'bearer',
          user: mockRefreshedUser,
        }),
      })
      // Third call (retry of /auth/verify) returns 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRefreshedUser,
      });

    const result = await authService.checkStatus();
    expect(result).toEqual(mockRefreshedUser);
  });

  it('checkStatus returns null when both /auth/verify and /auth/refresh fail with 401', async () => {
    globalThis.fetch = vi.fn()
      // First call: /auth/verify returns 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Token expired' }),
      })
      // Second call: /auth/refresh returns 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Refresh token expired' }),
      })
      // Third call (retry of refresh in checkStatus fallback) returns 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Refresh token expired' }),
      });

    const result = await authService.checkStatus();
    expect(result).toBeNull();
  });
});
