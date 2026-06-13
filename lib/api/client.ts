export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  details?: Array<{ message: string }>;
  body: unknown;

  constructor(
    status: number,
    message: string,
    body?: unknown,
    details?: Array<{ message: string }>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.details = details;
  }
}

type ApiInit = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const obj = (parsed as Record<string, unknown> | null) ?? {};
    const message =
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.error === "string" && obj.error) ||
      res.statusText ||
      `Request failed (${res.status})`;
    const details = Array.isArray((obj as { details?: unknown }).details)
      ? (obj as { details: Array<{ message: string }> }).details
      : undefined;
    throw new ApiError(res.status, message, parsed, details);
  }

  return parsed as T;
}
