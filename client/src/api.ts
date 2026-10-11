import { z } from 'zod';

export class ApiError extends Error {
  public status: number;
  public details: { path: string; message: string }[];

  constructor(message: string, status: number, details: { path: string; message: string }[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions<TResponse> extends Omit<RequestInit, 'body'> {
  json?: unknown;
  formData?: FormData;
  body?: BodyInit | null;
  responseSchema: z.ZodType<TResponse>;
}

// Demo flag: serve the API from an in-browser mock (sessionStorage) instead of the real backend.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const API_UNAUTHORIZED_EVENT = 'api:unauthorized';

let pendingRequests = 0;
const activitySubscribers = new Set<() => void>();

export function subscribeApiActivity(subscriber: () => void): () => void {
  activitySubscribers.add(subscriber);
  return () => activitySubscribers.delete(subscriber);
}

export function getApiActivitySnapshot(): number {
  return pendingRequests;
}

function updatePendingRequests(change: number): void {
  pendingRequests += change;
  activitySubscribers.forEach((subscriber) => subscriber());
}

export async function api<TResponse>(path: string, options: ApiOptions<TResponse>): Promise<TResponse> {
  updatePendingRequests(1);
  try {
    const { json, formData, responseSchema, ...rest } = options;
    const headers = new Headers(rest.headers);
    let body: BodyInit | null = rest.body ?? null;

    if (json !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(json);
    }

    if (formData) body = formData;

    let response: Response;
    let text: string;
    try {
      if (DEMO_MODE) {
        const { demoFetch } = await import('./demo/router');
        response = await demoFetch(path, { method: rest.method, body });
      } else {
        response = await fetch(path, {
          credentials: 'include',
          ...rest,
          headers,
          body,
        });
      }
      text = await response.text();
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') throw cause;
      throw new ApiError('Unable to connect to the server. Check your connection and try again.', 0);
    }

    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        if (response.ok) throw new ApiError('The server returned an invalid response.', response.status);
        data = { message: text };
      }
    }

    if (!response.ok) {
      if (response.status === 401) window.dispatchEvent(new Event(API_UNAUTHORIZED_EVENT));
      const message =
        typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
            ? data.message
            : 'Request failed';
      const details = typeof data === 'object' && data !== null && 'details' in data && Array.isArray(data.details)
        ? data.details.filter((detail): detail is { path: string; message: string } => (
          typeof detail === 'object'
          && detail !== null
          && 'path' in detail
          && typeof detail.path === 'string'
          && 'message' in detail
          && typeof detail.message === 'string'
        ))
        : [];
      throw new ApiError(message, response.status, details);
    }

    const result = responseSchema.safeParse(data);
    if (!result.success) throw new ApiError('The server returned an unexpected response shape.', response.status);
    return result.data;
  } finally {
    updatePendingRequests(-1);
  }
}

