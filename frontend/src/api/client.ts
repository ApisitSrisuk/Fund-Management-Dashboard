import type { ApiErrorBody, ApiErrorKind, HttpMethod } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    super(ApiError.messageFrom(body) ?? fallbackMessage);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.kind = ApiError.kindFrom(status);
  }

  get code(): string | undefined {
    return this.body?.code;
  }

  get messages(): string[] {
    const message = this.body?.message;
    if (Array.isArray(message)) return message;
    return message ? [message] : [this.message];
  }

  static kindFrom(status: number): ApiErrorKind {
    if (status === 0) return 'network';
    if (status === 400) return 'bad-request';
    if (status === 404) return 'not-found';
    if (status === 409) return 'conflict';
    if (status >= 500) return 'server';
    return 'unknown';
  }

  private static messageFrom(body: ApiErrorBody | null): string | undefined {
    if (!body) return undefined;
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('message' in value)) return false;
  const { message } = value;
  return typeof message === 'string' || Array.isArray(message);
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function request<T>(method: HttpMethod, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, null, 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  }

  const data = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(response.status, isApiErrorBody(data) ? data : null, `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};

export function toQueryString(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
