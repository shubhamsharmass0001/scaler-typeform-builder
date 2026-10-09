/**
 * lib/api.ts — Typed API client wrapper
 *
 * Handles base URL configuration, request headers, JSON serialization,
 * and structured ApiError handling including field-level validation errors.
 */

import {
  Form,
  FormListItem,
  FormCreate,
  FormUpdate,
  PublishResult,
  Question,
  BulkQuestionItem,
  PaginatedResponses,
  ResponseDetail,
  FormSummary,
  ApiErrorResponse,
  PublicForm,
  PublicSubmitPayload,
  PublicSubmitResult,
  StartResponseResult,
  ProgressResult,
} from "@/types";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";


export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;
  data?: unknown;

  constructor(status: number, message: string, errors?: Record<string, string>, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    let errors: Record<string, string> | undefined;
    let data: unknown;

    if (isJson) {
      try {
        const errorBody = (await res.json()) as ApiErrorResponse;
        data = errorBody;

        if (errorBody.errors) {
          errors = errorBody.errors;
          message = Object.values(errorBody.errors).join(", ");
        } else if (typeof errorBody.detail === "string") {
          message = errorBody.detail;
        } else if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail.map((d) => d.msg).join(", ");
        }
      } catch {
        // Fallback to text status
      }
    } else {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // Fallback
      }
    }

    throw new ApiError(res.status, message, errors, data);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export const api = {
  async get<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...options,
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
    return handleResponse<T>(res);
  },
};

// -----------------------------------------------------------------------------
// Typed creator endpoints
// -----------------------------------------------------------------------------

export async function getForms(): Promise<FormListItem[]> {
  return api.get<FormListItem[]>("/api/forms");
}

export async function createForm(data?: FormCreate): Promise<Form> {
  return api.post<Form>("/api/forms", data ?? {});
}

export async function getForm(id: number): Promise<Form> {
  return api.get<Form>(`/api/forms/${id}`);
}

export async function updateForm(id: number, data: FormUpdate): Promise<Form> {
  return api.patch<Form>(`/api/forms/${id}`, data);
}

export async function deleteForm(id: number): Promise<{ detail: string }> {
  return api.delete<{ detail: string }>(`/api/forms/${id}`);
}

export async function duplicateForm(id: number): Promise<Form> {
  return api.post<Form>(`/api/forms/${id}/duplicate`);
}

export async function publishForm(id: number): Promise<PublishResult> {
  return api.post<PublishResult>(`/api/forms/${id}/publish`);
}

export async function unpublishForm(id: number): Promise<Form> {
  return api.post<Form>(`/api/forms/${id}/unpublish`);
}

export async function bulkSaveQuestions(
  formId: number,
  questions: BulkQuestionItem[]
): Promise<Question[]> {
  return api.put<Question[]>(`/api/forms/${formId}/questions`, questions);
}

export async function getResponses(
  formId: number,
  page = 1,
  pageSize = 20,
  status?: string
): Promise<PaginatedResponses> {
  const statusParam = status ? `&status=${encodeURIComponent(status)}` : "";
  return api.get<PaginatedResponses>(
    `/api/forms/${formId}/responses?page=${page}&page_size=${pageSize}${statusParam}`
  );
}

export async function getResponseDetail(
  formId: number,
  responseId: number
): Promise<ResponseDetail> {
  return api.get<ResponseDetail>(`/api/forms/${formId}/responses/${responseId}`);
}

export async function deleteResponse(
  formId: number,
  responseId: number
): Promise<{ detail: string }> {
  return api.delete<{ detail: string }>(
    `/api/forms/${formId}/responses/${responseId}`
  );
}

export async function getSummary(formId: number): Promise<FormSummary> {
  return api.get<FormSummary>(`/api/forms/${formId}/summary`);
}

export function getExportCsvUrl(formId: number, status?: string): string {
  const base = `${BASE_URL}/api/forms/${formId}/export.csv`;
  return status ? `${base}?status=${encodeURIComponent(status)}` : base;
}

/**
 * Programmatically downloads the CSV export as a file.
 * Returns the suggested filename from Content-Disposition (or a fallback).
 * Throws ApiError on non-2xx responses.
 */
export async function downloadCsv(formId: number, status?: string): Promise<string> {
  const url = getExportCsvUrl(formId, status);
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    let message = `Export failed (${res.status})`;
    try {
      const errText = await res.text();
      if (errText) {
        try {
          const jsonErr = JSON.parse(errText);
          message = jsonErr.detail || jsonErr.message || errText;
        } catch {
          message = errText;
        }
      }
    } catch {
      /* noop */
    }
    throw new ApiError(res.status, message);
  }

  const blob = await res.blob();

  // Extract filename from Content-Disposition header
  let filename = `form-${formId}-responses.csv`;
  const cd = res.headers.get("content-disposition") || "";
  const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i);
  if (match?.[1]) {
    filename = decodeURIComponent(match[1].trim());
  }

  // Trigger browser download
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  return filename;
}

// -----------------------------------------------------------------------------
// Typed public respondent endpoints
// -----------------------------------------------------------------------------

export async function getPublicForm(slug: string): Promise<PublicForm> {
  return api.get<PublicForm>(`/api/public/forms/${slug}`);
}

export async function startPublicSession(slug: string): Promise<StartResponseResult> {
  return api.post<StartResponseResult>(`/api/public/forms/${slug}/start`);
}

export async function submitPublicAnswers(
  slug: string,
  payload: PublicSubmitPayload
): Promise<PublicSubmitResult> {
  return api.post<PublicSubmitResult>(`/api/public/forms/${slug}/submit`, payload);
}

export async function recordPublicProgress(
  slug: string,
  payload: { response_id: number; last_question_id: number }
): Promise<ProgressResult> {
  return api.patch<ProgressResult>(`/api/public/forms/${slug}/progress`, payload);
}

