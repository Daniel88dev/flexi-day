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

export function markAllNotificationsRead(): Promise<{ message: string; updated: number }> {
  return api<{ message: string; updated: number }>("/api/notifications/read-all", {
    method: "POST",
  });
}

export function deleteNotification(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/notifications/${id}`, { method: "DELETE" });
}

export function deleteAllNotifications(): Promise<{ message: string; removed: number }> {
  return api<{ message: string; removed: number }>("/api/notifications", { method: "DELETE" });
}
