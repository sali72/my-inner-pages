import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../api';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
  captureEvent: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  authService: {
    refreshToken: vi.fn(),
  },
}));

describe('API Client Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('parses single string error detail from response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ detail: 'Invalid payload format' }),
    }));

    try {
      await api.get('/test');
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.message).toBe('Invalid payload format');
    }
  });

  it('formats validation array error details cleanly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({
        detail: [
          { loc: ['body', 'email'], msg: 'Field required', type: 'value_error.missing' },
          { loc: ['body', 'password'], msg: 'Too short', type: 'value_error' },
        ],
      }),
    }));

    try {
      await api.post('/test', {});
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.message).toBe('Field required; Too short');
    }
  });

  it('handles 429 rate limit response', async () => {
    const sonner = await import('sonner');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ detail: 'Rate limit exceeded' }),
    }));

    try {
      await api.get('/rate-limited');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(sonner.toast.error).toHaveBeenCalledWith('Too many requests — please slow down');
    }
  });

  it('handles 204 No Content response properly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
    }));

    const result = await api.delete('/item/123');
    expect(result).toEqual({});
  });
});
