/**
 * Invite and password reset links carry their secret as `?token=`, and the sign-in and two-factor
 * pages carry that whole URL, encoded, in `?redirect=`. The Sentry SDK filters `token=` by key in
 * some fields but never looks inside `redirect`, so both are scrubbed here.
 */

const FILTERED = "[Filtered]";

const decodeComponent = (value: string): string =>
  new URLSearchParams(`v=${value}`).get("v") ?? value;

/** A bare query string without its leading `?`, as in the `url.query` span attribute. */
export function scrubTokenInQuery(query: string): string {
  return query
    .split("&")
    .map((pair) => {
      const separator = pair.indexOf("=");
      if (separator === -1) return pair;
      const rawKey = pair.slice(0, separator);
      const key = decodeComponent(rawKey);
      if (key === "token") return `${rawKey}=${FILTERED}`;
      if (key !== "redirect") return pair;

      const target = decodeComponent(pair.slice(separator + 1));
      const scrubbed = scrubTokenInUrl(target);
      return scrubbed === target ? pair : `${rawKey}=${encodeURIComponent(scrubbed)}`;
    })
    .join("&");
}

export function scrubTokenInUrl(url: string): string {
  const fragmentStart = url.indexOf("#");
  const queryEnd = fragmentStart === -1 ? url.length : fragmentStart;
  const queryStart = url.indexOf("?");
  if (queryStart === -1 || queryStart > queryEnd) return url;

  return (
    url.slice(0, queryStart + 1) +
    scrubTokenInQuery(url.slice(queryStart + 1, queryEnd)) +
    url.slice(queryEnd)
  );
}
