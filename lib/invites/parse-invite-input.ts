export type InviteInput =
  { kind: "link"; token: string } | { kind: "broken-link" } | { kind: "code"; code: string };

const JOIN_PATH = /\/join\/?$/;

// The base only resolves a link pasted without its scheme; the origin is never checked.
const toUrl = (value: string): URL | null => {
  try {
    return new URL(value, "https://invite.invalid");
  } catch {
    return null;
  }
};

/** Tells a pasted invite link from a bare invite code. Null for blank input. */
export function parseInviteInput(raw: string): InviteInput | null {
  const value = raw.trim();
  if (!value) return null;

  const url = value.includes("/") ? toUrl(value) : null;
  if (!url || !JOIN_PATH.test(url.pathname)) return { kind: "code", code: value };

  const token = url.searchParams.get("token")?.trim();
  return token ? { kind: "link", token } : { kind: "broken-link" };
}
