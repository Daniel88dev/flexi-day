"use client";

import { useState } from "react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { leaveMetaFor, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { VacationKind, type UserSummary } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

export interface CalendarRange {
  id: string;
  who: string; // person id, or 'all' for bank holidays
  user?: UserSummary; // present when row represents a real user
  type: LeaveTypeKey;
  from: number; // day-of-month, inclusive
  to: number;
  note?: string;
  /** Ids of the vacation rows this bar collapses, in day order. */
  vacationIds?: string[];
  /** Set when the record only shows here via a group mirror; names its source group. */
  mirroredFrom?: string | null;
}

interface LeaveCalendarProps {
  monthDays: number;
  firstWeekdayMondayIdx: number; // 0..6 (Monday=0)
  todayDay?: number | null;
  ranges: CalendarRange[];
  filter?: Set<LeaveTypeKey>;
  mini?: boolean;
  /** Makes bars clickable; receives the first vacation id of the range. */
  onSelect?: (vacationId: string) => void;
  /** Makes empty day cells clickable; receives the day-of-month clicked. */
  onDayClick?: (day: number) => void;
}

/** Bars a week shows before the rest collapse behind the "+N more" toggle. */
export const MAX_LANES = 2;

function buildWeeks(monthDays: number, firstIdxMon: number) {
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstIdxMon; i++) cells.push(null);
  for (let d = 1; d <= monthDays; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
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
  const typeLabel = t.leaveTypes[range.type].label;
  const displayName = u ? firstName(u.name) : everyone;
  const title = `${u ? u.name : everyone} · ${typeLabel}${range.note ? ` · ${range.note}` : ""}${
    range.mirroredFrom ? ` · ${t.calendar.mirroredFrom(range.mirroredFrom)}` : ""
  }`;
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
        background: `color-mix(in oklch, ${meta.cssVar} 16%, var(--surface))`,
        color: `color-mix(in oklch, ${meta.cssVar} 55%, var(--text))`,
        // A mirrored record is only projected into this group, never owned by
        // it — the dashed edge is what tells the two apart at a glance.
        borderLeft: range.mirroredFrom ? `3px dashed ${meta.cssVar}` : `3px solid ${meta.cssVar}`,
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
  day,
  onSelect,
}: {
  hidden: CalendarRange[];
  day: number;
  onSelect?: (vacationId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-[3px] text-[11px] font-semibold whitespace-nowrap text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        aria-label={t.calendar.moreOnDay(hidden.length, day)}
      >
        {t.calendar.moreCount(hidden.length)}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-2 p-2">
        <p
          className="px-1.5 pt-0.5 text-[11px] font-semibold"
          style={{ color: "var(--text-faint)" }}
        >
          {t.calendar.moreOnDay(hidden.length, day)}
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
                  {t.leaveTypes[range.type].label}
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

export function LeaveCalendar({
  monthDays,
  firstWeekdayMondayIdx,
  todayDay = null,
  ranges,
  filter,
  mini = false,
  onSelect,
  onDayClick,
}: LeaveCalendarProps) {
  const { t } = useTranslation();
  const WEEKDAYS = t.calendar.weekdaysShort;
  const weeks = buildWeeks(monthDays, firstWeekdayMondayIdx);
  const active = filter ? ranges.filter((r) => filter.has(r.type)) : ranges;
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
        const weekDayNums = week.filter((d): d is number => d !== null);
        if (weekDayNums.length === 0) return null;
        const weekStart = weekDayNums[0];
        const weekEnd = weekDayNums[weekDayNums.length - 1];

        const bank = active.filter(
          (e) => e.type === VacationKind.BankHoliday && e.from <= weekEnd && e.to >= weekStart
        );
        const barsRaw: PlacedBar[] = active
          .filter(
            (e) => e.type !== VacationKind.BankHoliday && e.from <= weekEnd && e.to >= weekStart
          )
          .map((e) => {
            const cf = Math.max(e.from, weekStart);
            const ct = Math.min(e.to, weekEnd);
            const sc = week.indexOf(cf) + 1;
            const ec = week.indexOf(ct) + 2;
            return {
              range: e,
              sc,
              ec,
              contL: e.from < weekStart,
              contR: e.to > weekEnd,
              lane: 0,
            };
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
            key={wi}
            style={{
              position: "relative",
              borderBottom: wi < weeks.length - 1 ? "1px solid var(--border)" : "none",
              minHeight: rowH,
            }}
          >
            <div className="grid grid-cols-7" style={{ minHeight: rowH }}>
              {week.map((d, di) => {
                const isToday = d !== null && d === todayDay;
                const isWeekend = di >= 5;
                const dayClickable = d !== null && Boolean(onDayClick);
                return (
                  <div
                    key={di}
                    className={d ? "transition-colors hover:bg-[var(--surface-2)]" : ""}
                    role={dayClickable ? "button" : undefined}
                    tabIndex={dayClickable ? 0 : undefined}
                    aria-label={dayClickable ? t.calendar.createRequestDay(d as number) : undefined}
                    onClick={dayClickable ? () => onDayClick?.(d as number) : undefined}
                    onKeyDown={
                      dayClickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onDayClick?.(d as number);
                            }
                          }
                        : undefined
                    }
                    style={{
                      borderRight: di < 6 ? "1px solid var(--border)" : "none",
                      padding: mini ? "4px 5px" : "8px 10px",
                      cursor: dayClickable ? "pointer" : undefined,
                      background:
                        d === null
                          ? "color-mix(in oklch, var(--surface-2) 50%, transparent)"
                          : isWeekend
                            ? "color-mix(in oklch, var(--surface-2) 45%, transparent)"
                            : "transparent",
                    }}
                  >
                    {d ? (
                      <span
                        className="tnum inline-grid place-items-center rounded-full"
                        style={{
                          minWidth: cellLabelSize,
                          height: cellLabelSize,
                          padding: "0 4px",
                          fontSize: cellFs,
                          fontWeight: isToday ? 700 : 500,
                          background: isToday ? "var(--primary)" : "transparent",
                          color: isToday
                            ? "var(--primary-fg)"
                            : isWeekend
                              ? "var(--text-faint)"
                              : "var(--text-muted)",
                        }}
                      >
                        {d}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

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
              {bank.map((e, i) => {
                const cf = Math.max(e.from, weekStart);
                const ct = Math.min(e.to, weekEnd);
                return (
                  <div
                    key={`b${i}`}
                    style={{
                      gridColumn: `${week.indexOf(cf) + 1} / ${week.indexOf(ct) + 2}`,
                      gridRow: 1,
                      pointerEvents: "auto",
                    }}
                  >
                    <div
                      style={{
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
                      }}
                    >
                      {mini
                        ? t.leaveTypes[VacationKind.BankHoliday].short
                        : `🎉 ${e.note ?? t.calendar.bankHoliday}`}
                    </div>
                  </div>
                );
              })}
              {barsRaw
                .filter((b) => b.lane < shownLanes)
                .map((b, i) => (
                  <div
                    key={i}
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
                    <MoreChip hidden={hidden} day={week[col - 1] as number} onSelect={onSelect} />
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
    vacationType: LeaveTypeKey;
    requestedDay: string;
    user?: UserSummary;
    note?: string | null;
    mirroredFromGroupName?: string | null;
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
  let seq = 0;
  for (const item of sorted) {
    const day = Number(item.requestedDay.slice(8, 10));
    // The source group is part of the key so a bar never spans records the
    // viewer owns and records only mirrored in — they are labelled differently.
    const key = `${item.userId}|${item.vacationType}|${item.mirroredFromGroupName ?? ""}`;
    if (current && key === lastKey && lastIsoDay && isNextDay(lastIsoDay, item.requestedDay)) {
      current.to = day;
      if (item.id) current.vacationIds?.push(item.id);
    } else {
      current = {
        id: `r${seq++}`,
        who: item.userId,
        user: item.user,
        type: item.vacationType,
        from: day,
        to: day,
        note: item.note ?? undefined,
        vacationIds: item.id ? [item.id] : [],
        mirroredFrom: item.mirroredFromGroupName ?? null,
      };
      ranges.push(current);
    }
    lastIsoDay = item.requestedDay;
    lastKey = key;
  }
  return ranges;
}

function isNextDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return db.getTime() - da.getTime() === 24 * 60 * 60 * 1000;
}
