import { z } from 'zod';

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

async function request<T>(
    endpoint: string,
    options: RequestInit,
    schema?: z.ZodType<T>,
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string>) },
    });

    if (!response.ok) {
        let detail = response.statusText;
        try {
            const body = await response.json();
            detail = body.detail ?? detail;
        } catch {}
        throw new ApiError(detail, response.status);
    }

    const data = await response.json();
    if (schema) {
        return schema.parse(data);
    }
    return data as T;
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
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
});

export type JournalListResponse = z.infer<typeof journalListResponseSchema>;

export const messageResponseSchema = z.object({
    message: z.string(),
});
