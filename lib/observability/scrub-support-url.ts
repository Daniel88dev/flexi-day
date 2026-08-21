/**
 * The /api/support/organizations search carries free text (customer emails)
 * in its query string. These helpers strip the query string from any
 * /api/support/ URL before it leaves for Sentry — used by the client init's
 * beforeBreadcrumb / beforeSend / beforeSendTransaction hooks, alongside the
 * manual strip in `reportQueryError`.
 */

export function scrubSupportQuery(url: string): string {
  if (!url.includes("/api/support/")) return url;
  return url.split("?")[0]!;
}

const scrubStringValues = (obj: Record<string, unknown>, keys: string[]): void => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") obj[key] = scrubSupportQuery(value);
  }
};

/**
 * Scrubs every URL-carrying field Sentry events use: the request context
 * (error events), breadcrumb fetch/xhr data, and tracing span descriptions
 * plus their http attributes (transaction events). Mutates and returns the
 * event; shaped loosely so it accepts both ErrorEvent and TransactionEvent.
 */
export function scrubSupportUrlsInEvent<
  T extends {
    request?: { url?: string };
    breadcrumbs?: { data?: Record<string, unknown> }[];
    spans?: { description?: string; data?: Record<string, unknown> }[];
  },
>(event: T): T {
  if (event.request?.url) {
    event.request.url = scrubSupportQuery(event.request.url);
  }
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.data) scrubStringValues(breadcrumb.data, ["url"]);
  }
  for (const span of event.spans ?? []) {
    if (span.description) span.description = scrubSupportQuery(span.description);
    if (span.data) scrubStringValues(span.data, ["url", "http.url", "url.full"]);
  }
  return event;
}
