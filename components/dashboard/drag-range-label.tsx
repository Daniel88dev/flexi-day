"use client";

import { createPortal } from "react-dom";
import type { IsoDate } from "@/lib/api/types";
import {
  bookedDayCount,
  formatDragRange,
  workingDayCount,
  type DateRange,
} from "@/lib/calendar/drag-range";
import { useTranslation } from "@/lib/i18n/use-translation";

export function DragRangeLabel({
  range,
  pointer,
  holidays,
  booked,
}: {
  range: DateRange;
  pointer: { x: number; y: number };
  holidays: ReadonlySet<IsoDate>;
  booked: ReadonlySet<IsoDate>;
}) {
  const { t } = useTranslation();
  const days = workingDayCount(range, holidays);
  const alreadyBooked = bookedDayCount(range, booked);

  return createPortal(
    <div
      aria-hidden
      data-testid="drag-range-label"
      className="tnum pointer-events-none z-[90] rounded-md px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap shadow-lg"
      style={{
        position: "fixed",
        left: pointer.x + 14,
        top: pointer.y + 18,
        background: "var(--text)",
        color: "var(--surface)",
      }}
    >
      {formatDragRange(range, t.common.dateLocale)} · {t.calendar.dragRangeDays(days)}
      {alreadyBooked > 0 ? (
        <div
          className="text-[11px]"
          style={{ color: "color-mix(in oklch, var(--destructive) 55%, var(--surface))" }}
        >
          {t.calendar.dragRangeBooked(alreadyBooked)}
        </div>
      ) : null}
    </div>,
    document.body
  );
}
