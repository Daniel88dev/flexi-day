"use client";

// PROTOTYPE (T-445): the iPhone Requests screen's month control, mocked in a phone frame on real
// data so it can sit beside the web variants. Throwaway, never merged. ?variant=A|B|C.

import { useMemo, useState } from "react";
import { PrototypeSwitcher, useVariant } from "@/components/prototype-switcher";
import { useReportScope } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import { groupVacationRequests } from "@/lib/vacations/group-requests";
import { cn } from "@/lib/utils";
import {
  MONTHS,
  StatePanel,
  bounds,
  currentMonth,
  defaultSelection,
  fromIdx,
  idx,
  inBounds,
  isDefault,
  rangeOf,
  same,
  selectionLabel,
  sortMonths,
  useMonthsVacations,
  type YearMonth,
} from "../month-selector-prototype";

const VARIANTS = ["A", "B", "C"] as const;
type V = (typeof VARIANTS)[number];
const NAMES: Record<V, string> = {
  A: "Window stepper + sheet",
  B: "Month chip strip",
  C: "Length + stepper",
};

type Props = { value: YearMonth[]; onChange: (ms: YearMonth[]) => void };

function Circle({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border-input bg-card flex h-9 w-9 items-center justify-center rounded-full border text-sm disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function shiftWithin(ms: YearMonth[], d: number): YearMonth[] | null {
  const next = ms.map((m) => fromIdx(idx(m) + d));
  return next.every(inBounds) ? next : null;
}

/* A: the title is the range; ‹ › move the window; tapping the title opens a bottom sheet. */
function PhoneA({ value, onChange }: Props) {
  const [sheet, setSheet] = useState(false);
  const [anchor, setAnchor] = useState<YearMonth | null>(null);
  const s = sortMonths(value);
  const b = bounds();
  const years = [b.first.year, b.first.year + 1, b.last.year];
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="font-heading text-left text-[20px] font-semibold"
        >
          {selectionLabel(value)} <span className="text-muted-foreground text-sm">▾</span>
        </button>
        <div className="flex gap-1.5">
          <Circle disabled={!shiftWithin(s, -1)} onClick={() => onChange(shiftWithin(s, -1) ?? s)}>
            ‹
          </Circle>
          <Circle disabled={!shiftWithin(s, 1)} onClick={() => onChange(shiftWithin(s, 1) ?? s)}>
            ›
          </Circle>
        </div>
      </div>
      {sheet ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40">
          <div className="bg-background max-h-[75%] overflow-y-auto rounded-t-3xl p-4 pb-8">
            <div className="bg-muted mx-auto mb-3 h-1 w-10 rounded-full" />
            <div className="mb-2 flex items-center justify-between">
              <span className="font-heading font-semibold">Months</span>
              <button
                type="button"
                className="text-primary text-sm font-medium"
                onClick={() => {
                  setSheet(false);
                  setAnchor(null);
                }}
              >
                Done
              </button>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">
              {anchor
                ? `From ${MONTHS[anchor.month - 1]} ${anchor.year}: tap the last month`
                : "Tap the first month, then the last"}
            </p>
            {years.map((y) => (
              <div key={y} className="mb-3">
                <div className="text-muted-foreground mb-1 text-xs font-semibold">{y}</div>
                <div className="grid grid-cols-6 gap-1">
                  {MONTHS.map((label, i) => {
                    const m = { year: y, month: i + 1 };
                    const sel = anchor ? same(m, anchor) : s.some((x) => same(x, m));
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (!anchor) setAnchor(m);
                          else {
                            onChange(rangeOf(anchor, m));
                            setAnchor(null);
                          }
                        }}
                        className={cn(
                          "rounded-lg py-2 text-xs",
                          sel ? "bg-primary text-primary-foreground" : "bg-muted/60"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!isDefault(value) ? (
              <button
                type="button"
                className="text-primary mt-1 text-sm font-medium"
                onClick={() => onChange(defaultSelection())}
              >
                Back to the next 3 months
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* B: a horizontal strip of every month in the store's window; tap toggles, gaps allowed. */
function PhoneB({ value, onChange }: Props) {
  const s = sortMonths(value);
  const months = rangeOf(bounds().first, bounds().last);
  const now = currentMonth();
  const has = (m: YearMonth) => s.some((x) => same(x, m));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-heading text-[20px] font-semibold">{selectionLabel(value)}</span>
        {!isDefault(value) ? (
          <button
            type="button"
            className="text-primary text-sm font-medium"
            onClick={() => onChange(defaultSelection())}
          >
            Reset
          </button>
        ) : null}
      </div>
      <div
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1"
        ref={(el) => {
          if (!el || el.dataset.scrolled) return;
          el.dataset.scrolled = "1";
          el.scrollLeft = (idx(now) - idx(months[0]) - 1) * 62;
        }}
      >
        {months.map((m) => (
          <button
            key={idx(m)}
            type="button"
            onClick={() => onChange(has(m) ? s.filter((x) => !same(x, m)) : sortMonths([...s, m]))}
            className={cn(
              "flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-xs",
              has(m) ? "bg-primary text-primary-foreground border-primary" : "border-input bg-card",
              same(m, now) && !has(m) && "border-primary"
            )}
          >
            <span className="font-semibold">{MONTHS[m.month - 1]}</span>
            <span className={cn("text-[10px]", has(m) ? "opacity-80" : "text-muted-foreground")}>
              {m.year}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* C: pick how many months (1 / 3 / 6), then step the window with ‹ ›. Always contiguous. */
function PhoneC({ value, onChange }: Props) {
  const s = sortMonths(value);
  const len = s.length || 3;
  const start = s[0] ?? currentMonth();
  const setLen = (n: number) => {
    let first = start;
    while (!inBounds(fromIdx(idx(first) + n - 1))) first = fromIdx(idx(first) - 1);
    onChange(rangeOf(first, fromIdx(idx(first) + n - 1)));
  };
  return (
    <div className="space-y-3">
      <div className="bg-muted flex rounded-xl p-0.5">
        {[1, 3, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLen(n)}
            className={cn(
              "flex-1 rounded-[10px] py-1.5 text-sm",
              len === n ? "bg-background font-semibold shadow-sm" : "text-muted-foreground"
            )}
          >
            {n === 1 ? "1 month" : `${n} months`}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-heading text-[20px] font-semibold">{selectionLabel(value)}</span>
        <div className="flex gap-1.5">
          <Circle disabled={!shiftWithin(s, -1)} onClick={() => onChange(shiftWithin(s, -1) ?? s)}>
            ‹
          </Circle>
          <Circle disabled={!shiftWithin(s, 1)} onClick={() => onChange(shiftWithin(s, 1) ?? s)}>
            ›
          </Circle>
        </div>
      </div>
      {!isDefault(value) ? (
        <button
          type="button"
          className="text-primary text-xs font-medium"
          onClick={() => onChange(defaultSelection())}
        >
          Back to this month
        </button>
      ) : null}
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-muted text-muted-foreground",
};

export default function IphoneRequestsPrototype() {
  const variant = useVariant(VARIANTS);
  const [months, setMonths] = useState<YearMonth[]>(defaultSelection);
  const [filter, setFilter] = useState<"all" | "mine" | "pending">("all");
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const scope = useReportScope();
  const groupId = scope.data?.groups.find((g) => g.access === "all")?.groupId ?? null;
  const q = useMonthsVacations(months, groupId);
  const requests = useMemo(() => groupVacationRequests(q.data), [q.data]);
  const counts = {
    all: requests.length,
    mine: requests.filter((r) => r.userId === userId).length,
    pending: requests.filter((r) => r.status === "pending").length,
  };
  const shown = requests.filter((r) =>
    filter === "all" ? true : filter === "mine" ? r.userId === userId : r.status === "pending"
  );
  const fmtDay = (iso: string) =>
    `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

  return (
    <div className="flex justify-center py-6">
      <StatePanel value={months} />
      <PrototypeSwitcher variants={VARIANTS} names={NAMES} />
      <div className="bg-background ring-foreground/15 relative h-[844px] w-[390px] overflow-hidden rounded-[48px] shadow-2xl ring-8">
        <div className="flex h-full flex-col pt-12">
          <div className="space-y-4 px-4 pt-3 pb-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[28px] font-bold">Requests</span>
              <div className="flex gap-2">
                <span className="border-input flex h-10 items-center rounded-full border px-3 text-xs">
                  Group ▾
                </span>
                <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full">
                  +
                </span>
              </div>
            </div>
            {variant === "A" ? <PhoneA value={months} onChange={setMonths} /> : null}
            {variant === "B" ? <PhoneB value={months} onChange={setMonths} /> : null}
            {variant === "C" ? <PhoneC value={months} onChange={setMonths} /> : null}
          </div>
          <div className="flex gap-2 px-4">
            {(["all", "mine", "pending"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm capitalize",
                  filter === f ? "bg-foreground text-background" : "bg-muted"
                )}
              >
                {f} {counts[f]}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {q.isLoading ? (
              <p className="text-muted-foreground py-16 text-center text-sm">Loading…</p>
            ) : shown.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center text-[15px]">
                {months.length === 0
                  ? "Pick at least one month"
                  : `No requests in ${selectionLabel(months)}`}
              </p>
            ) : (
              shown.map((r) => (
                <div key={r.id} className="bg-card border-border rounded-2xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {r.userId === userId ? "You" : r.user.name}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_PILL[r.status]
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {r.from === r.to ? fmtDay(r.from) : `${fmtDay(r.from)} - ${fmtDay(r.to)}`} ·{" "}
                    {r.dayCount} {r.dayCount === 1 ? "day" : "days"} · {r.vacationType}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
