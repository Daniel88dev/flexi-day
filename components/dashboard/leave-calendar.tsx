"use client";

import { useState } from "react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import {
  CalendarRecordType,
  type IsoDate,
  type UserSummary,
  type VacationStatus,
} from "@/lib/api/types";
import { addDays } from "@/lib/attendance/month";
import {
  formatIsoDate,
  monthLabelDates,
  monthWeeks,
  seamColumn,
  weekSpan,
} from "@/lib/calendar/month-grid";
import { DayHeading, MonthSeam, dayNumberColor, dayTint } from "@/components/dashboard/month-seam";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

export interface CalendarRange {
  id: string;
  who: string; // person id, or 'all' for bank holidays
  user?: UserSummary; // present when row represents a real user
  type: CalendarRecordType;
  from: IsoDate; // inclusive
  to: IsoDate;
  note?: string;
  /** Ids of the vacation rows this bar collapses, in day order. */
  vacationIds?: string[];
  /** Set when the record only shows here via a group mirror; names its source group. */
  mirroredFrom?: string | null;
  pending?: boolean;
  halfDay?: boolean;
}

interface LeaveCalendarProps {
  year: number;
  /** 1-12. */
  month: number;
  today?: IsoDate | null;
  ranges: CalendarRange[];
  filter?: Set<CalendarRecordType>;
  mini?: boolean;
  /** Makes bars clickable; receives the first vacation id of the range. */
  onSelect?: (vacationId: string) => void;
  /** Makes empty day cells clickable; receives the date clicked. */
  onDayClick?: (date: IsoDate) => void;
  /** Numbers the neighbouring months' days and marks the seam; off, they stay empty and inert. */
  showAdjacentDays?: boolean;
}

/** Bars a week shows before the rest collapse behind the "+N more" toggle. */
export const MAX_LANES = 2;

/** The one visibility rule; the legend shares it so it never diverges from the calendar. */
export function visibleRanges(
  ranges: CalendarRange[],
  filter?: Set<CalendarRecordType>
): CalendarRange[] {
  return filter ? ranges.filter((r) => filter.has(r.type)) : ranges;
}

interface PlacedBar {
  range: CalendarRange;
  sc: number; // grid column start (1-indexed)
  ec: number; // grid column end (exclusive)
  contL: boolean;
  contR: boolean;
  lane: number;
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function CalBar({
  range,
  contL,
  contR,
  mini,
  onSelect,
}: {
  range: CalendarRange;
  contL: boolean;
  contR: boolean;
  mini: boolean;
  onSelect?: (vacationId: string) => void;
}) {
  const { t } = useTranslation();
  const meta = leaveMetaFor(range.type);
  const u = range.user;
  const everyone = t.calendar.everyone;
  const typeLabel = recordTypeLabel(t.calendarRecordTypes, range.type);
  const shortName = u ? firstName(u.name) : everyone;
  const displayName = range.halfDay ? `${shortName} ½` : shortName;
  const title = [
    u ? u.name : everyone,
    typeLabel,
    range.pending ? t.status.pending : null,
    range.note,
    range.mirroredFrom ? t.calendar.mirroredFrom(range.mirroredFrom) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const vacationId = range.vacationIds?.[0];
  const clickable = Boolean(onSelect && vacationId);
  return (
    <div
      title={title}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? t.calendar.openRequest(title) : undefined}
      onClick={clickable ? () => onSelect?.(vacationId as string) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(vacationId as string);
              }
            }
          : undefined
      }
      style={{
        height: mini ? 16 : 24,
        display: "flex",
        alignItems: "center",
        gap: mini ? 4 : 6,
        padding: mini ? "0 4px" : "0 7px 0 5px",
        overflow: "hidden",
        cursor: clickable ? "pointer" : "default",
        background: `color-mix(in oklch, ${meta.cssVar} ${range.pending ? 8 : 16}%, var(--surface))`,
        color: `color-mix(in oklch, ${meta.cssVar} 55%, var(--text))`,
        ...(range.pending
          ? { border: `1px dashed ${meta.cssVar}` }
          : {
              // A mirrored record is only projected into this group, never owned by
              // it — the dashed edge is what tells the two apart at a glance.
              borderLeft: range.mirroredFrom
                ? `3px dashed ${meta.cssVar}`
                : `3px solid ${meta.cssVar}`,
            }),
        borderRadius: `${contL ? 0 : 7}px ${contR ? 0 : 7}px ${contR ? 0 : 7}px ${contL ? 0 : 7}px`,
        fontSize: mini ? 9.5 : 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        marginLeft: contL ? -1 : 0,
        marginRight: contR ? -1 : 0,
      }}
    >
      {u && !mini ? (
        <AvatarBubble initials={u.initials} background={u.avatarColor} name={u.name} size={16} />
      ) : null}
      {!contL ? (
        // On narrow bars (single days on mobile) the avatar alone identifies
        // the person; the name only renders once the bar can actually fit it.
        <span
          className={
            mini
              ? "overflow-hidden text-ellipsis"
              : "hidden overflow-hidden text-ellipsis @min-[64px]:inline"
          }
        >
          {displayName}
          {range.mirroredFrom && !mini ? <span aria-hidden="true"> ↗</span> : null}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The overflow affordance for one day: "+N more", opening a popover that lists
 * the records that day could not fit. Picking one opens the same request detail
 * as clicking a visible bar, so a hidden record is never a dead end.
 */
function MoreChip({
  hidden,
  date,
  onSelect,
}: {
  hidden: CalendarRange[];
  date: IsoDate;
  onSelect?: (vacationId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dayLabel = formatIsoDate(date, t.common.dateLocale, { day: "numeric", month: "long" });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-[3px] text-[11px] font-semibold whitespace-nowrap text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        aria-label={t.calendar.moreOnDay(hidden.length, dayLabel)}
      >
        {t.calendar.moreCount(hidden.length)}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-2 p-2">
        <p
          className="px-1.5 pt-0.5 text-[11px] font-semibold"
          style={{ color: "var(--text-faint)" }}
        >
          {t.calendar.moreOnDay(hidden.length, dayLabel)}
        </p>
        {hidden.map((range) => {
          const meta = leaveMetaFor(range.type);
          const vacationId = range.vacationIds?.[0];
          const clickable = Boolean(onSelect && vacationId);
          const name = range.user ? range.user.name : t.calendar.everyone;
          return (
            <button
              key={range.id}
              type="button"
              disabled={!clickable}
              onClick={() => {
                setOpen(false);
                onSelect?.(vacationId as string);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-1.5 py-1.5 text-left transition-colors enabled:hover:bg-[var(--surface-2)] disabled:cursor-default"
            >
              <span
                className="h-6 w-[3px] shrink-0 rounded-full"
                style={{ background: meta.cssVar }}
              />
              {range.user ? (
                <AvatarBubble
                  initials={range.user.initials}
                  background={range.user.avatarColor}
                  name={range.user.name}
                  size={20}
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{name}</span>
                <span
                  className="block truncate text-[11.5px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {recordTypeLabel(t.calendarRecordTypes, range.type)}
                  {range.mirroredFrom ? ` · ${t.calendar.mirroredFrom(range.mirroredFrom)}` : ""}
                </span>
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// The full holiday name lives in the popover (and the title tooltip) because
// a truncated pill is the only thing that fits a day cell — and hover does not
// exist on touch screens, so tap has to work too.
function BankHolidayPill({
  label,
  names,
  mini,
}: {
  label: string;
  names: string[];
  mini?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger
        title={names.join(" · ")}
        style={{
          width: "100%",
          height: mini ? 16 : 24,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 8px",
          fontSize: mini ? 9 : 11.5,
          fontWeight: 700,
          letterSpacing: ".02em",
          color: "var(--c-bank)",
          background: "color-mix(in oklch, var(--c-bank) 16%, var(--surface))",
          border: "1px dashed color-mix(in oklch, var(--c-bank) 40%, transparent)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {mini ? label : `🎉 ${label}`}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 p-3">
        {names.map((name) => (
          <p key={name} className="text-[13px] font-semibold" style={{ color: "var(--c-bank)" }}>
            🎉 {name}
          </p>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function LeaveCalendar({
  year,
  month,
  today = null,
  ranges,
  filter,
  mini = false,
  onSelect,
  onDayClick,
  showAdjacentDays = true,
}: LeaveCalendarProps) {
  const { t } = useTranslation();
  const WEEKDAYS = t.calendar.weekdaysShort;
  const weeks = monthWeeks(year, month);
  const labelled = monthLabelDates(weeks);
  const active = visibleRanges(ranges, filter);
  const barsTop = mini ? 22 : 38;
  // Every week is the same height, whatever the headcount — the overflow opens
  // in a popover rather than pushing the grid around.
  const rowH = mini ? 54 : 118;
  const cellLabelSize = mini ? 16 : 24;
  const cellFs = mini ? 9.5 : 13;

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: mini ? 12 : "var(--radius)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        className="grid grid-cols-7"
        style={{
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            style={{
              padding: mini ? "6px 8px" : "11px 14px",
              fontSize: mini ? 9 : 12,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: i >= 5 ? "var(--text-faint)" : "var(--text-muted)",
            }}
          >
            {mini ? w[0] : w}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const bank = active.flatMap((e) => {
          if (e.type !== CalendarRecordType.BankHoliday) return [];
          const span = weekSpan(week, e.from, e.to);
          return span ? [{ range: e, span }] : [];
        });
        const barsRaw: PlacedBar[] = active
          .flatMap((e) => {
            if (e.type === CalendarRecordType.BankHoliday) return [];
            const span = weekSpan(week, e.from, e.to);
            if (!span) return [];
            return [
              {
                range: e,
                sc: span.startCol + 1,
                ec: span.endCol + 1,
                contL: span.continuesLeft,
                contR: span.continuesRight,
                lane: 0,
              },
            ];
          })
          .sort((a, b) => a.sc - b.sc || b.ec - b.sc - (a.ec - a.sc));

        const lanes: PlacedBar[][] = [];
        for (const b of barsRaw) {
          let placed = false;
          for (let li = 0; li < lanes.length; li++) {
            const lane = lanes[li];
            if (lane.every((x) => b.sc >= x.ec || b.ec <= x.sc)) {
              lane.push(b);
              b.lane = li;
              placed = true;
              break;
            }
          }
          if (!placed) {
            b.lane = lanes.length;
            lanes.push([b]);
          }
        }
        // A week is capped at MAX_LANES bars; the rest open in a popover.
        // Bank holidays share the first row (each pill spans only its own
        // days), so however many there are, they cost the budget one lane.
        const bankRows = bank.length > 0 ? 1 : 0;
        const seam = showAdjacentDays ? seamColumn(week) : null;
        const shownLanes = Math.max(0, MAX_LANES - bankRows);

        // The bars each weekday hides. Keyed per column rather than per week so
        // the "+N" sits in the cell the reader is looking at, and so the
        // popover lists exactly the records that day dropped.
        const hiddenPerColumn = new Map<number, CalendarRange[]>();
        for (const b of barsRaw) {
          if (b.lane < shownLanes) continue;
          for (let col = b.sc; col < b.ec; col++) {
            const forCol = hiddenPerColumn.get(col);
            if (forCol) forCol.push(b.range);
            else hiddenPerColumn.set(col, [b.range]);
          }
        }

        return (
          <div
            key={week[0].date}
            style={{
              position: "relative",
              borderBottom: wi < weeks.length - 1 ? "1px solid var(--border)" : "none",
              minHeight: rowH,
            }}
          >
            <div className="grid grid-cols-7" style={{ minHeight: rowH }}>
              {week.map((cell, di) => {
                const shown = cell.inMonth || showAdjacentDays;
                const isToday = shown && cell.date === today;
                const isWeekend = di >= 5;
                const dayClickable = shown && Boolean(onDayClick);
                return (
                  <div
                    // Seven fixed columns that never reorder: the column is the cell.
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={di}
                    className={
                      shown ? "@container transition-colors hover:bg-[var(--surface-2)]" : ""
                    }
                    role={dayClickable ? "button" : undefined}
                    tabIndex={dayClickable ? 0 : undefined}
                    aria-label={
                      dayClickable
                        ? t.calendar.createRequestDay(
                            formatIsoDate(cell.date, t.common.dateLocale, {
                              day: "numeric",
                              month: "long",
                            })
                          )
                        : undefined
                    }
                    onClick={dayClickable ? () => onDayClick?.(cell.date) : undefined}
                    onKeyDown={
                      dayClickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onDayClick?.(cell.date);
                            }
                          }
                        : undefined
                    }
                    style={{
                      borderRight: di < 6 ? "1px solid var(--border)" : "none",
                      padding: mini ? "4px 5px" : "8px 10px",
                      cursor: dayClickable ? "pointer" : undefined,
                      background: dayTint({ inMonth: cell.inMonth, isWeekend }) ?? "transparent",
                    }}
                  >
                    {shown ? (
                      <DayHeading labelDate={labelled.has(cell.date) ? cell.date : null}>
                        <span
                          className="tnum inline-grid place-items-center rounded-full"
                          style={{
                            minWidth: cellLabelSize,
                            height: cellLabelSize,
                            padding: "0 4px",
                            fontSize: cellFs,
                            fontWeight: isToday ? 700 : 500,
                            background: isToday ? "var(--primary)" : "transparent",
                            color: dayNumberColor({ isToday, inMonth: cell.inMonth, isWeekend }),
                          }}
                        >
                          {cell.day}
                        </span>
                      </DayHeading>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {seam !== null ? <MonthSeam col={seam} /> : null}

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: barsTop,
                bottom: 4,
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gridAutoRows: mini ? "18px" : "26px",
                rowGap: 2,
                padding: "0 3px",
                pointerEvents: "none",
              }}
            >
              {bank.map(({ range: e, span }) => {
                return (
                  <div
                    key={e.id}
                    style={{
                      gridColumn: `${span.startCol + 1} / ${span.endCol + 1}`,
                      gridRow: 1,
                      pointerEvents: "auto",
                      minWidth: 0,
                    }}
                  >
                    <BankHolidayPill
                      label={
                        mini
                          ? t.calendarRecordTypes[CalendarRecordType.BankHoliday].short
                          : (e.note ?? t.calendar.bankHoliday)
                      }
                      names={(e.note ?? t.calendar.bankHoliday).split(" · ")}
                      mini={mini}
                    />
                  </div>
                );
              })}
              {barsRaw
                .filter((b) => b.lane < shownLanes)
                .map((b) => (
                  <div
                    key={b.range.id}
                    className="@container"
                    style={{
                      gridColumn: `${b.sc} / ${b.ec}`,
                      gridRow: bankRows + b.lane + 1,
                      pointerEvents: "auto",
                    }}
                  >
                    <CalBar
                      range={b.range}
                      contL={b.contL}
                      contR={b.contR}
                      mini={mini}
                      onSelect={onSelect}
                    />
                  </div>
                ))}
            </div>

            {!mini && hiddenPerColumn.size > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 5,
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  padding: "0 4px",
                  pointerEvents: "none",
                }}
              >
                {[...hiddenPerColumn.entries()].map(([col, hidden]) => (
                  <div
                    key={col}
                    style={{ gridColumn: `${col} / ${col + 1}`, pointerEvents: "auto" }}
                  >
                    <MoreChip hidden={hidden} date={week[col - 1].date} onSelect={onSelect} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// Helper exported so callers can group single-day vacation rows into contiguous ranges.
export function groupConsecutiveByUserType<
  T extends {
    id?: string;
    userId: string;
    vacationType: CalendarRecordType;
    requestedDay: string;
    user?: UserSummary;
    note?: string | null;
    mirroredFromGroupName?: string | null;
    status?: VacationStatus;
    halfDay?: boolean;
  },
>(items: T[]): CalendarRange[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => {
    if (a.userId !== b.userId) return a.userId < b.userId ? -1 : 1;
    if (a.vacationType !== b.vacationType) return a.vacationType < b.vacationType ? -1 : 1;
    return a.requestedDay < b.requestedDay ? -1 : 1;
  });
  const ranges: CalendarRange[] = [];
  let current: CalendarRange | null = null;
  let lastIsoDay: string | null = null;
  let lastKey: string | null = null;
  for (const item of sorted) {
    const day = item.requestedDay;
    // Everything a bar is drawn or labelled by joins the key, so one bar never
    // spans owned and mirrored, pending and approved, or half and full days.
    const key = [
      item.userId,
      item.vacationType,
      item.mirroredFromGroupName ?? "",
      item.status ?? "",
      item.halfDay ? "half" : "full",
    ].join("|");
    if (current && key === lastKey && lastIsoDay && addDays(lastIsoDay, 1) === day) {
      current.to = day;
      if (item.id) current.vacationIds?.push(item.id);
    } else {
      current = {
        // The grouping key plus the day the range opens on. A counter would
        // renumber every later range whenever this reruns, which is an array
        // index by another name — and `id` is what the calendar keys bars on.
        id: `${key}|${item.requestedDay}`,
        who: item.userId,
        user: item.user,
        type: item.vacationType,
        from: day,
        to: day,
        note: item.note ?? undefined,
        vacationIds: item.id ? [item.id] : [],
        mirroredFrom: item.mirroredFromGroupName ?? null,
        pending: item.status === "pending",
        halfDay: item.halfDay ?? false,
      };
      ranges.push(current);
    }
    lastIsoDay = item.requestedDay;
    lastKey = key;
  }
  return ranges;
}
