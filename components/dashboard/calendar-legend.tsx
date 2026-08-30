"use client";

import { visibleRanges, type CalendarRange } from "@/components/dashboard/leave-calendar";
import type { CalendarRecordType } from "@/lib/api/types";
import { DEFAULT_LEAVE_TYPES, leaveMetaFor } from "@/lib/demo/leave-meta";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Takes the same ranges and filter as the calendar so it explains exactly the
 * colors on screen, not the whole palette.
 */
export function CalendarLegend({
  ranges,
  filter,
}: {
  ranges: CalendarRange[];
  filter?: Set<CalendarRecordType>;
}) {
  const { t } = useTranslation();

  const visible = new Set(visibleRanges(ranges, filter).map((r) => r.type));
  const types = DEFAULT_LEAVE_TYPES.filter((k) => visible.has(k));

  if (types.length === 0) return null;

  return (
    <ul aria-label={t.dashboard.legend} className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
      {types.map((k) => (
        <li
          key={k}
          className="flex items-center gap-1.5 text-[12.5px] font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            aria-hidden
            className="h-[9px] w-[9px] shrink-0 rounded-full"
            style={{ background: leaveMetaFor(k).cssVar }}
          />
          {t.calendarRecordTypes[k].label}
        </li>
      ))}
    </ul>
  );
}
