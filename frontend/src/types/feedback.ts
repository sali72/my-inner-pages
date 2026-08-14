export interface FeedbackContextResponse {
  entry_count: number;
  days_since_signup: number;
  current_view?: string | null;
  locale: string;
  session_entry_count: number;
}

export interface FeedbackResponse {
  id: string;
  user_id: string;
  variant: string;
  trigger: string;
  answers: Record<string, unknown>;
  context: FeedbackContextResponse;
  questionnaire_version: string;
  app_version: string;
  created_at: string;
}

export interface FeedbackListResponse {
  items: FeedbackResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface QuestionDistribution {
  question_id: string;
  label: string;
  count: number;
}

export interface FeedbackSummaryResponse {
  total_responses: number;
  by_variant: Record<string, number>;
  by_trigger: Record<string, number>;
  average_overall_feel?: number | null;
  question_distributions: Record<string, QuestionDistribution[]>;
  headline_counts: Record<string, Record<string, number>>;
}
