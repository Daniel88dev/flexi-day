"use client";

// PROTOTYPE (T-445): month selector variants for the Requests page. Throwaway, never merged.
// Four web variants on the real /requests route, switchable via ?variant=A|B|C|D.

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listVacations } from "@/lib/api/vacations";
import type { VacationListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type YearMonth = { year: number; month: number };

export const idx = (m: YearMonth) => m.year * 12 + (m.month - 1);
export const fromIdx = (i: number): YearMonth => ({
  year: Math.floor(i / 12),
  month: (i % 12) + 1,
});
export const same = (a: YearMonth, b: YearMonth) => idx(a) === idx(b);
export const rangeOf = (a: YearMonth, b: YearMonth): YearMonth[] => {
  const [lo, hi] = idx(a) <= idx(b) ? [idx(a), idx(b)] : [idx(b), idx(a)];
  return Array.from({ length: hi - lo + 1 }, (_, i) => fromIdx(lo + i));
};
export const sortMonths = (ms: YearMonth[]) => [...ms].sort((a, b) => idx(a) - idx(b));

export function currentMonth(): YearMonth {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function defaultSelection(): YearMonth[] {
  const c = currentMonth();
  return rangeOf(c, fromIdx(idx(c) + 2));
}

/** The iPhone store's window: January last year to December next year. */
export function bounds() {
  const y = currentMonth().year;
  return { first: { year: y - 1, month: 1 }, last: { year: y + 1, month: 12 } };
}
export const inBounds = (m: YearMonth) =>
  idx(m) >= idx(bounds().first) && idx(m) <= idx(bounds().last);

export function isContiguous(ms: YearMonth[]) {
  const s = sortMonths(ms);
  return s.every((m, i) => i === 0 || idx(m) === idx(s[i - 1]) + 1);
}

export const isDefault = (ms: YearMonth[]) => {
  const d = defaultSelection();
  return ms.length === d.length && sortMonths(ms).every((m, i) => same(m, d[i]));
};

const fmt = (m: YearMonth) => `${MONTHS[m.month - 1]} ${m.year}`;

/** Header label: "Oct 2026", "Oct – Dec 2026", "Nov 2026 – Jan 2027", "Oct, Dec 2026", "5 months". */
export function selectionLabel(ms: YearMonth[]): string {
  const s = sortMonths(ms);
  if (s.length === 0) return "No months";
  if (s.length === 1) return fmt(s[0]);
  const first = s[0];
  const last = s[s.length - 1];
  if (isContiguous(s)) {
    return first.year === last.year
      ? `${MONTHS[first.month - 1]} – ${fmt(last)}`
      : `${fmt(first)} – ${fmt(last)}`;
  }
  if (s.length > 3) return `${s.length} months`;
  const sameYear = s.every((m) => m.year === first.year);
  return sameYear
    ? `${s.map((m) => MONTHS[m.month - 1]).join(", ")} ${first.year}`
    : s.map(fmt).join(", ");
}

/** What the backend would be asked, to judge the fog on T-444. */
export function queryShape(ms: YearMonth[]): string {
  const s = sortMonths(ms);
  if (s.length === 0) return "(nothing)";
  const iso = (m: YearMonth) => `${m.year}-${String(m.month).padStart(2, "0")}-01`;
  if (isContiguous(s)) return `?from=${iso(s[0])}&to=${iso(fromIdx(idx(s[s.length - 1]) + 1))}`;
  return `?months=${s.map((m) => iso(m).slice(0, 7)).join(",")}`;
}

/** One query per month, merged: stands in for the range endpoint T-444 decided on. */
export function useMonthsVacations(ms: YearMonth[], groupId: string | null) {
  const results = useQueries({
    queries: sortMonths(ms).map((m) => ({
      queryKey: ["prototype-vacations", m.year, m.month, groupId],
      queryFn: () =>
        listVacations({
          year: m.year,
          month: m.month,
          groupId,
          includeCancelled: true,
          wholeRequests: true,
        }),
    })),
  });
  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error ?? null;
  const ids = results.map((r) => r.dataUpdatedAt).join(",");
  const data = useMemo(() => {
    const byId = new Map<string, VacationListItem>();
    for (const r of results) for (const v of r.data ?? []) byId.set(v.id, v);
    return [...byId.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  return { data, isLoading, error };
}

export type SelectorProps = {
  value: YearMonth[];
  onChange: (ms: YearMonth[]) => void;
};

function ResetLink({ value, onChange }: SelectorProps) {
  if (isDefault(value)) return null;
  return (
    <button
      type="button"
      className="text-primary text-xs font-medium hover:underline"
      onClick={() => onChange(defaultSelection())}
    >
      Reset
    </button>
  );
}

function YearGrid({
  year,
  isSelected,
  isEdge,
  onPick,
}: {
  year: number;
  isSelected: (m: YearMonth) => boolean;
  isEdge?: (m: YearMonth) => boolean;
  onPick: (m: YearMonth, e: React.MouseEvent) => void;
}) {
  const now = currentMonth();
  return (
    <div className="grid grid-cols-4 gap-1">
      {MONTHS.map((label, i) => {
        const m = { year, month: i + 1 };
        const sel = isSelected(m);
        return (
          <button
            key={label}
            type="button"
            onClick={(e) => onPick(m, e)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-sm transition-colors",
              sel ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted",
              isEdge?.(m) && "bg-primary text-primary-foreground hover:bg-primary",
              same(m, now) && !sel && "ring-primary/40 ring-1"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- A: range stepper. ‹ › shift the whole window; the label opens a range picker. ---------- */

export function VariantA({ value, onChange }: SelectorProps) {
  const s = sortMonths(value);
  const [year, setYear] = useState(s[0]?.year ?? currentMonth().year);
  const [anchor, setAnchor] = useState<YearMonth | null>(null);
  const shift = (d: number) => onChange(s.map((m) => fromIdx(idx(m) + d)));

  return (
    <div className="flex items-center gap-2">
      <ResetLink value={value} onChange={onChange} />
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => shift(-1)} aria-label="Earlier">
          ‹
        </Button>
        <Popover onOpenChange={(open) => !open && setAnchor(null)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-foreground/80 font-heading hover:bg-muted min-w-[150px] rounded-md px-2 py-1 text-center text-sm font-medium"
            >
              {selectionLabel(value)}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon-sm" onClick={() => setYear(year - 1)}>
                ‹
              </Button>
              <span className="font-heading font-semibold">{year}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setYear(year + 1)}>
                ›
              </Button>
            </div>
            <YearGrid
              year={year}
              isSelected={(m) => (anchor ? same(m, anchor) : s.some((x) => same(x, m)))}
              isEdge={(m) => (anchor ? same(m, anchor) : same(m, s[0]) || same(m, s[s.length - 1]))}
              onPick={(m) => {
                if (!anchor) {
                  setAnchor(m);
                } else {
                  onChange(rangeOf(anchor, m));
                  setAnchor(null);
                }
              }}
            />
            <p className="text-muted-foreground text-xs">
              {anchor
                ? `From ${fmt(anchor)}: pick the last month (switch the year to cross it).`
                : "Pick the first month, then the last."}
            </p>
            <div className="flex gap-2">
              {[1, 3, 6].map((n) => (
                <Button
                  key={n}
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const c = currentMonth();
                    onChange(rangeOf(c, fromIdx(idx(c) + n - 1)));
                  }}
                >
                  {n === 1 ? "This month" : `Next ${n} months`}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon-sm" onClick={() => shift(1)} aria-label="Later">
          ›
        </Button>
      </div>
    </div>
  );
}

/* ---------- B: free multi-select. Any months, gaps allowed; selection shows as removable chips. ---------- */

export function VariantB({ value, onChange }: SelectorProps) {
  const s = sortMonths(value);
  const [year, setYear] = useState(currentMonth().year);
  const [last, setLast] = useState<YearMonth | null>(null);
  const has = (m: YearMonth) => s.some((x) => same(x, m));
  const toggle = (m: YearMonth, e: React.MouseEvent) => {
    if (e.shiftKey && last) {
      const add = rangeOf(last, m).filter((x) => !has(x));
      onChange(sortMonths([...s, ...add]));
    } else {
      onChange(has(m) ? s.filter((x) => !same(x, m)) : sortMonths([...s, m]));
    }
    setLast(m);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <ResetLink value={value} onChange={onChange} />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[170px] justify-between">
              <span>{selectionLabel(value)}</span>
              <span className="text-muted-foreground">▾</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[540px]">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon-sm" onClick={() => setYear(year - 1)}>
                ‹
              </Button>
              <span className="text-muted-foreground text-xs">
                Click to toggle a month · Shift-click to add a run
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => setYear(year + 1)}>
                ›
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[year, year + 1].map((y) => (
                <div key={y} className="space-y-2">
                  <div className="font-heading text-center text-sm font-semibold">{y}</div>
                  <YearGrid year={y} isSelected={has} onPick={toggle} />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button size="xs" variant="ghost" onClick={() => onChange([])}>
                Clear
              </Button>
              <Button size="xs" variant="outline" onClick={() => onChange(defaultSelection())}>
                Next 3 months
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex max-w-[520px] flex-wrap justify-end gap-1">
        {s.map((m) => (
          <span
            key={idx(m)}
            className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs font-medium"
          >
            {fmt(m)}
            <button
              type="button"
              aria-label={`Remove ${fmt(m)}`}
              className="hover:bg-primary/20 rounded-full px-1"
              onClick={() => onChange(s.filter((x) => !same(x, m)))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- C: presets first, custom From/To selects as the escape hatch. ---------- */

type Preset = "this" | "next3" | "year" | "custom";

export function VariantC({ value, onChange }: SelectorProps) {
  const s = sortMonths(value);
  const c = currentMonth();
  const presetOf = (): Preset => {
    if (s.length === 1 && same(s[0], c)) return "this";
    if (isDefault(s)) return "next3";
    if (s.length === 12 && s[0].month === 1 && s[0].year === c.year) return "year";
    return "custom";
  };
  const [forcedCustom, setForcedCustom] = useState(false);
  const preset = forcedCustom ? "custom" : presetOf();
  const options = rangeOf(bounds().first, bounds().last);
  const key = (m: YearMonth) => String(idx(m));

  const pick = (p: Preset) => {
    setForcedCustom(p === "custom");
    if (p === "this") onChange([c]);
    if (p === "next3") onChange(defaultSelection());
    if (p === "year") onChange(rangeOf({ year: c.year, month: 1 }, { year: c.year, month: 12 }));
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="bg-muted inline-flex rounded-lg p-0.5">
        {(
          [
            ["this", "This month"],
            ["next3", "Next 3 months"],
            ["year", `${c.year}`],
            ["custom", "Custom…"],
          ] as const
        ).map(([p, label]) => (
          <button
            key={p}
            type="button"
            onClick={() => pick(p)}
            className={cn(
              "rounded-md px-3 py-1 text-sm",
              preset === p ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From</span>
          <Select
            value={key(s[0] ?? c)}
            onValueChange={(v) => onChange(rangeOf(fromIdx(Number(v)), s[s.length - 1] ?? c))}
          >
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((m) => (
                <SelectItem key={key(m)} value={key(m)}>
                  {fmt(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">to</span>
          <Select
            value={key(s[s.length - 1] ?? c)}
            onValueChange={(v) => onChange(rangeOf(s[0] ?? c, fromIdx(Number(v))))}
          >
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((m) => (
                <SelectItem key={key(m)} value={key(m)}>
                  {fmt(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">{selectionLabel(value)}</span>
      )}
    </div>
  );
}

/* ---------- D: inline month strip under the header. Click one month, shift-click to extend. ---------- */

export function MonthStrip({ value, onChange }: SelectorProps) {
  const s = sortMonths(value);
  const months = rangeOf(bounds().first, bounds().last);
  const now = currentMonth();
  const [anchor, setAnchor] = useState<YearMonth>(s[0] ?? now);
  const has = (m: YearMonth) => s.some((x) => same(x, m));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Click a month · Shift-click another to select everything between
        </span>
        <ResetLink value={value} onChange={onChange} />
      </div>
      <div
        className="border-border flex overflow-x-auto rounded-lg border"
        ref={(el) => {
          if (!el || el.dataset.scrolled) return;
          el.dataset.scrolled = "1";
          el.scrollLeft = (idx(now) - idx(months[0]) - 3) * 56;
        }}
      >
        {months.map((m) => {
          const sel = has(m);
          const prevSel = has(fromIdx(idx(m) - 1));
          const nextSel = has(fromIdx(idx(m) + 1));
          return (
            <button
              key={idx(m)}
              type="button"
              onClick={(e) => {
                if (e.shiftKey) onChange(rangeOf(anchor, m));
                else {
                  onChange([m]);
                  setAnchor(m);
                }
              }}
              className={cn(
                "border-border relative flex w-14 shrink-0 flex-col items-center border-r py-1.5 text-xs",
                sel ? "bg-primary/15 text-primary font-semibold" : "hover:bg-muted",
                sel && !prevSel && "border-l-primary border-l-2",
                sel && !nextSel && "border-r-primary border-r-2"
              )}
            >
              <span
                className={cn(
                  m.month === 1 ? "text-foreground font-semibold" : "text-muted-foreground",
                  "text-[10px]"
                )}
              >
                {m.month === 1 || same(m, months[0]) ? m.year : " "}
              </span>
              <span>{MONTHS[m.month - 1]}</span>
              {same(m, now) ? (
                <span className="bg-primary absolute bottom-0.5 h-1 w-1 rounded-full" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VariantDLabel({ value }: { value: YearMonth[] }) {
  return (
    <span className="text-foreground/80 font-heading text-sm font-medium">
      {selectionLabel(value)}
    </span>
  );
}

/* ---------- State panel: what the selection is and what it would ask the backend. ---------- */

export function StatePanel({ value }: { value: YearMonth[] }) {
  return (
    <div className="fixed right-4 bottom-20 z-[90] w-80 rounded-xl bg-black/85 p-3 font-mono text-[11px] leading-relaxed text-white shadow-2xl ring-1 ring-fuchsia-500">
      <div className="mb-1 font-semibold text-fuchsia-300">PROTOTYPE state</div>
      <div>label: {selectionLabel(value)}</div>
      <div>months: {sortMonths(value).map(fmt).join(", ") || "—"}</div>
      <div>contiguous: {String(isContiguous(value))}</div>
      <div>default: {String(isDefault(value))}</div>
      <div className="break-all">query: GET /api/vacation{queryShape(value)}</div>
    </div>
  );
}

export const VARIANTS = ["A", "B", "C", "D"] as const;
export type Variant = (typeof VARIANTS)[number];
export const VARIANT_NAMES: Record<Variant, string> = {
  A: "Range stepper + picker",
  B: "Free multi-select",
  C: "Presets + From/To",
  D: "Inline month strip",
};
