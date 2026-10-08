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
} from "@/types";

const BASE_URL =
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
  pageSize = 20
): Promise<PaginatedResponses> {
  return api.get<PaginatedResponses>(
    `/api/forms/${formId}/responses?page=${page}&page_size=${pageSize}`
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

export function getExportCsvUrl(formId: number): string {
  return `${BASE_URL}/api/forms/${formId}/export.csv`;
}
