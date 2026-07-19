import { toast } from 'sonner';
import { z } from 'zod';
import * as Sentry from '@sentry/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

let consecutiveFailures = 0;

async function request<T>(
    endpoint: string,
    options: RequestInit,
    schema?: z.ZodType<T>,
): Promise<T> {
    const startTime = performance.now();

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string>) },
        });

        const duration = performance.now() - startTime;
        const isAuth = !!localStorage.getItem('authToken');

        if (!response.ok) {
            consecutiveFailures++;

            let detail = response.statusText;
            try {
                const body = await response.json();
                detail = body.detail ?? detail;
            } catch {}

            if (response.status === 401) {
                Sentry.addBreadcrumb({
                    category: 'auth',
                    message: 'Auth token expired',
                    level: 'warning',
                    data: { endpoint, duration_ms: Math.round(duration) },
                });
                localStorage.removeItem('authToken');
                window.dispatchEvent(new CustomEvent('auth:expired'));
            } else if (response.status === 429) {
                toast.error('Too many requests — please slow down');
            }

            if (response.status >= 500) {
                Sentry.captureEvent({
                    message: `Backend 5xx: ${response.status} ${endpoint}`,
                    level: 'error',
                    tags: {
                        endpoint,
                        method: options.method || 'GET',
                        status_code: String(response.status),
                    },
                    extra: {
                        detail,
                        duration_ms: Math.round(duration),
                        consecutive_failures: consecutiveFailures,
                        is_authenticated: isAuth,
                    },
                });
            }

            if (consecutiveFailures >= 3) {
                Sentry.captureEvent({
                    message: `Backend unreachable: ${consecutiveFailures} consecutive failures on ${endpoint}`,
                    level: 'error',
                    tags: {
                        endpoint,
                        method: options.method || 'GET',
                        status_code: String(response.status),
                    },
                    extra: {
                        consecutive_failures: consecutiveFailures,
                        duration_ms: Math.round(duration),
                        is_authenticated: isAuth,
                    },
                });
            }

            throw new ApiError(detail, response.status);
        }

        consecutiveFailures = 0;

        if (duration > 5000) {
            Sentry.addBreadcrumb({
                category: 'performance',
                message: `Slow response: ${endpoint} (${Math.round(duration)}ms)`,
                level: 'warning',
                data: { endpoint, duration_ms: Math.round(duration) },
            });
        }

        const data = await response.json();
        if (schema) {
            return schema.parse(data);
        }
        return data as T;
    } catch (error) {
        const duration = performance.now() - startTime;

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            consecutiveFailures++;
            Sentry.captureEvent({
                message: `Network error fetching ${endpoint}`,
                level: 'error',
                tags: {
                    endpoint,
                    method: options.method || 'GET',
                    error_type: 'network',
                },
                extra: {
                    duration_ms: Math.round(duration),
                    consecutive_failures: consecutiveFailures,
                    is_authenticated: !!localStorage.getItem('authToken'),
                    api_base_url: API_BASE_URL,
                },
            });

            if (consecutiveFailures >= 3) {
                Sentry.captureEvent({
                    message: `Backend down: ${consecutiveFailures} consecutive network failures`,
                    level: 'fatal',
                    tags: { endpoint },
                    extra: { consecutive_failures: consecutiveFailures },
                });
            }
        }

        if (!(error instanceof ApiError)) {
            consecutiveFailures++;
        }

        throw error;
    }
}

export const api = {
    get<T>(endpoint: string, schema?: z.ZodType<T>): Promise<T> {
        return request<T>(endpoint, { method: 'GET' }, schema);
    },

    post<T>(endpoint: string, data: unknown, schema?: z.ZodType<T>): Promise<T> {
        return request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }, schema);
    },

    put<T>(endpoint: string, data: unknown, schema?: z.ZodType<T>): Promise<T> {
        return request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }, schema);
    },

    delete<T>(endpoint: string, schema?: z.ZodType<T>): Promise<T> {
        return request<T>(endpoint, { method: 'DELETE' }, schema);
    },

    patch<T>(endpoint: string, data: unknown, schema?: z.ZodType<T>): Promise<T> {
        return request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }, schema);
    },
};

// --- Shared Zod schemas ---

const isoDatetime = z.string();

export const journalResponseSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    rumination_index: z.number().nullable().optional(),
    created_at: isoDatetime,
    updated_at: isoDatetime,
});

export type JournalResponse = z.infer<typeof journalResponseSchema>;

export const journalListResponseSchema = z.object({
    items: z.array(journalResponseSchema),
    next_cursor: z.string().nullable(),
});

export type JournalListResponse = z.infer<typeof journalListResponseSchema>;

export const messageResponseSchema = z.object({
    message: z.string(),
});

export const chatSummarySchema = z.object({
    id: z.string(),
    title: z.string(),
    message_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type ChatSummaryResponse = z.infer<typeof chatSummarySchema>;

export const chatListResponseSchema = z.object({
    items: z.array(chatSummarySchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
});

export type ChatListResponse = z.infer<typeof chatListResponseSchema>;

export const chatMessageSchema = z.object({
    role: z.string(),
    content: z.string(),
    created_at: z.string(),
});

export const chatResponseSchema = z.object({
    id: z.string(),
    title: z.string(),
    messages: z.array(chatMessageSchema),
    message_count: z.number(),
    linked_entry_id: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const tagResponseSchema = z.object({
  name: z.string(),
  usage_count: z.number(),
  color: z.string().nullable().optional(),
});

export type TagResponse = z.infer<typeof tagResponseSchema>;

export const tagListResponseSchema = z.object({
  tags: z.array(tagResponseSchema),
  total: z.number(),
});

export type TagListResponse = z.infer<typeof tagListResponseSchema>;
