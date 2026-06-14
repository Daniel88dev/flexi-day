export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ApiErrorEntry = {
  message: string;
  context?: Record<string, unknown>;
};

export class ApiError extends Error {
  status: number;
  errors: ApiErrorEntry[];
  body: unknown;

  constructor(status: number, message: string, body?: unknown, errors?: ApiErrorEntry[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.errors = errors ?? [];
  }

  /** Convenience access for code reading typed fields off the first error's context. */
  context<T = Record<string, unknown>>(): T | undefined {
    return this.errors[0]?.context as T | undefined;
  }
}

type ApiInit = Omit<RequestInit, "body"> & { body?: unknown };

function pickErrors(parsed: unknown): ApiErrorEntry[] {
  if (!parsed || typeof parsed !== "object") return [];
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj.errors)) {
    const out: ApiErrorEntry[] = [];
    for (const e of obj.errors as Array<Record<string, unknown> | string>) {
      const message =
        typeof e === "string"
          ? e
          : typeof (e as { message?: unknown }).message === "string"
            ? (e as { message: string }).message
            : "";
      if (!message) continue;
      const ctx =
        typeof e === "object" &&
        e &&
        (e as { context?: unknown }).context &&
        typeof (e as { context?: unknown }).context === "object"
          ? (e as { context: Record<string, unknown> }).context
          : undefined;
      out.push({ message, context: ctx });
    }
    return out;
  }
  if (Array.isArray(obj.details)) {
    return (obj.details as Array<{ message?: string }>)
      .filter((d) => typeof d?.message === "string")
      .map((d) => ({ message: d.message as string }));
  }
  return [];
}

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
    const errors = pickErrors(parsed);
    const message =
      errors[0]?.message ||
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.error === "string" && obj.error) ||
      res.statusText ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, parsed, errors);
  }

  return parsed as T;
}
