// Same-origin paths only. The value reaches router.replace() and OAuth
// callbackURLs, so an absolute or protocol-relative one would make the auth
// pages an open redirect off a link an attacker can send.
export function safeRedirect(requested: string | null): string {
  return requested && requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/dashboard";
}
