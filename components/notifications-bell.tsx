"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarkNotificationRead, useNotifications } from "@/lib/api/queries";
import type { AppNotification } from "@/lib/api/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function NotificationsBell() {
  const query = useNotifications({ unreadOnly: false });
  const markRead = useMarkNotificationRead();

  const items: AppNotification[] = query.data ?? [];
  const unread = items.filter((n) => n.readAt === null);

  function onItemClick(n: AppNotification) {
    if (n.readAt === null) markRead.mutate(n.id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}
          className="relative grid h-10 w-10 place-items-center rounded-full border"
          style={{
            borderColor: "var(--border-strong)",
            background: "var(--surface)",
            color: "var(--text-muted)",
          }}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread.length > 0 ? (
            <span
              className="absolute top-[9px] right-[10px] h-[7px] w-[7px] rounded-full"
              style={{
                background: "var(--warm)",
                boxShadow: "0 0 0 2px var(--surface)",
              }}
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread.length > 0 ? (
            <span className="text-muted-foreground text-[12px] font-normal">
              {unread.length} unread
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {query.isLoading ? (
          <p className="text-muted-foreground px-3 py-3 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground px-3 py-3 text-sm">You&apos;re all caught up.</p>
        ) : (
          <ul className="max-h-[360px] overflow-auto py-1">
            {items.slice(0, 12).map((n) => {
              const inner = (
                <div className="flex w-full gap-2.5">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: n.readAt === null ? "var(--warm)" : "transparent",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{n.title}</div>
                    <div className="text-muted-foreground line-clamp-2 text-[12.5px]">{n.body}</div>
                    <div className="text-muted-foreground/70 mt-0.5 text-[11.5px]">
                      {relativeTime(n.createdAt)}
                    </div>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => onItemClick(n)}
                      className="hover:bg-accent block px-3 py-2"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className="hover:bg-accent block w-full px-3 py-2 text-left"
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
