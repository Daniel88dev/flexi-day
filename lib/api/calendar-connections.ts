import { ApiError, api, errorCode } from "./client";
import type { Iso, UUID } from "./types";
import type { CalendarCapability, CalendarProvider, CalendarSyncConfig } from "./calendar-sync";

export const CALENDAR_PROVIDER_SLUGS = ["google", "microsoft"] as const;

/** The provider as it appears in API paths and the post-consent redirect. */
export type CalendarProviderSlug = (typeof CALENDAR_PROVIDER_SLUGS)[number];

export type CalendarConnectionStatus = "ACTIVE" | "NEEDS_RECONNECT";

export type CalendarConnection = {
  provider: CalendarProvider;
  status: CalendarConnectionStatus;
  capability: CalendarCapability;
  createdAt: Iso;
};

export type CalendarConnections = {
  /** Which provider switches are on; a provider that is off gets no connect button. */
  providers: Record<CalendarProviderSlug, boolean>;
  connections: CalendarConnection[];
};

export type StartConnectionInput = { configId: UUID; timeZone: string };

export type SetCalendarTargetInput = { timeZone: string };

const SLUG_BY_PROVIDER: Record<CalendarProvider, CalendarProviderSlug> = {
  GOOGLE: "google",
  MICROSOFT: "microsoft",
};

export function providerSlug(provider: CalendarProvider): CalendarProviderSlug {
  return SLUG_BY_PROVIDER[provider];
}

export function listConnections(): Promise<CalendarConnections> {
  return api<CalendarConnections>(`/api/calendar-sync/connections`);
}

export function startConnection(
  provider: CalendarProviderSlug,
  input: StartConnectionInput
): Promise<{ url: string }> {
  return api<{ url: string }>(`/api/calendar-sync/connections/${provider}/start`, {
    method: "POST",
    body: input,
  });
}

export function disconnectCalendar(provider: CalendarProviderSlug): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/calendar-sync/connections/${provider}`, {
    method: "DELETE",
  });
}

export function setCalendarTarget(
  configId: UUID,
  input: SetCalendarTargetInput
): Promise<CalendarSyncConfig> {
  return api<CalendarSyncConfig>(`/api/calendar-sync/${configId}/target`, {
    method: "PUT",
    body: input,
  });
}

export function removeCalendarTarget(configId: UUID): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/calendar-sync/${configId}/target`, { method: "DELETE" });
}

/** Queues a sync; answers before it runs, with the config's `target.syncing` true. */
export function syncCalendarNow(configId: UUID): Promise<CalendarSyncConfig> {
  return api<CalendarSyncConfig>(`/api/calendar-sync/${configId}/target/sync`, { method: "POST" });
}

export type CalendarConnectionErrorName =
  | "team_config"
  | "not_entitled"
  | "provider_disabled"
  | "needs_reconnect"
  | "target_exists"
  | "unknown";

const ERROR_NAME_BY_CODE: Record<string, CalendarConnectionErrorName> = {
  CALENDAR_SYNC_TEAM_SCOPE: "team_config",
  CALENDAR_SYNC_PLAN_REQUIRED: "not_entitled",
  CALENDAR_SYNC_PROVIDER_OFF: "provider_disabled",
  CALENDAR_SYNC_NEEDS_RECONNECT: "needs_reconnect",
  CALENDAR_SYNC_TARGET_EXISTS: "target_exists",
};

// Until the backend ships CALENDAR_SYNC_PROVIDER_OFF, its provider-off 404 carries
// no code; the message is the only thing that tells it from a missing calendar.
const PROVIDER_OFF_MESSAGE = "This calendar provider is not available";

export function calendarConnectionError(error: unknown): CalendarConnectionErrorName {
  const code = errorCode(error);
  if (code !== undefined && Object.hasOwn(ERROR_NAME_BY_CODE, code)) {
    return ERROR_NAME_BY_CODE[code];
  }
  if (error instanceof ApiError && error.status === 404 && error.message === PROVIDER_OFF_MESSAGE) {
    return "provider_disabled";
  }
  return "unknown";
}
