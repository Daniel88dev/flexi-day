"use client";

import { CalendarPlus, PartyPopper } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { LeaveTag } from "@/components/dashboard/leave-tag";
import { Button } from "@/components/ui/button";
import type { DayRecord } from "@/lib/calendar/stripes";
import { useTranslation } from "@/lib/i18n/use-translation";

interface DayListProps {
  /** The full date, e.g. "Thursday, 24 September". */
  title: string;
  /** The short date the Book button names. */
  shortDate: string;
  entries: DayRecord[];
  holiday?: string;
  viewerId: string | null;
  onOpenRequest: (vacationId: string) => void;
  onBook: () => void;
}

export function DayList({
  title,
  shortDate,
  entries,
  holiday,
  viewerId,
  onOpenRequest,
  onBook,
}: DayListProps) {
  const { t } = useTranslation();
  const people = new Set(entries.map((e) => e.userId)).size;

  return (
    <section aria-label={t.calendar.awayOn(title)} className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display min-w-0 truncate text-[16px] font-semibold">{title}</h3>
        <span
          className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-[5px] text-[12.5px] font-semibold"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-muted)",
            borderColor: "var(--border)",
          }}
        >
          {t.calendar.awayCount(people)}
        </span>
      </div>

      {holiday ? (
        <div
          className="mb-3 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold"
          style={{
            background: "color-mix(in oklch, var(--c-bank) 13%, transparent)",
            color: "color-mix(in oklch, var(--c-bank) 75%, var(--text))",
          }}
        >
          <PartyPopper className="h-4 w-4 shrink-0" />
          <span className="truncate">{holiday}</span>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <p className="py-1 text-[14px]" style={{ color: "var(--text-muted)" }}>
          {t.calendar.nobodyAway}
        </p>
      ) : (
        <ul className="grid max-h-[min(360px,50dvh)] gap-1 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onOpenRequest(entry.id)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              >
                {entry.user ? (
                  <AvatarBubble
                    initials={entry.user.initials}
                    background={entry.user.avatarColor}
                    name={entry.user.name}
                    size={34}
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">
                    {entry.user?.name}
                    {entry.userId === viewerId ? (
                      <span className="font-medium" style={{ color: "var(--text-faint)" }}>
                        {" "}
                        {t.calendar.you}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <LeaveTag type={entry.type} small />
                    {entry.halfDay ? (
                      <span
                        className="rounded-full border px-1.5 py-[1px] text-[11px] font-semibold"
                        style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
                      >
                        {t.calendar.halfDayMark}
                      </span>
                    ) : null}
                    {entry.pending ? (
                      <span
                        className="rounded-full border border-dashed px-1.5 py-[1px] text-[11px] font-semibold"
                        style={{ borderColor: "var(--warm)", color: "var(--warm)" }}
                      >
                        {t.status.pending}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button className="mt-4 w-full" onClick={onBook}>
        <CalendarPlus className="h-4 w-4" />
        {t.calendar.bookDay(shortDate)}
      </Button>
    </section>
  );
}
