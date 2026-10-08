/**
 * types/index.ts — Core TypeScript types mirroring backend models and schemas
 *
 * Strict typing across the frontend application. No `any` used.
 */

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type FormStatus = "draft" | "published";

export interface FormTheme {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  fontFamily?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
}

export interface QuestionProperties {
  placeholder?: string;
  options?: QuestionOption[];
  allowOther?: boolean;
  multiple?: boolean;
  min?: number;
  max?: number;
  steps?: number;
  shape?: "star" | "number" | "heart" | "thumb";
  [key: string]: unknown;
}

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  properties: QuestionProperties;
  created_at: string;
  updated_at: string;
}

export interface BulkQuestionItem {
  id?: number | null;
  type: QuestionType;
  title: string;
  description?: string | null;
  required?: boolean;
  properties?: QuestionProperties;
}

export interface Form {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: FormStatus;
  slug: string | null;
  theme: FormTheme | null;
  welcome_title: string | null;
  welcome_description: string | null;
  welcome_button_text: string | null;
  thank_you_title: string | null;
  thank_you_message: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface FormListItem {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: FormStatus;
  slug: string | null;
  created_at: string;
  updated_at: string;
  response_count: number;
  question_count: number;
}

export interface FormCreate {
  title?: string;
  description?: string | null;
  theme?: FormTheme | null;
  welcome_title?: string | null;
  welcome_description?: string | null;
  welcome_button_text?: string | null;
  thank_you_title?: string | null;
  thank_you_message?: string | null;
}

export interface FormUpdate {
  title?: string;
  description?: string | null;
  status?: FormStatus;
  slug?: string | null;
  theme?: FormTheme | null;
  welcome_title?: string | null;
  welcome_description?: string | null;
  welcome_button_text?: string | null;
  thank_you_title?: string | null;
  thank_you_message?: string | null;
}

export interface PublishResult {
  status: FormStatus;
  slug: string;
  public_url: string;
}

export interface Answer {
  id: number;
  response_id: number;
  question_id: number;
  value: unknown;
  created_at: string;
}

export interface AnswerWithQuestion {
  id: number;
  response_id: number;
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  value: unknown;
  created_at: string;
}

export interface ResponseRecord {
  id: number;
  form_id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
  last_question_id: number | null;
  answers: Answer[];
}

export interface ResponseDetail {
  id: number;
  form_id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
  last_question_id: number | null;
  answers: AnswerWithQuestion[];
}

export interface PaginatedResponses {
  items: ResponseRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OptionBreakdown {
  option: string;
  count: number;
  percentage: number;
}

export interface NumericStats {
  average: number | null;
  min: number | null;
  max: number | null;
  distribution: Record<string, number>;
}

export interface TextStats {
  total_answered: number;
  recent_answers: string[];
}

export interface QuestionSummary {
  question_id: number;
  title: string;
  type: QuestionType;
  total_answered: number;
  options_breakdown: OptionBreakdown[] | null;
  numeric_stats: NumericStats | null;
  text_stats: TextStats | null;
}

export interface FormSummary {
  form_id: number;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  drop_off_stats: Record<string, number>;
  questions: QuestionSummary[];
}

export interface ApiErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  errors?: Record<string, string>;
}
