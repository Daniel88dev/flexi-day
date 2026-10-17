"use client";

import { useMemo, useState, type ReactNode } from "react";
import { DayList } from "@/components/dashboard/day-list";
import type { CalendarRange } from "@/components/dashboard/leave-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarRecordType, type IsoDate } from "@/lib/api/types";
import { addDays } from "@/lib/attendance/month";
import { formatIsoDate, monthLabelDates, monthWeeks, seamColumn } from "@/lib/calendar/month-grid";
import { DayHeading, MonthSeam, dayNumberColor, dayTint } from "@/components/dashboard/month-seam";
import { DragRangeLabel } from "@/components/dashboard/drag-range-label";
import { datesCovered, rangeCellFill, type DateRange } from "@/lib/calendar/drag-range";
import { useDragRange } from "@/hooks/use-drag-range";
import {
  MAX_STRIPES,
  dayEntries,
  placeStripeWeek,
  stripeBookings,
  type DayRecord,
} from "@/lib/calendar/stripes";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

interface StripeCalendarProps {
  year: number;
  /** 1-12. */
  month: number;
  today: IsoDate | null;
  records: DayRecord[];
  /** Bank holiday ranges; each one's `note` carries the holiday names. */
  holidays: CalendarRange[];
  filter: Set<CalendarRecordType>;
  viewerId: string | null;
  onOpenRequest: (vacationId: string) => void;
  onBook: (date: IsoDate) => void;
  /** Lets a mouse on the desktop layout drag across days; receives the range on release. */
  onRangeSelect?: (range: DateRange) => void;
  /** PROTOTYPE (T-340): non-interactive markers inside a day cell. */
  dayAddon?: (date: IsoDate) => ReactNode;
  /** PROTOTYPE (T-340): a section the day popover shows above the people away. */
  dayListExtra?: (date: IsoDate) => ReactNode;
}

export function StripeCalendar({
  year,
  month,
  today,
  records,
  holidays,
  filter,
  viewerId,
  onOpenRequest,
  onBook,
  onRangeSelect,
  dayAddon,
  dayListExtra,
}: StripeCalendarProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<IsoDate | null>(null);
  const [openDate, setOpenDate] = useState<IsoDate | null>(null);
  const drag = useDragRange((range) => {
    setOpenDate(null);
    onRangeSelect?.(range);
  });
  const draggable = Boolean(onRangeSelect);
  const dragging = drag.range !== null;
  if (dragging && openDate !== null) setOpenDate(null);

  const weeks = useMemo(() => monthWeeks(year, month), [year, month]);
  const labelled = useMemo(() => monthLabelDates(weeks), [weeks]);
  const visible = useMemo(() => records.filter((r) => filter.has(r.type)), [records, filter]);
  const bookings = useMemo(() => stripeBookings(visible), [visible]);
  const holidayByDate = useMemo(() => {
    const byDate = new Map<IsoDate, string>();
    if (!filter.has(CalendarRecordType.BankHoliday)) return byDate;
    for (const range of holidays) {
      for (let date = range.from; date <= range.to; date = addDays(date, 1)) {
        byDate.set(date, range.note ?? t.calendar.bankHoliday);
      }
    }
    return byDate;
  }, [holidays, filter, t]);
  const holidayDates = useMemo(() => datesCovered(holidays), [holidays]);
  const bookedDates = useMemo(
    () => new Set(viewerId ? records.filter((r) => r.userId === viewerId).map((r) => r.date) : []),
    [records, viewerId]
  );

  const longDate = (date: IsoDate) =>
    formatIsoDate(date, t.common.dateLocale, { weekday: "long", day: "numeric", month: "long" });
  const shortDate = (date: IsoDate) =>
    formatIsoDate(date, t.common.dateLocale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div
      data-testid="stripe-calendar"
      className="overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        userSelect: dragging ? "none" : undefined,
      }}
    >
      <div
        className="grid grid-cols-7"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        {t.calendar.weekdaysShort.map((w, i) => (
          <div
            key={w}
            className="px-2 py-2 text-[11px] font-semibold tracking-[.04em] uppercase sm:px-3.5 sm:py-[11px] sm:text-[12px]"
            style={{ color: i >= 5 ? "var(--text-faint)" : "var(--text-muted)" }}
          >
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const { stripes, more } = placeStripeWeek(week, bookings, viewerId);
        const seam = seamColumn(week);

        return (
          <div
            key={week[0].date}
            className="relative"
            style={{ borderBottom: wi < weeks.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="grid min-h-[68px] grid-cols-7 sm:min-h-[92px]">
              {week.map((cell, di) => {
                const border = di < 6 ? "1px solid var(--border)" : "none";
                const date = cell.date;
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const isWeekend = di >= 5;
                const holiday = holidayByDate.get(date);
                const hidden = more.get(di) ?? 0;
                const entries = dayEntries(visible, date, viewerId);
                const away = new Set(entries.map((e) => e.userId)).size;
                const label = [
                  longDate(date),
                  holiday,
                  away > 0 ? t.calendar.awayCount(away) : null,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <Popover
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={di}
                    open={openDate === date}
                    onOpenChange={(open) => {
                      if (open && drag.isClickSuppressed()) return;
                      if (open) setSelectedDate(date);
                      setOpenDate(open ? date : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        {...(draggable ? drag.cellProps(date) : {})}
                        aria-label={label}
                        aria-pressed={isSelected}
                        className={cn(
                          "@container relative min-w-0 cursor-pointer px-1.5 pt-1.5 pb-1 text-left align-top outline-none hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset sm:px-2.5 sm:pt-2",
                          !dragging && "transition-colors"
                        )}
                        style={{
                          borderRight: border,
                          cursor: draggable && drag.canDrag ? "cell" : undefined,
                          background:
                            rangeCellFill(date, drag.range, bookedDates) ??
                            (holiday
                              ? "color-mix(in oklch, var(--c-bank) 13%, transparent)"
                              : isSelected
                                ? "color-mix(in oklch, var(--primary) 7%, transparent)"
                                : dayTint({ inMonth: cell.inMonth, isWeekend })),
                          boxShadow: isSelected
                            ? "inset 0 0 0 1.5px color-mix(in oklch, var(--primary) 45%, transparent)"
                            : undefined,
                        }}
                      >
                        <DayHeading
                          labelDate={labelled.has(date) ? date : null}
                          className={cn(
                            "absolute left-1.5 sm:left-2.5",
                            labelled.has(date) ? "top-0.5 @min-[60px]:top-2" : "top-1.5 sm:top-2"
                          )}
                        >
                          <span
                            className="tnum inline-grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[12px] sm:h-6 sm:min-w-6 sm:text-[13px]"
                            style={{
                              fontWeight: isToday || isSelected ? 700 : 500,
                              background: isToday
                                ? "var(--primary)"
                                : isSelected
                                  ? "var(--text)"
                                  : "transparent",
                              color: dayNumberColor({
                                isToday,
                                isSelected,
                                inMonth: cell.inMonth,
                                isWeekend,
                              }),
                            }}
                          >
                            {cell.day}
                          </span>
                        </DayHeading>

                        {holiday ? (
                          <span
                            className="absolute bottom-1 left-2.5 hidden max-w-[calc(100%-2.5rem)] truncate text-[10.5px] font-semibold sm:block"
                            style={{ color: "color-mix(in oklch, var(--c-bank) 80%, var(--text))" }}
                          >
                            {holiday}
                          </span>
                        ) : null}

                        {dayAddon ? dayAddon(date) : null}

                        {hidden > 0 ? (
                          <span
                            className="tnum absolute right-1 bottom-0.5 text-[10px] font-semibold sm:right-2 sm:bottom-1 sm:text-[11px]"
                            style={{ color: "var(--text-muted)" }}
                            title={t.calendar.moreOnStripeDay(hidden)}
                          >
                            +{hidden}
                          </span>
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      className="w-[min(340px,calc(100vw-2rem))] gap-0 p-0"
                    >
                      <DayList
                        title={longDate(date)}
                        shortDate={shortDate(date)}
                        entries={entries}
                        holiday={holiday}
                        extra={dayListExtra?.(date)}
                        viewerId={viewerId}
                        onOpenRequest={(id) => {
                          setOpenDate(null);
                          onOpenRequest(id);
                        }}
                        onBook={() => {
                          setOpenDate(null);
                          onBook(date);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>

            {seam !== null ? <MonthSeam col={seam} /> : null}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[31px] grid grid-cols-7 gap-y-[3px] sm:top-[42px] sm:gap-y-[5px]"
              style={{ gridTemplateRows: `repeat(${MAX_STRIPES}, auto)` }}
            >
              {stripes.map((s) => (
                <div
                  key={s.booking.id}
                  data-testid="stripe"
                  data-pending={s.booking.pending || undefined}
                  className="h-[5px] sm:h-[7px]"
                  style={{
                    gridColumn: `${s.startCol + 1} / ${s.endCol + 1}`,
                    gridRow: s.lane + 1,
                    marginLeft: s.continuesLeft ? 0 : 5,
                    marginRight: s.continuesRight ? 0 : 5,
                    background: leaveMetaFor(s.booking.type).cssVar,
                    // Too thin for the lanes' dashed outline, so pending shows as faded.
                    opacity: s.booking.pending ? 0.4 : 1,
                    borderRadius: `${s.continuesLeft ? 0 : 999}px ${s.continuesRight ? 0 : 999}px ${
                      s.continuesRight ? 0 : 999
                    }px ${s.continuesLeft ? 0 : 999}px`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
      {drag.range && drag.pointer ? (
        <DragRangeLabel
          range={drag.range}
          pointer={drag.pointer}
          holidays={holidayDates}
          booked={bookedDates}
        />
      ) : null}
    </div>
  );
}
