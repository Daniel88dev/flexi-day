import * as Sentry from "@sentry/nextjs";
import { ApiError } from "@/lib/api/client";
import { logger } from "@/lib/observability/logger";

// Handled by the UI as part of normal operation, so they raise no issue — but
// they are still logged, so they stay visible in the Logs table.
const EXPECTED_STATUSES = new Set([401, 403, 404, 409, 422]);

const isAborted = (error: unknown): boolean =>
  error instanceof Error && (error.name === "AbortError" || error.name === "CancelledError");

export const shouldReport = (error: unknown): boolean => {
  if (isAborted(error)) return false;
  if (error instanceof ApiError) return !EXPECTED_STATUSES.has(error.status);
  return error instanceof Error;
};

// TanStack Query swallows errors into component state, so without this nothing a
// user hits in the app ever reaches Sentry.
export const reportQueryError = (
  error: unknown,
  source: "query" | "mutation",
  key?: readonly unknown[]
): void => {
  if (isAborted(error)) return;

  const apiError = error instanceof ApiError ? error : undefined;
  const message = error instanceof Error ? error.message : String(error);
  // First key segment is the resource name; the rest is per-user ids.
  const resource = typeof key?.[0] === "string" ? key[0] : undefined;

  const attributes = {
    "query.source": `tanstack.${source}`,
    "query.resource": resource,
    "query.key": key ? JSON.stringify(key) : undefined,
    "http.response.status_code": apiError?.status,
    "url.path": apiError?.path,
    "request.id": apiError?.requestId,
  };

  if (!shouldReport(error)) {
    logger.warn(`${source} failed (handled): ${message}`, attributes);
    return;
  }

  logger.error(`${source} failed: ${message}`, attributes);

  Sentry.captureException(error, {
    tags: {
      source: `tanstack.${source}`,
      query_key: resource,
      http_status: apiError ? String(apiError.status) : undefined,
      request_id: apiError?.requestId,
    },
    contexts: {
      request: {
        key: key ? JSON.stringify(key) : undefined,
        path: apiError?.path,
        status: apiError?.status,
        request_id: apiError?.requestId,
        // Backend `publicContext`, e.g. conflicting days on a booking clash.
        server_context: apiError?.errors?.[0]?.context,
      },
    },
  });
};
