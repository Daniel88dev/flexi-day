/** Query parameter the vacation detail dialog is driven by, app-wide. */
export const VACATION_ID_PARAM = "vacationId";

/**
 * Where a notification should take the reader. Requests open in a dialog on
 * whatever page they are already on, so they never carry a destination —
 * anything else is followed as an ordinary link.
 */
export type NotificationTarget =
  { kind: "vacation"; vacationId: string } | { kind: "link"; href: string };

/**
 * Notification hrefs are written by the backend as absolute URLs against
 * `EMAIL_APP_URL`, which is the same app but not necessarily the same origin
 * the reader is on (a preview deploy, say). Parsing against a dummy base keeps
 * relative hrefs working too, and the origin is discarded either way.
 */
export function notificationTarget(href: string | null): NotificationTarget | null {
  if (!href) return null;

  let url: URL;
  try {
    url = new URL(href, "http://placeholder.invalid");
  } catch {
    return null;
  }

  const vacationId = url.searchParams.get(VACATION_ID_PARAM);
  if (vacationId) return { kind: "vacation", vacationId };

  return { kind: "link", href: `${url.pathname}${url.search}${url.hash}` };
}

/**
 * The current query with `vacationId` set, or removed when `vacationId` is
 * null. Returns a search string including the leading `?`, or "" when nothing
 * is left — callers append it to the pathname they are staying on.
 */
export function withVacationId(
  search: URLSearchParams | string,
  vacationId: string | null
): string {
  const next = new URLSearchParams(search);
  if (vacationId === null) next.delete(VACATION_ID_PARAM);
  else next.set(VACATION_ID_PARAM, vacationId);

  const query = next.toString();
  return query ? `?${query}` : "";
}
