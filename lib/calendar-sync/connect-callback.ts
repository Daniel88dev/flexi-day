import { CALENDAR_PROVIDER_SLUGS, type CalendarProviderSlug } from "@/lib/api/calendar-connections";

const CALLBACK_ERRORS = [
  "state_invalid",
  "provider_disabled",
  "consent_denied",
  "provider_error",
  "config_not_found",
  "team_config",
  "target_exists",
  "scope_denied",
  "exchange_failed",
  "server_error",
] as const;

/** Why the consent callback did not connect; `unknown` for a code this build predates. */
export type ConnectCallbackError = (typeof CALLBACK_ERRORS)[number] | "unknown";

// Named like `CalendarConnectionErrorName` where both mean the same condition.
const RENAMED_BACKEND_CODES: Record<string, ConnectCallbackError> = {
  team_scope: "team_config",
  provider_off: "provider_disabled",
};

export type ConnectCallbackResult =
  | { status: "connected"; provider: CalendarProviderSlug; configId: string | null }
  | { status: "error"; error: ConnectCallbackError; configId: string | null };

const isOneOf = <T extends string>(list: readonly T[], value: string): value is T =>
  (list as readonly string[]).includes(value);

function callbackError(code: string): ConnectCallbackError {
  if (Object.hasOwn(RENAMED_BACKEND_CODES, code)) return RENAMED_BACKEND_CODES[code];
  return isOneOf(CALLBACK_ERRORS, code) ? code : "unknown";
}

/**
 * Reads the query the backend redirects to after consent:
 * `?connected=<provider>&config=<id>` or `?error=<code>&config=<id>`. Null when neither is there.
 */
export function parseConnectCallback(params: {
  get(name: string): string | null;
}): ConnectCallbackResult | null {
  const connected = params.get("connected");
  const error = params.get("error");
  const configId = params.get("config") || null;

  if (connected !== null) {
    return isOneOf(CALENDAR_PROVIDER_SLUGS, connected)
      ? { status: "connected", provider: connected, configId }
      : { status: "error", error: "unknown", configId };
  }
  if (error !== null) return { status: "error", error: callbackError(error), configId };
  return null;
}
