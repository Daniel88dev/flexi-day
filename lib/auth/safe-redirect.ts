const FALLBACK = "/dashboard";

// The value reaches router.replace() and OAuth callbackURLs, so anything that
// resolves to another origin would make the auth pages an open redirect.
// Browsers read "\" as "/" and drop tabs and newlines while parsing a URL, so
// backslashes and control characters are refused before resolving.
export function safeRedirect(requested: string | null): string {
  if (
    !requested ||
    !requested.startsWith("/") ||
    requested.startsWith("//") ||
    /[\\\p{Cc}]/u.test(requested)
  ) {
    return FALLBACK;
  }
  const url = new URL(requested, window.location.origin);
  if (url.origin !== window.location.origin) return FALLBACK;
  return url.pathname + url.search + url.hash;
}
