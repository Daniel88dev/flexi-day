import { api } from "./client";
import type { AppNotification } from "./types";

export type ListNotificationsParams = { unreadOnly?: boolean };

export function listNotifications(
  params: ListNotificationsParams = {}
): Promise<AppNotification[]> {
  const q = new URLSearchParams();
  if (params.unreadOnly !== undefined) q.set("unreadOnly", String(params.unreadOnly));
  const qs = q.toString();
  return api<AppNotification[]>(`/api/notifications${qs ? `?${qs}` : ""}`);
}

export function markNotificationRead(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/notifications/${id}/read`, { method: "POST" });
}
