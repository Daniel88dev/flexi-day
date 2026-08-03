"use client";

import { useState } from "react";
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
import { useOpenVacationDetail } from "@/lib/vacations/use-vacation-detail";
import { notificationTarget } from "@/lib/vacations/vacation-detail-url";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n";

function relativeTime(iso: string, t: Dictionary): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return t.notifications.justNow;
  if (diff < 3_600_000) return t.notifications.minutesAgo(Math.floor(diff / 60_000));
  if (diff < 86_400_000) return t.notifications.hoursAgo(Math.floor(diff / 3_600_000));
  return t.notifications.daysAgo(Math.floor(diff / 86_400_000));
}

export function NotificationsBell() {
  const { t } = useTranslation();
  const query = useNotifications({ unreadOnly: false });
  const markRead = useMarkNotificationRead();
  const { openVacation } = useOpenVacationDetail();
  // Controlled because picking a request no longer navigates away, and the
  // menu would otherwise stay open behind the dialog it just opened.
  const [open, setOpen] = useState(false);

  const items: AppNotification[] = query.data ?? [];
  const unread = items.filter((n) => n.readAt === null);

  function onItemClick(n: AppNotification) {
    if (n.readAt === null) markRead.mutate(n.id);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            unread.length ? t.notifications.unreadLabel(unread.length) : t.notifications.title
          }
          className="relative grid h-8 w-8 place-items-center rounded-full border"
          style={{
            borderColor: "var(--border-strong)",
            background: "var(--surface)",
            color: "var(--text-muted)",
          }}
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 ? (
            <span
              className="absolute top-[6px] right-[7px] h-[6px] w-[6px] rounded-full"
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
          <span>{t.notifications.title}</span>
          {unread.length > 0 ? (
            <span className="text-muted-foreground text-[12px] font-normal">
              {t.notifications.unreadCount(unread.length)}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {query.isLoading ? (
          <p className="text-muted-foreground px-3 py-3 text-sm">{t.common.loading}</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground px-3 py-3 text-sm">{t.notifications.empty}</p>
        ) : (
          <ul className="max-h-[360px] overflow-auto py-1">
            {items.slice(0, 12).map((n) => {
              const target = notificationTarget(n.href);
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
                      {relativeTime(n.createdAt, t)}
                    </div>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {target?.kind === "link" ? (
                    <Link
                      href={target.href}
                      onClick={() => onItemClick(n)}
                      className="hover:bg-accent block px-3 py-2"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onItemClick(n);
                        // A request opens right here — the reader keeps the
                        // page they are on, dashboard included.
                        if (target?.kind === "vacation") openVacation(target.vacationId);
                      }}
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
