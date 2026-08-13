import { z } from 'zod';

const isoDatetime = z.string();

export const journalResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content_json: z.record(z.string(), z.unknown()).optional().default(() => ({ type: 'doc', content: [] })),
  content_text: z.string().optional().default(''),
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
