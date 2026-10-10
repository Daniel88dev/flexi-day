"use client";

// PROTOTYPE (T-266): throwaway. Three looks for drag-to-select a range on the dashboard month
// grid, switchable with ?drag=A|B|C, plus ?view=lanes|stripes and ?fixtures=0. The grid is the
// "Month seam" adjacent-days grid picked in T-265. The gesture is identical in every variant;
// only the selection visuals and the hover cue change.
// Lives on prototype/calendar-drag-range only; never merge.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

export const DRAG_VARIANTS = [
  { key: "A", name: "Wash" },
  { key: "B", name: "Band" },
  { key: "C", name: "Draft bar" },
] as const;
type Variant = (typeof DRAG_VARIANTS)[number]["key"];

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

/** Boundary-crossing bars, pending bars, and two booked days of the viewer's mid-month. */
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
    ...[13, 14].map((o) => rec(5, first + o, viewer, CalendarRecordType.HomeOffice, true)),
    ...[11, 12, 13, 14, 15].map((o) => rec(6, first + o, PAT, CalendarRecordType.Vacation, false)),
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

/* ---------- drag gesture: shared by every variant ---------- */

type Drag = { anchor: number; head: number; x: number; y: number; active: boolean };

function ordAt(x: number, y: number): number | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const o = el.closest("[data-ord]")?.getAttribute("data-ord");
    if (o) return Number(o);
  }
  return null;
}

function useCanDrag() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    const on = () => setOk(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return ok;
}

function useDragRange(onCommit: (lo: number, hi: number) => void) {
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const commitRef = useRef(onCommit);
  useEffect(() => {
    commitRef.current = onCommit;
  });
  const setDrag = (d: Drag | null) => {
    dragRef.current = d;
    setDragState(d);
  };

  const onCellPointerDown = (e: ReactPointerEvent, ord: number) => {
    if (e.button !== 0 || e.pointerType !== "mouse" || window.innerWidth < 768) return;
    e.preventDefault();
    setDrag({ anchor: ord, head: ord, x: e.clientX, y: e.clientY, active: false });

    const move = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const head = ordAt(ev.clientX, ev.clientY) ?? cur.head;
      const active = cur.active || head !== cur.anchor;
      if (active) suppressClick.current = true;
      setDrag({ ...cur, head, x: ev.clientX, y: ev.clientY, active });
    };
    const key = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setDrag(null);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
      const cur = dragRef.current;
      setDrag(null);
      if (cur?.active)
        commitRef.current(Math.min(cur.anchor, cur.head), Math.max(cur.anchor, cur.head));
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
  };

  const sel =
    drag?.active === true
      ? {
          lo: Math.min(drag.anchor, drag.head),
          hi: Math.max(drag.anchor, drag.head),
          head: drag.head,
        }
      : null;
  return { drag, sel, suppressClick, onCellPointerDown };
}

type Sel = { lo: number; hi: number; head: number };

function useRangeLabel(locale: string) {
  return useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
    return (lo: number, hi: number) =>
      lo === hi
        ? f.format(new Date(lo * DAY_MS))
        : f.formatRange(new Date(lo * DAY_MS), new Date(hi * DAY_MS));
  }, [locale]);
}

function workingDays(lo: number, hi: number, holidays: Map<number, string[]>) {
  let n = 0;
  for (let o = lo; o <= hi; o++) if (mondayIdx(o) < 5 && !holidays.has(o)) n++;
  return n;
}

const PRIMARY_MIX = (pct: number, base = "var(--surface)") =>
  `color-mix(in oklch, var(--primary) ${pct}%, ${base})`;
const WARN_MIX = (pct: number, base = "var(--surface)") =>
  `color-mix(in oklch, var(--destructive) ${pct}%, ${base})`;
const HATCH = `repeating-linear-gradient(135deg, ${WARN_MIX(38, "transparent")} 0 5px, transparent 5px 11px)`;

/** A: the wash replaces the cell's own background. C: a much lighter version of the same. */
function cellSelBg(variant: Variant, sel: Sel | null, ord: number, booked: Set<number>) {
  if (!sel || ord < sel.lo || ord > sel.hi) return undefined;
  const hit = booked.has(ord);
  if (variant === "A") return hit ? WARN_MIX(20) : PRIMARY_MIX(17);
  if (variant === "C") return hit ? WARN_MIX(8) : PRIMARY_MIX(6);
  return undefined;
}

type Span = { sc: number; ec: number; contL: boolean; contR: boolean };
function spanIn(week: Cell[], lo: number, hi: number): Span | null {
  const ws = week[0].ord;
  const we = week[6].ord;
  if (hi < ws || lo > we) return null;
  return {
    sc: Math.max(lo, ws) - ws,
    ec: Math.min(hi, we) - ws + 1,
    contL: lo < ws,
    contR: hi > we,
  };
}
const colLeft = (col: number, inset = 0) => `calc(${(col / 7) * 100}% + ${inset}px)`;
const colWidth = (cols: number, inset = 0) => `calc(${(cols / 7) * 100}% - ${inset}px)`;

/** Everything a variant draws over one week row while a drag is live. */
function SelectionLayer({
  week,
  sel,
  booked,
  variant,
  label,
  slot,
}: {
  week: Cell[];
  sel: Sel | null;
  booked: Set<number>;
  variant: Variant;
  label: string;
  slot: { bottom: number; height: number };
}) {
  if (!sel || variant === "A") return null;
  const span = spanIn(week, sel.lo, sel.hi);
  if (!span) return null;
  const { sc, ec, contL, contR } = span;
  const ws = week[0].ord;
  const headCol = sel.head >= ws && sel.head <= week[6].ord ? sel.head - ws : null;
  const headAtEnd = sel.head === sel.hi;
  const bookedCols = week.filter((c) => c.ord >= sel.lo && c.ord <= sel.hi && booked.has(c.ord));
  const radius = (r: number) =>
    `${contL ? 0 : r}px ${contR ? 0 : r}px ${contR ? 0 : r}px ${contL ? 0 : r}px`;
  const insetL = contL ? 0 : 3;
  const insetR = contR ? 0 : 3;

  if (variant === "B") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }}>
        {bookedCols.map((c) => (
          <div
            key={c.ord}
            className="absolute inset-y-0"
            style={{ left: colLeft(c.col), width: colWidth(1), background: HATCH }}
          />
        ))}
        <div
          className="absolute"
          style={{
            top: 3,
            bottom: 3,
            left: colLeft(sc, insetL),
            width: colWidth(ec - sc, insetL + insetR),
            border: "2px solid var(--primary)",
            borderLeftWidth: contL ? 0 : 2,
            borderRightWidth: contR ? 0 : 2,
            borderRadius: radius(9),
            background: PRIMARY_MIX(7, "transparent"),
          }}
        />
        {headCol !== null ? (
          <div
            className="tnum absolute rounded-full px-2 py-[3px] text-[11.5px] font-bold whitespace-nowrap shadow-md"
            style={{
              top: 7,
              ...(headAtEnd
                ? { left: colLeft(headCol + 1, -8), transform: "translateX(-100%)" }
                : { left: colLeft(headCol, 8) }),
              background: "var(--primary)",
              color: "var(--primary-fg)",
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }}>
      <div
        className="absolute flex items-center gap-1.5 overflow-hidden px-2 text-[11.5px] font-bold whitespace-nowrap"
        style={{
          bottom: slot.bottom,
          height: slot.height,
          left: colLeft(sc, insetL),
          width: colWidth(ec - sc, insetL + insetR),
          justifyContent: headAtEnd ? "flex-end" : "flex-start",
          border: "1.5px dashed var(--primary)",
          borderLeftStyle: contL ? "none" : "dashed",
          borderRightStyle: contR ? "none" : "dashed",
          borderRadius: radius(7),
          background: PRIMARY_MIX(16),
          color: "var(--primary-strong)",
        }}
      />
      {bookedCols.map((c) => (
        <div
          key={c.ord}
          className="absolute grid place-items-center text-[11px] font-bold"
          style={{
            bottom: slot.bottom,
            height: slot.height,
            left: colLeft(c.col, 1),
            width: colWidth(1, 2),
            background: `${HATCH}, ${WARN_MIX(14)}`,
            color: "var(--destructive)",
            borderRadius: 4,
          }}
        >
          !
        </div>
      ))}
      {headCol !== null ? (
        <div
          className="tnum absolute flex items-center text-[11.5px] font-bold whitespace-nowrap"
          style={{
            bottom: slot.bottom,
            height: slot.height,
            ...(headAtEnd
              ? { left: colLeft(headCol + 1, -10), transform: "translateX(-100%)" }
              : { left: colLeft(headCol, 10) }),
            color: "var(--primary-strong)",
          }}
        >
          <span className="rounded px-1" style={{ background: PRIMARY_MIX(16) }}>
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** A follows the pointer; B and C pin their label to the grid instead. */
function CursorLabel({ drag, label, warn }: { drag: Drag; label: string; warn: string | null }) {
  return (
    <div
      className="tnum pointer-events-none fixed z-[90] rounded-md px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap shadow-lg"
      style={{
        left: drag.x + 14,
        top: drag.y + 18,
        background: "var(--text)",
        color: "var(--surface)",
      }}
    >
      {label}
      {warn ? (
        <div
          className="text-[11px] font-semibold"
          style={{ color: WARN_MIX(55, "var(--surface)") }}
        >
          {warn}
        </div>
      ) : null}
    </div>
  );
}

/** The cue a mouse user gets on hover, before any press. */
function HoverCue({
  variant,
  slot,
}: {
  variant: Variant;
  slot: { bottom: number; height: number };
}) {
  if (variant === "B") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 right-2 hidden h-5 w-5 place-items-center rounded-full text-[14px] leading-none font-bold group-hover:grid"
        style={{ color: "var(--primary)", background: PRIMARY_MIX(12, "transparent") }}
      >
        +
      </span>
    );
  }
  if (variant === "C") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute right-[3px] left-[3px] hidden items-center px-2 text-[11px] font-semibold group-hover:flex"
        style={{
          bottom: slot.bottom,
          height: slot.height,
          border: "1.5px dashed color-mix(in oklch, var(--primary) 55%, transparent)",
          borderRadius: 7,
          color: "var(--primary)",
          zIndex: 2,
        }}
      >
        + New
      </span>
    );
  }
  return null;
}

/* ---------- the Month seam grid (T-265 variant C) ---------- */

function useMonthShort() {
  const { t } = useTranslation();
  return (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(t.common.dateLocale, { month: "short" });
}

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
  labelled,
}: {
  cell: Cell;
  isToday: boolean;
  labelled: boolean;
}) {
  const monthShort = useMonthShort();
  const weekend = cell.col >= 5;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="tnum inline-grid place-items-center rounded-full"
        style={{
          minWidth: 24,
          height: 24,
          padding: "0 4px",
          fontSize: 13,
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
      {labelled ? (
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

type Placed = { bar: Bar; sc: number; ec: number; contL: boolean; contR: boolean; lane: number };

function place(week: Cell[], bars: Bar[], order?: (b: Bar) => number): Placed[] {
  const ws = week[0].ord;
  const we = week[6].ord;
  const placed = bars
    .filter((b) => b.from <= we && b.to >= ws)
    .map((b) => ({
      bar: b,
      sc: Math.max(b.from, ws) - ws,
      ec: Math.min(b.to, we) - ws + 1,
      contL: b.from < ws,
      contR: b.to > we,
      lane: 0,
    }))
    .sort(
      (x, y) =>
        (order ? order(x.bar) - order(y.bar) : 0) || x.sc - y.sc || y.ec - y.sc - (x.ec - x.sc)
    );
  const lanes: Placed[][] = [];
  for (const p of placed) {
    const free = lanes.findIndex((l) => l.every((q) => p.sc >= q.ec || p.ec <= q.sc));
    p.lane = free >= 0 ? free : lanes.length;
    if (free >= 0) lanes[free].push(p);
    else lanes.push([p]);
  }
  return placed;
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
  sel: Sel | null;
  booked: Set<number>;
  label: string;
  canDrag: boolean;
  suppressClick: React.RefObject<boolean>;
  onCellPointerDown: (e: ReactPointerEvent, ord: number) => void;
};

const MAX_LANES = 2;
const LANES_SLOT = { bottom: 5, height: 22 };

function LanesGrid(props: GridProps) {
  const { weeks, records, holidays, variant, todayIso, filter, onOpenRequest, onBook } = props;
  const { sel, booked, label, canDrag, suppressClick, onCellPointerDown } = props;
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
        userSelect: sel ? "none" : undefined,
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
        const bankCells = showBank ? week.filter((c) => holidays.has(c.ord)) : [];
        const placed = place(week, bars);
        const bankRows = bankCells.length > 0 ? 1 : 0;
        const shownLanes = MAX_LANES - bankRows;
        const hidden = new Map<number, number>();
        for (const p of placed) {
          if (p.lane < shownLanes) continue;
          for (let c = p.sc; c < p.ec; c++) hidden.set(c, (hidden.get(c) ?? 0) + 1);
        }
        const seam = seamCol(week);

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
                  data-ord={cell.ord}
                  role="button"
                  tabIndex={0}
                  aria-label={t.calendar.createRequestDay(cell.day)}
                  onPointerDown={(e) => onCellPointerDown(e, cell.ord)}
                  onClick={() => {
                    if (!suppressClick.current) onBook(cell.iso);
                  }}
                  className="group relative transition-colors hover:bg-[var(--surface-2)]"
                  style={{
                    cursor: canDrag && variant === "A" ? "cell" : "pointer",
                    borderRight: cell.col < 6 ? "1px solid var(--border)" : "none",
                    padding: "8px 10px",
                    background:
                      cellSelBg(variant, sel, cell.ord, booked) ??
                      (!cell.inMonth
                        ? "color-mix(in oklch, var(--surface-2) 50%, transparent)"
                        : cell.col >= 5
                          ? "color-mix(in oklch, var(--surface-2) 45%, transparent)"
                          : "transparent"),
                  }}
                >
                  <DayNumber
                    cell={cell}
                    isToday={cell.iso === todayIso}
                    labelled={labelledCell(weeks, cell)}
                  />
                  {canDrag && !sel ? <HoverCue variant={variant} slot={LANES_SLOT} /> : null}
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
                .map((p) => (
                  <div
                    key={p.bar.id}
                    className="@container"
                    style={{
                      gridColumn: `${p.sc + 1} / ${p.ec + 1}`,
                      gridRow: bankRows + p.lane + 1,
                      pointerEvents: sel ? "none" : "auto",
                    }}
                  >
                    <LaneBar bar={p.bar} placed={p} onOpenRequest={onOpenRequest} />
                  </div>
                ))}
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
                    style={{ gridColumn: `${col + 1} / ${col + 2}` }}
                    className="w-fit rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-[3px] text-[11px] font-semibold text-[var(--text-muted)]"
                  >
                    {t.calendar.moreCount(n)}
                  </span>
                ))}
              </div>
            ) : null}

            <SelectionLayer
              week={week}
              sel={sel}
              booked={booked}
              variant={variant}
              label={label}
              slot={LANES_SLOT}
            />
          </div>
        );
      })}
    </div>
  );
}

function LaneBar({
  bar,
  placed,
  onOpenRequest,
}: {
  bar: Bar;
  placed: Placed;
  onOpenRequest: (id: string) => void;
}) {
  const { t } = useTranslation();
  const meta = leaveMetaFor(bar.type);
  const u = bar.user;
  const name = u ? (u.name.split(" ")[0] ?? u.name) : t.calendar.everyone;
  const vacationId = bar.vacationIds[0];
  const { contL, contR } = placed;
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
      {u && !contL ? (
        <AvatarBubble initials={u.initials} background={u.avatarColor} name={u.name} size={16} />
      ) : null}
      {!contL ? (
        <span className="hidden overflow-hidden text-ellipsis @min-[64px]:inline">{name}</span>
      ) : null}
    </div>
  );
}

const MAX_STRIPES = 3;
const STRIPES_SLOT = { bottom: 4, height: 17 };

function StripesGrid(props: GridProps) {
  const { weeks, records, holidays, variant, todayIso, filter, viewerId, onOpenRequest, onBook } =
    props;
  const { sel, booked, label, canDrag, suppressClick, onCellPointerDown } = props;
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
        userSelect: sel ? "none" : undefined,
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
        const placed = place(week, bars, (b) => (b.userId === viewerId ? 0 : 1));
        const more = new Map<number, number>();
        for (const p of placed) {
          if (p.lane < MAX_STRIPES) continue;
          for (let c = p.sc; c < p.ec; c++) more.set(c, (more.get(c) ?? 0) + 1);
        }
        const seam = seamCol(week);

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
                return (
                  <Popover
                    key={cell.ord}
                    open={openOrd === cell.ord}
                    onOpenChange={(open) => {
                      if (open && suppressClick.current) return;
                      setOpenOrd(open ? cell.ord : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-ord={cell.ord}
                        onPointerDown={(e) => onCellPointerDown(e, cell.ord)}
                        className="group relative min-w-0 px-2.5 pt-2 pb-1 text-left align-top transition-colors outline-none hover:bg-[var(--surface-2)]"
                        style={{
                          cursor: canDrag && variant === "A" ? "cell" : "pointer",
                          borderRight: cell.col < 6 ? "1px solid var(--border)" : "none",
                          background:
                            cellSelBg(variant, sel, cell.ord, booked) ??
                            (holiday
                              ? "color-mix(in oklch, var(--c-bank) 13%, transparent)"
                              : !cell.inMonth
                                ? "color-mix(in oklch, var(--surface-2) 50%, transparent)"
                                : cell.col >= 5
                                  ? "color-mix(in oklch, var(--surface-2) 45%, transparent)"
                                  : undefined),
                        }}
                      >
                        <span className="absolute top-2 left-2.5">
                          <DayNumber
                            cell={cell}
                            isToday={cell.iso === todayIso}
                            labelled={labelledCell(weeks, cell)}
                          />
                        </span>
                        {holiday ? (
                          <span
                            className="absolute bottom-1 left-2.5 max-w-[calc(100%-2.5rem)] truncate text-[10.5px] font-semibold"
                            style={{ color: "color-mix(in oklch, var(--c-bank) 80%, var(--text))" }}
                          >
                            {holiday}
                          </span>
                        ) : null}
                        {more.get(cell.col) ? (
                          <span
                            className="tnum absolute right-2 bottom-1 text-[11px] font-semibold"
                            style={{ color: "var(--text-muted)" }}
                          >
                            +{more.get(cell.col)}
                          </span>
                        ) : null}
                        {canDrag && !sel ? (
                          <HoverCue variant={variant} slot={STRIPES_SLOT} />
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
                .map((p) => (
                  <div
                    key={p.bar.id}
                    className="h-[7px]"
                    style={{
                      gridColumn: `${p.sc + 1} / ${p.ec + 1}`,
                      gridRow: p.lane + 1,
                      marginLeft: p.contL ? 0 : 5,
                      marginRight: p.contR ? 0 : 5,
                      background: leaveMetaFor(p.bar.type).cssVar,
                      opacity: p.bar.pending ? 0.4 : 1,
                      borderRadius: `${p.contL ? 0 : 999}px ${p.contR ? 0 : 999}px ${
                        p.contR ? 0 : 999
                      }px ${p.contL ? 0 : 999}px`,
                    }}
                  />
                ))}
            </div>

            <SelectionLayer
              week={week}
              sel={sel}
              booked={booked}
              variant={variant}
              label={label}
              slot={STRIPES_SLOT}
            />
          </div>
        );
      })}
    </div>
  );
}

export function DragRangePrototype({
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
  onBookRange,
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
  onBookRange: (fromIso: string, toIso: string) => void;
}) {
  const { t } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const variant = (DRAG_VARIANTS.find((v) => v.key === params.get("drag"))?.key ?? "A") as Variant;
  const view = (params.get("view") as "lanes" | "stripes" | null) ?? storedView;
  const withFixtures = params.get("fixtures") !== "0";
  const [lastCommit, setLastCommit] = useState<string | null>(null);

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
  const booked = useMemo(
    () => new Set(records.filter((r) => r.userId === viewer.id).map((r) => r.ord)),
    [records, viewer.id]
  );
  const rangeLabel = useRangeLabel(t.common.dateLocale);
  const canDrag = useCanDrag();

  const { drag, sel, suppressClick, onCellPointerDown } = useDragRange((lo, hi) => {
    setLastCommit(`${isoOf(lo)} → ${isoOf(hi)}`);
    onBookRange(isoOf(lo), isoOf(hi));
  });

  const days = sel ? workingDays(sel.lo, sel.hi, holidays) : 0;
  const label = sel ? `${rangeLabel(sel.lo, sel.hi)} · ${days} ${days === 1 ? "day" : "days"}` : "";
  let bookedInSel = 0;
  if (sel) for (let o = sel.lo; o <= sel.hi; o++) if (booked.has(o)) bookedInSel++;
  const warn = bookedInSel ? `${bookedInSel} already booked` : null;

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
    sel,
    booked,
    label: warn && variant !== "A" ? `${label} · ${warn}` : label,
    canDrag,
    suppressClick,
    onCellPointerDown,
  };

  return (
    <>
      {view === "stripes" ? (
        <StripesGrid key={`${year}-${month}`} {...props} />
      ) : (
        <LanesGrid {...props} />
      )}
      {drag?.active && variant === "A" ? (
        <CursorLabel drag={drag} label={label} warn={warn} />
      ) : null}
      <PrototypeSwitcher
        variants={DRAG_VARIANTS}
        param="drag"
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
            <span className="mx-1 h-4 w-px bg-white/30" />
            <span className="tnum px-1.5 font-mono text-[11.5px] font-medium text-white/80">
              {sel
                ? `drag ${isoOf(sel.lo)}→${isoOf(sel.hi)} · ${days}wd · ${bookedInSel} booked`
                : drag
                  ? "pressed"
                  : lastCommit
                    ? `last: ${lastCommit}`
                    : canDrag
                      ? "idle"
                      : "drag off (touch or <768px)"}
            </span>
          </>
        }
      />
    </>
  );
}
