import { api } from "./client";
import type { Iso, UUID, VacationKind } from "./types";

export type CalendarSyncScope = "ME" | "TEAM";

/** One included leave type with its display color(s), as returned by the API. */
export type CalendarSyncTypeEntry = {
  type: VacationKind;
  label: string;
  color: string; // swatch palette key (e.g. "violet")
  mineColor: string | null;
};

/** A calendar-sync feed config as returned by the API (`serializeConfig`). */
export type CalendarSyncConfig = {
  id: UUID;
  name: string;
  scope: CalendarSyncScope;
  distinguishMine: boolean;
  teamIds: UUID[];
  types: CalendarSyncTypeEntry[];
  feedUrl: string; // full URL on create/get/update/regenerate, masked on list
  tokenMasked: boolean;
  lastFetchedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
};

export type CalendarSyncTypeInput = {
  type: VacationKind;
  color: string;
  mineColor?: string;
};

/** Body for creating/updating a config (update replaces the whole config). */
export type CalendarSyncInput = {
  name: string;
  scope: CalendarSyncScope;
  distinguishMine: boolean;
  teamIds: UUID[];
  types: CalendarSyncTypeInput[];
};

export function listCalendarSyncs(): Promise<CalendarSyncConfig[]> {
  return api<CalendarSyncConfig[]>(`/api/calendar-sync`);
}

export function getCalendarSync(id: string): Promise<CalendarSyncConfig> {
  return api<CalendarSyncConfig>(`/api/calendar-sync/${id}`);
}

export function createCalendarSync(input: CalendarSyncInput): Promise<CalendarSyncConfig> {
  return api<CalendarSyncConfig>(`/api/calendar-sync`, { method: "POST", body: input });
}

export function updateCalendarSync(
  id: string,
  input: CalendarSyncInput
): Promise<CalendarSyncConfig> {
  return api<CalendarSyncConfig>(`/api/calendar-sync/${id}`, { method: "PUT", body: input });
}

export function deleteCalendarSync(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/calendar-sync/${id}`, { method: "DELETE" });
}

export function regenerateCalendarSyncToken(id: string): Promise<CalendarSyncConfig> {
  return api<CalendarSyncConfig>(`/api/calendar-sync/${id}/regenerate-token`, { method: "POST" });
}
