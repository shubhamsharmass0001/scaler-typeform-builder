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
  | "rating"
  | "file_upload";

export type FormStatus = "draft" | "published";

export type ThemePresetName = "classic" | "midnight" | "sunset" | "forest" | "custom";
export type FontFamilyName =
  | "Inter"
  | "Roboto"
  | "Outfit"
  | "Playfair Display"
  | "Poppins"
  | "Space Grotesk";
export type FontScale = "small" | "medium" | "large";
export type ButtonRadius = "square" | "rounded" | "pill";

export interface FormTheme {
  preset: ThemePresetName;
  backgroundColor: string;
  backgroundImageUrl: string | null;
  backgroundOverlay: number;
  questionColor: string;
  answerColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: FontFamilyName;
  fontScale: FontScale;
  buttonRadius: ButtonRadius;
  // Legacy / fallback compatibility
  textColor?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
}

export type LogicOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_answered"
  | "is_empty";

export interface LogicCondition {
  operator: LogicOperator;
  value?: string | number | boolean | null;
}

export interface LogicAction {
  type: "jump";
  target_question_id: number | string; // target question ID or "end"
}

export interface LogicRule {
  id: string;
  conditions: LogicCondition[];
  match: "all" | "any";
  action: LogicAction;
}

export interface QuestionProperties {
  placeholder?: string;
  options?: QuestionOption[];
  allowOther?: boolean;
  multiple?: boolean;
  randomize?: boolean;
  alphabetical?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  steps?: number;
  shape?: "star" | "number" | "heart" | "thumbs" | "thumb";
  showDescription?: boolean;
  maxSizeMB?: number;
  allowedTypes?: string[];
  logic?: LogicRule[];
  logicDefault?: number | string | null;
  [key: string]: unknown;
}

export interface Question {
  id: number | string;
  form_id?: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  properties: QuestionProperties;
  created_at?: string;
  updated_at?: string;
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
  response_count?: number;
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

export interface OverallStats {
  started: number;
  completed: number;
  partial: number;
  completion_rate: number;
  average_completion_seconds: number | null;
}

export interface DropoffQuestion {
  question_id: number;
  title: string;
  position: number;
  reached_count: number;
  dropped_here_count: number;
  dropoff_percent: number;
}

export interface FormSummary {
  form_id: number;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  drop_off_stats: Record<string, number>;
  overall?: OverallStats;
  dropoff?: DropoffQuestion[];
  questions: QuestionSummary[];
}

export interface ApiErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  errors?: Record<string, string>;
}

export interface PublicForm {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  theme: FormTheme | null;
  welcome_title: string | null;
  welcome_description: string | null;
  welcome_button_text: string | null;
  thank_you_title: string | null;
  thank_you_message: string | null;
  questions: Question[];
}

export interface PublicAnswerItem {
  question_id: number;
  value: unknown;
}

export interface PublicSubmitPayload {
  response_id?: number | null;
  answers: PublicAnswerItem[];
}

export interface PublicSubmitResult {
  status: string;
  response_id: number;
  submitted_at: string;
}

export interface StartResponseResult {
  response_id: number;
}

export interface ProgressResult {
  status: string;
  response_id: number;
  last_question_id: number;
}

