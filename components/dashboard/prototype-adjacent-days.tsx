"use client";

// PROTOTYPE (T-265): throwaway. Three variants of the adjacent-month days in the dashboard
// month grid, switchable with ?variant=A|B|C, plus ?view=lanes|stripes and ?fixtures=0.
// Lives on prototype/calendar-adjacent-days only; never merge.

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { DayList } from "@/components/dashboard/day-list";
import { PrototypeSwitcher } from "@/components/dev/prototype-switcher";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBankHolidaysMulti, useVacations } from "@/lib/api/queries";
import {
  CalendarRecordType,
  isKnownCalendarRecordType,
  vacationStatus,
  type UserSummary,
} from "@/lib/api/types";
import type { DayRecord } from "@/lib/calendar/stripes";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import { useTranslation } from "@/lib/i18n/use-translation";

export const ADJACENT_VARIANTS = [
  { key: "A", name: "Quiet numbers" },
  { key: "B", name: "Faded month" },
  { key: "C", name: "Month seam" },
] as const;
type Variant = (typeof ADJACENT_VARIANTS)[number]["key"];

const DAY_MS = 86_400_000;
const isoFor = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const ordOf = (iso: string) =>
  Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DAY_MS;
const isoOf = (ord: number) => new Date(ord * DAY_MS).toISOString().slice(0, 10);
const mondayIdx = (ord: number) => (new Date(ord * DAY_MS).getUTCDay() + 6) % 7;

type Cell = { ord: number; iso: string; day: number; col: number; inMonth: boolean };

function paddedWeeks(year: number, month: number): Cell[][] {
  const first = ordOf(isoFor(year, month, 1));
  const last = ordOf(isoFor(year, month, new Date(year, month, 0).getDate()));
  const start = first - mondayIdx(first);
  const end = last + 6 - mondayIdx(last);
  const weeks: Cell[][] = [];
  for (let o = start; o <= end; o += 7) {
    weeks.push(
      Array.from({ length: 7 }, (_, col) => {
        const iso = isoOf(o + col);
        return {
          ord: o + col,
          iso,
          day: Number(iso.slice(8, 10)),
          col,
          inMonth: o + col >= first && o + col <= last,
        };
      })
    );
  }
  return weeks;
}

type Rec = DayRecord & { ord: number; note?: string };
type Bar = {
  id: string;
  userId: string;
  user?: UserSummary;
  type: CalendarRecordType;
  from: number;
  to: number;
  pending: boolean;
  halfDay: boolean;
  mirroredFrom: string | null;
  vacationIds: string[];
  fixture?: boolean;
};

function toBars(records: Rec[]): Bar[] {
  const key = (r: Rec) =>
    [r.userId, r.type, r.mirroredFrom ?? "", r.pending, r.halfDay ? "half" : "full"].join("|");
  const sorted = [...records].sort((a, b) => key(a).localeCompare(key(b)) || a.ord - b.ord);
  const bars: Bar[] = [];
  let current: Bar | null = null;
  let currentKey = "";
  for (const r of sorted) {
    if (current && key(r) === currentKey && r.ord === current.to + 1) {
      current.to = r.ord;
      if (!r.id.startsWith("fixture")) current.vacationIds.push(r.id);
      continue;
    }
    current = {
      id: `${key(r)}|${r.ord}`,
      userId: r.userId,
      user: r.user,
      type: r.type,
      from: r.ord,
      to: r.ord,
      pending: r.pending,
      halfDay: r.halfDay,
      mirroredFrom: r.mirroredFrom,
      vacationIds: r.id.startsWith("fixture") ? [] : [r.id],
      fixture: r.id.startsWith("fixture"),
    };
    currentKey = key(r);
    bars.push(current);
  }
  return bars;
}

const PAT: UserSummary = {
  id: "fixture-pat",
  name: "Pat Fixture",
  initials: "PF",
  avatarColor: "hsl(280 55% 62%)",
};
const QUINN: UserSummary = {
  id: "fixture-quinn",
  name: "Quinn Fixture",
  initials: "QF",
  avatarColor: "hsl(30 70% 58%)",
};

/** Boundary-crossing and pending-on-a-dimmed-day records, so every month shows the cases. */
function fixtures(year: number, month: number, viewer: UserSummary): Rec[] {
  const first = ordOf(isoFor(year, month, 1));
  const last = ordOf(isoFor(year, month, new Date(year, month, 0).getDate()));
  const rec = (
    n: number,
    ord: number,
    user: UserSummary,
    type: CalendarRecordType,
    pending: boolean
  ): Rec => ({
    id: `fixture-${n}-${ord}`,
    ord,
    day: Number(isoOf(ord).slice(8, 10)),
    userId: user.id,
    user,
    type,
    pending,
    halfDay: false,
    mirroredFrom: null,
  });
  return [
    ...[-2, -1, 0, 1].map((o) => rec(1, first + o, viewer, CalendarRecordType.Vacation, false)),
    rec(2, first - 3, PAT, CalendarRecordType.Vacation, true),
    ...[-1, 0, 1, 2].map((o) => rec(3, last + o, QUINN, CalendarRecordType.Sick, false)),
    rec(4, last + 1, PAT, CalendarRecordType.HomeOffice, true),
    rec(4, last + 2, PAT, CalendarRecordType.HomeOffice, true),
  ];
}

function shiftMonth(year: number, month: number, delta: number) {
  const i = year * 12 + month - 1 + delta;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

function usePaddedData({
  year,
  month,
  groupId,
  holidayCountries,
  viewer,
  withFixtures,
}: {
  year: number;
  month: number;
  groupId: string | null;
  holidayCountries: string[];
  viewer: UserSummary;
  withFixtures: boolean;
}) {
  const weeks = useMemo(() => paddedWeeks(year, month), [year, month]);
  const fromIso = weeks[0][0].iso;
  const toIso = weeks[weeks.length - 1][6].iso;
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const a = useVacations({ ...prev, groupId });
  const b = useVacations({ year, month, groupId });
  const c = useVacations({ ...next, groupId });
  const hFirst = useBankHolidaysMulti(Number(fromIso.slice(0, 4)), holidayCountries);
  const hLast = useBankHolidaysMulti(Number(toIso.slice(0, 4)), holidayCountries);

  const records = useMemo(() => {
    const real: Rec[] = [...(a.data ?? []), ...(b.data ?? []), ...(c.data ?? [])]
      .filter((v) => v.requestedDay >= fromIso && v.requestedDay <= toIso)
      .filter((v) => vacationStatus(v) !== "rejected" && vacationStatus(v) !== "cancelled")
      .filter((v) => isKnownCalendarRecordType(v.vacationType))
      .map((v) => ({
        id: v.id,
        ord: ordOf(v.requestedDay),
        day: Number(v.requestedDay.slice(8, 10)),
        userId: v.userId,
        user: v.user,
        type: v.vacationType,
        halfDay: v.halfDay,
        pending: vacationStatus(v) === "pending",
        mirroredFrom: v.mirroredFromGroupName ?? null,
        note: v.note ?? undefined,
      }));
    const extra = withFixtures
      ? fixtures(year, month, viewer).filter(
          (r) => r.ord >= ordOf(fromIso) && r.ord <= ordOf(toIso)
        )
      : [];
    return [...real, ...extra];
  }, [a.data, b.data, c.data, fromIso, toIso, withFixtures, year, month, viewer]);

  const holidays = useMemo(() => {
    const byOrd = new Map<number, string[]>();
    for (const h of [...hFirst, ...hLast]) {
      if (h.date < fromIso || h.date > toIso) continue;
      const names = byOrd.get(ordOf(h.date)) ?? [];
      if (!names.includes(h.name)) names.push(h.name);
      byOrd.set(ordOf(h.date), names);
    }
    return byOrd;
  }, [hFirst, hLast, fromIso, toIso]);

  return { weeks, records, holidays };
}

/** One bar's pieces in a week: B splits it where the month changes so each piece fades alone. */
type Segment = {
  sc: number;
  ec: number;
  contL: boolean;
  contR: boolean;
  faded: boolean;
  label: boolean;
};

function segmentsFor(
  week: Cell[],
  bar: Bar,
  variant: Variant
): { sc: number; ec: number; segments: Segment[] } {
  const ws = week[0].ord;
  const we = week[6].ord;
  const sc = Math.max(bar.from, ws) - ws;
  const ec = Math.min(bar.to, we) - ws + 1;
  const contL = bar.from < ws;
  const contR = bar.to > we;
  if (variant !== "B") {
    return { sc, ec, segments: [{ sc, ec, contL, contR, faded: false, label: !contL }] };
  }
  const segments: Segment[] = [];
  let s = sc;
  for (let col = sc + 1; col <= ec; col++) {
    if (col === ec || week[col].inMonth !== week[s].inMonth) {
      segments.push({
        sc: s,
        ec: col,
        contL: s === sc ? contL : true,
        contR: col === ec ? contR : true,
        faded: !week[s].inMonth,
        label: s === sc && !contL,
      });
      s = col;
    }
  }
  return { sc, ec, segments };
}

const FADE = 0.4;

function useMonthShort() {
  const { t } = useTranslation();
  return (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(t.common.dateLocale, { month: "short" });
}

/** C: the seam sits on the left edge of whichever cell opens a month. */
function seamCol(week: Cell[]): number | null {
  for (let i = 1; i < 7; i++) if (week[i].day === 1) return i;
  return null;
}

function labelledCell(weeks: Cell[][], cell: Cell): boolean {
  if (cell.inMonth) return false;
  if (cell.ord === weeks[0][0].ord) return true;
  return cell.day === 1;
}

function DayNumber({
  cell,
  isToday,
  variant,
  labelled,
  size,
  fontSize,
}: {
  cell: Cell;
  isToday: boolean;
  variant: Variant;
  labelled: boolean;
  size: number;
  fontSize: number;
}) {
  const monthShort = useMonthShort();
  const weekend = cell.col >= 5;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="tnum inline-grid place-items-center rounded-full"
        style={{
          minWidth: size,
          height: size,
          padding: "0 4px",
          fontSize,
          fontWeight: isToday ? 700 : 500,
          background: isToday ? "var(--primary)" : "transparent",
          color: isToday
            ? "var(--primary-fg)"
            : !cell.inMonth
              ? "color-mix(in oklch, var(--text-faint) 70%, transparent)"
              : weekend
                ? "var(--text-faint)"
                : "var(--text-muted)",
        }}
      >
        {cell.day}
      </span>
      {variant === "C" && labelled ? (
        <span
          className="text-[11px] font-semibold tracking-[.03em] uppercase"
          style={{ color: "var(--text-faint)" }}
        >
          {monthShort(cell.iso)}
        </span>
      ) : null}
    </span>
  );
}

const MAX_LANES = 2;

function LanesGrid({
  weeks,
  records,
  holidays,
  variant,
  todayIso,
  filter,
  onOpenRequest,
  onBook,
}: GridProps) {
  const { t } = useTranslation();
  const bars = useMemo(() => toBars(records.filter((r) => filter.has(r.type))), [records, filter]);
  const showBank = filter.has(CalendarRecordType.BankHoliday);
  const rowH = 118;

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        className="grid grid-cols-7"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        {t.calendar.weekdaysShort.map((w, i) => (
          <div
            key={w}
            style={{
              padding: "11px 14px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: i >= 5 ? "var(--text-faint)" : "var(--text-muted)",
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const ws = week[0].ord;
        const we = week[6].ord;
        const bankCells = showBank ? week.filter((c) => holidays.has(c.ord)) : [];
        const placed = bars
          .filter((b) => b.from <= we && b.to >= ws)
          .map((b) => ({ bar: b, ...segmentsFor(week, b, variant), lane: 0 }))
          .sort((x, y) => x.sc - y.sc || y.ec - y.sc - (x.ec - x.sc));
        const lanes: (typeof placed)[] = [];
        for (const p of placed) {
          const free = lanes.findIndex((l) => l.every((q) => p.sc >= q.ec || p.ec <= q.sc));
          p.lane = free >= 0 ? free : lanes.length;
          if (free >= 0) lanes[free].push(p);
          else lanes.push([p]);
        }
        const bankRows = bankCells.length > 0 ? 1 : 0;
        const shownLanes = MAX_LANES - bankRows;
        const hidden = new Map<number, number>();
        for (const p of placed) {
          if (p.lane < shownLanes) continue;
          for (let c = p.sc; c < p.ec; c++) hidden.set(c, (hidden.get(c) ?? 0) + 1);
        }
        const seam = variant === "C" ? seamCol(week) : null;

        return (
          <div
            key={ws}
            style={{
              position: "relative",
              minHeight: rowH,
              borderBottom: wi < weeks.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div className="grid grid-cols-7" style={{ minHeight: rowH }}>
              {week.map((cell) => (
                <div
                  key={cell.ord}
                  role="button"
                  tabIndex={0}
                  aria-label={t.calendar.createRequestDay(cell.day)}
                  onClick={() => onBook(cell.iso)}
                  className="cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                  style={{
                    borderRight: cell.col < 6 ? "1px solid var(--border)" : "none",
                    padding: "8px 10px",
                    background: !cell.inMonth
                      ? "color-mix(in oklch, var(--surface-2) 50%, transparent)"
                      : cell.col >= 5
                        ? "color-mix(in oklch, var(--surface-2) 45%, transparent)"
                        : "transparent",
                  }}
                >
                  <DayNumber
                    cell={cell}
                    isToday={cell.iso === todayIso}
                    variant={variant}
                    labelled={labelledCell(weeks, cell)}
                    size={24}
                    fontSize={13}
                  />
                </div>
              ))}
            </div>

            {seam !== null ? <Seam col={seam} /> : null}

            <div
              style={{
                position: "absolute",
                inset: "38px 0 4px 0",
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gridAutoRows: "26px",
                rowGap: 2,
                padding: "0 3px",
                pointerEvents: "none",
              }}
            >
              {bankCells.map((cell) => (
                <div
                  key={cell.ord}
                  title={holidays.get(cell.ord)?.join(" · ")}
                  style={{
                    gridColumn: `${cell.col + 1} / ${cell.col + 2}`,
                    gridRow: 1,
                    opacity: variant === "B" && !cell.inMonth ? FADE : 1,
                    height: 24,
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "var(--c-bank)",
                    background: "color-mix(in oklch, var(--c-bank) 16%, var(--surface))",
                    border: "1px dashed color-mix(in oklch, var(--c-bank) 40%, transparent)",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  🎉 {holidays.get(cell.ord)?.join(" · ")}
                </div>
              ))}
              {placed
                .filter((p) => p.lane < shownLanes)
                .flatMap((p) =>
                  p.segments.map((s) => (
                    <div
                      key={`${p.bar.id}-${s.sc}`}
                      className="@container"
                      style={{
                        gridColumn: `${s.sc + 1} / ${s.ec + 1}`,
                        gridRow: bankRows + p.lane + 1,
                        pointerEvents: "auto",
                        opacity: s.faded ? FADE : 1,
                      }}
                    >
                      <LaneBar bar={p.bar} segment={s} onOpenRequest={onOpenRequest} />
                    </div>
                  ))
                )}
            </div>

            {hidden.size > 0 ? (
              <div
                style={{
                  position: "absolute",
                  inset: "auto 0 5px 0",
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  padding: "0 4px",
                  pointerEvents: "none",
                }}
              >
                {[...hidden].map(([col, n]) => (
                  <span
                    key={col}
                    style={{
                      gridColumn: `${col + 1} / ${col + 2}`,
                      opacity: variant === "B" && !week[col].inMonth ? FADE : 1,
                    }}
                    className="w-fit rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-[3px] text-[11px] font-semibold text-[var(--text-muted)]"
                  >
                    {t.calendar.moreCount(n)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Seam({ col }: { col: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `calc(${(col / 7) * 100}% - 1px)`,
        width: 2,
        background: "var(--text-faint)",
        opacity: 0.55,
        pointerEvents: "none",
      }}
    />
  );
}

function LaneBar({
  bar,
  segment,
  onOpenRequest,
}: {
  bar: Bar;
  segment: Segment;
  onOpenRequest: (id: string) => void;
}) {
  const { t } = useTranslation();
  const meta = leaveMetaFor(bar.type);
  const u = bar.user;
  const name = u ? (u.name.split(" ")[0] ?? u.name) : t.calendar.everyone;
  const vacationId = bar.vacationIds[0];
  const { contL, contR } = segment;
  return (
    <div
      title={[
        u?.name,
        bar.type,
        bar.pending ? t.status.pending : null,
        bar.fixture ? "fixture" : null,
      ]
        .filter(Boolean)
        .join(" · ")}
      onClick={vacationId ? () => onOpenRequest(vacationId) : undefined}
      style={{
        height: 24,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 7px 0 5px",
        overflow: "hidden",
        cursor: vacationId ? "pointer" : "default",
        background: `color-mix(in oklch, ${meta.cssVar} ${bar.pending ? 8 : 16}%, var(--surface))`,
        color: `color-mix(in oklch, ${meta.cssVar} 55%, var(--text))`,
        ...(bar.pending
          ? { border: `1px dashed ${meta.cssVar}` }
          : { borderLeft: contL ? "none" : `3px solid ${meta.cssVar}` }),
        borderRadius: `${contL ? 0 : 7}px ${contR ? 0 : 7}px ${contR ? 0 : 7}px ${contL ? 0 : 7}px`,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        marginLeft: contL ? -1 : 0,
        marginRight: contR ? -1 : 0,
      }}
    >
      {u && segment.label ? (
        <AvatarBubble initials={u.initials} background={u.avatarColor} name={u.name} size={16} />
      ) : null}
      {segment.label ? (
        <span className="hidden overflow-hidden text-ellipsis @min-[64px]:inline">{name}</span>
      ) : null}
    </div>
  );
}

const MAX_STRIPES = 3;

function StripesGrid({
  weeks,
  records,
  holidays,
  variant,
  todayIso,
  filter,
  viewerId,
  onOpenRequest,
  onBook,
}: GridProps) {
  const { t } = useTranslation();
  const [openOrd, setOpenOrd] = useState<number | null>(null);
  const visible = useMemo(() => records.filter((r) => filter.has(r.type)), [records, filter]);
  const bars = useMemo(() => toBars(visible), [visible]);
  const showBank = filter.has(CalendarRecordType.BankHoliday);
  const longDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(t.common.dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  const shortDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(t.common.dateLocale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        className="grid grid-cols-7"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        {t.calendar.weekdaysShort.map((w, i) => (
          <div
            key={w}
            className="px-3.5 py-[11px] text-[12px] font-semibold tracking-[.04em] uppercase"
            style={{ color: i >= 5 ? "var(--text-faint)" : "var(--text-muted)" }}
          >
            {w}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const ws = week[0].ord;
        const we = week[6].ord;
        const viewerFirst = (b: Bar) => (b.userId === viewerId ? 0 : 1);
        const placed = bars
          .filter((b) => b.from <= we && b.to >= ws)
          .map((b) => ({ bar: b, ...segmentsFor(week, b, variant), lane: 0 }))
          .sort(
            (x, y) =>
              viewerFirst(x.bar) - viewerFirst(y.bar) || x.sc - y.sc || y.ec - y.sc - (x.ec - x.sc)
          );
        const lanes: (typeof placed)[] = [];
        for (const p of placed) {
          const free = lanes.findIndex((l) => l.every((q) => p.sc >= q.ec || p.ec <= q.sc));
          p.lane = free >= 0 ? free : lanes.length;
          if (free >= 0) lanes[free].push(p);
          else lanes.push([p]);
        }
        const more = new Map<number, number>();
        for (const p of placed) {
          if (p.lane < MAX_STRIPES) continue;
          for (let c = p.sc; c < p.ec; c++) more.set(c, (more.get(c) ?? 0) + 1);
        }
        const seam = variant === "C" ? seamCol(week) : null;

        return (
          <div
            key={ws}
            className="relative"
            style={{ borderBottom: wi < weeks.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="grid min-h-[92px] grid-cols-7">
              {week.map((cell) => {
                const holiday = showBank ? holidays.get(cell.ord)?.join(" · ") : undefined;
                const entries = visible
                  .filter((r) => r.ord === cell.ord)
                  .sort((a, b) => (a.userId === viewerId ? -1 : b.userId === viewerId ? 1 : 0));
                const fadeCell = variant === "B" && !cell.inMonth;
                return (
                  <Popover
                    key={cell.ord}
                    open={openOrd === cell.ord}
                    onOpenChange={(open) => setOpenOrd(open ? cell.ord : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="relative min-w-0 cursor-pointer px-2.5 pt-2 pb-1 text-left align-top transition-colors outline-none hover:bg-[var(--surface-2)]"
                        style={{
                          borderRight: cell.col < 6 ? "1px solid var(--border)" : "none",
                          background: holiday
                            ? `color-mix(in oklch, var(--c-bank) ${fadeCell ? 6 : 13}%, transparent)`
                            : !cell.inMonth
                              ? "color-mix(in oklch, var(--surface-2) 50%, transparent)"
                              : cell.col >= 5
                                ? "color-mix(in oklch, var(--surface-2) 45%, transparent)"
                                : undefined,
                        }}
                      >
                        <span className="absolute top-2 left-2.5">
                          <DayNumber
                            cell={cell}
                            isToday={cell.iso === todayIso}
                            variant={variant}
                            labelled={labelledCell(weeks, cell)}
                            size={24}
                            fontSize={13}
                          />
                        </span>
                        {holiday ? (
                          <span
                            className="absolute bottom-1 left-2.5 max-w-[calc(100%-2.5rem)] truncate text-[10.5px] font-semibold"
                            style={{
                              color: "color-mix(in oklch, var(--c-bank) 80%, var(--text))",
                              opacity: fadeCell ? FADE : 1,
                            }}
                          >
                            {holiday}
                          </span>
                        ) : null}
                        {more.get(cell.col) ? (
                          <span
                            className="tnum absolute right-2 bottom-1 text-[11px] font-semibold"
                            style={{ color: "var(--text-muted)", opacity: fadeCell ? FADE : 1 }}
                          >
                            +{more.get(cell.col)}
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
                        title={longDate(cell.iso)}
                        shortDate={shortDate(cell.iso)}
                        entries={entries}
                        holiday={holiday}
                        viewerId={viewerId}
                        onOpenRequest={(id) => {
                          setOpenOrd(null);
                          if (!id.startsWith("fixture")) onOpenRequest(id);
                        }}
                        onBook={() => {
                          setOpenOrd(null);
                          onBook(cell.iso);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>

            {seam !== null ? <Seam col={seam} /> : null}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[42px] grid grid-cols-7 gap-y-[5px]"
              style={{ gridTemplateRows: `repeat(${MAX_STRIPES}, auto)` }}
            >
              {placed
                .filter((p) => p.lane < MAX_STRIPES)
                .flatMap((p) =>
                  p.segments.map((s) => (
                    <div
                      key={`${p.bar.id}-${s.sc}`}
                      className="h-[7px]"
                      style={{
                        gridColumn: `${s.sc + 1} / ${s.ec + 1}`,
                        gridRow: p.lane + 1,
                        marginLeft: s.contL ? 0 : 5,
                        marginRight: s.contR ? 0 : 5,
                        background: leaveMetaFor(p.bar.type).cssVar,
                        opacity: (p.bar.pending ? 0.4 : 1) * (s.faded ? FADE : 1),
                        borderRadius: `${s.contL ? 0 : 999}px ${s.contR ? 0 : 999}px ${
                          s.contR ? 0 : 999
                        }px ${s.contL ? 0 : 999}px`,
                      }}
                    />
                  ))
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type GridProps = {
  weeks: Cell[][];
  records: Rec[];
  holidays: Map<number, string[]>;
  variant: Variant;
  todayIso: string;
  filter: Set<CalendarRecordType>;
  viewerId: string | null;
  onOpenRequest: (vacationId: string) => void;
  onBook: (iso: string) => void;
};

export function AdjacentDaysPrototype({
  year,
  month,
  groupId,
  holidayCountries,
  filter,
  viewerId,
  viewerName,
  storedView,
  onOpenRequest,
  onBook,
}: {
  year: number;
  month: number;
  groupId: string | null;
  holidayCountries: string[];
  filter: Set<CalendarRecordType>;
  viewerId: string | null;
  viewerName: string;
  storedView: "lanes" | "stripes";
  onOpenRequest: (vacationId: string) => void;
  onBook: (iso: string) => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const variant = (ADJACENT_VARIANTS.find((v) => v.key === params.get("variant"))?.key ??
    "A") as Variant;
  const view = (params.get("view") as "lanes" | "stripes" | null) ?? storedView;
  const withFixtures = params.get("fixtures") !== "0";

  const viewer = useMemo<UserSummary>(
    () => ({
      id: viewerId ?? "fixture-viewer",
      name: viewerName,
      initials: viewerName.slice(0, 2).toUpperCase(),
      avatarColor: "hsl(200 60% 55%)",
    }),
    [viewerId, viewerName]
  );
  const { weeks, records, holidays } = usePaddedData({
    year,
    month,
    groupId,
    holidayCountries,
    viewer,
    withFixtures,
  });

  const setParam = (key: string, value: string) => {
    const search = new URLSearchParams(params.toString());
    search.set(key, value);
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  };

  const props: GridProps = {
    weeks,
    records,
    holidays,
    variant,
    todayIso: isoFor(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
    filter,
    viewerId,
    onOpenRequest,
    onBook,
  };

  return (
    <>
      {view === "stripes" ? (
        <StripesGrid key={`${year}-${month}`} {...props} />
      ) : (
        <LanesGrid {...props} />
      )}
      <PrototypeSwitcher
        variants={ADJACENT_VARIANTS}
        extra={
          <>
            <span className="mx-1 h-4 w-px bg-white/30" />
            <button
              type="button"
              onClick={() => setParam("view", view === "lanes" ? "stripes" : "lanes")}
              className="rounded-full px-2.5 py-1 hover:bg-white/15"
            >
              {view === "lanes" ? "Lanes" : "Stripes"} ⇄
            </button>
            <button
              type="button"
              onClick={() => setParam("fixtures", withFixtures ? "0" : "1")}
              className="rounded-full px-2.5 py-1 hover:bg-white/15"
            >
              fixtures {withFixtures ? "on" : "off"}
            </button>
          </>
        }
      />
    </>
  );
}
