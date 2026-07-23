import { api } from "./client";
import type { UserSettings } from "./types";

export function getMySettings(): Promise<UserSettings> {
  return api<UserSettings>(`/api/users/me/settings`);
}

export function updateMySettings(input: UserSettings): Promise<UserSettings> {
  return api<UserSettings>(`/api/users/me/settings`, { method: "PUT", body: input });
}
