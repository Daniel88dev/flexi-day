import { scrubTokenInQuery, scrubTokenInUrl } from "./scrub-token-query";

/**
 * Scrubs URLs before the client init's Sentry hooks send them: the query string of /api/support/
 * URLs (customer emails, see also `reportQueryError`), and page tokens (see `scrub-token-query`).
 */

export function scrubSupportQuery(url: string): string {
  if (!url.includes("/api/support/")) return url;
  return url.split("?")[0]!;
}

const scrubUrl = (url: string): string => scrubTokenInUrl(scrubSupportQuery(url));

const scrubValues = (
  obj: Record<string, unknown>,
  keys: string[],
  scrub: (value: string) => string
): void => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") obj[key] = scrub(value);
  }
};

const scrubSpanData = (data: Record<string, unknown>): void => {
  scrubValues(data, ["url", "http.url", "url.full"], scrubUrl);
  scrubValues(data, ["url.query"], scrubTokenInQuery);
};

/** Navigation breadcrumbs carry the page path in `from` / `to`, fetch and xhr ones in `url`. */
export function scrubBreadcrumbUrls<T extends { data?: Record<string, unknown> }>(
  breadcrumb: T
): T {
  if (breadcrumb.data) scrubValues(breadcrumb.data, ["url", "from", "to"], scrubUrl);
  return breadcrumb;
}

/**
 * Scrubs every URL-carrying field Sentry events use: the request context and its Referer,
 * breadcrumbs, tracing span descriptions and attributes, and the root span's attributes in
 * `contexts.trace.data`. Mutates and returns the event; shaped loosely so it accepts both
 * ErrorEvent and TransactionEvent.
 */
export function scrubUrlsInEvent<
  T extends {
    request?: { url?: string; headers?: Record<string, string> };
    breadcrumbs?: { data?: Record<string, unknown> }[];
    spans?: { description?: string; data?: Record<string, unknown> }[];
    contexts?: { trace?: { data?: Record<string, unknown> } };
  },
>(event: T): T {
  if (event.request?.url) {
    event.request.url = scrubUrl(event.request.url);
  }
  const headers = event.request?.headers;
  for (const key of Object.keys(headers ?? {})) {
    if (key.toLowerCase() === "referer") headers![key] = scrubUrl(headers![key]!);
  }
  for (const breadcrumb of event.breadcrumbs ?? []) scrubBreadcrumbUrls(breadcrumb);
  for (const span of event.spans ?? []) {
    if (span.description) span.description = scrubUrl(span.description);
    if (span.data) scrubSpanData(span.data);
  }
  const traceData = event.contexts?.trace?.data;
  if (traceData) scrubSpanData(traceData);
  return event;
}
