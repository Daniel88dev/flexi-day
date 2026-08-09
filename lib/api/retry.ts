import { ApiError } from "./client";

const MAX_RETRIES = 1;

/**
 * Retrying a rejected request doubles the load that caused the rejection, so a
 * 429 must never be retried — and no other 4xx becomes true on a second try
 * either. Network and 5xx failures still get one more attempt.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}
