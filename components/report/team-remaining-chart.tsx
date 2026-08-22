"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MemberRemaining } from "@/lib/report/series";
import { formatDays } from "@/lib/report/series";
import { useTranslation } from "@/lib/i18n/use-translation";

type Row = {
  id: string;
  name: string;
  carriedOverLeft: number;
  yearLeft: number;
  overdraft: number;
  remaining: number;
  usedToDate: number;
  planned: number;
  pending: number;
};

type Props = {
  remaining: MemberRemaining[];
  year: number;
  /** Fill for the year's own days; the carry-over reuses it at low opacity. */
  color: string;
};

/** Below this many pixels per bar, a horizontal full name will not fit. */
const MIN_WIDTH_PER_LABEL = 90;

/** Recharts only reports its own width to its children, and the tick angle has
 * to be decided before the axis renders, so measure the box ourselves. */
function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function RemainingTooltip({
  active,
  payload,
  labels,
}: {
  active?: boolean;
  payload?: { payload?: Row }[];
  labels: {
    carriedOver: string;
    yearQuota: string;
    usedToDate: string;
    planned: string;
    pending: string;
    remaining: string;
  };
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const line = (label: string, value: number) => (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{formatDays(value)}</dd>
    </>
  );

  return (
    <div className="bg-popover text-popover-foreground rounded-lg px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
      <p className="mb-1 font-medium">{row.name}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5">
        {line(labels.carriedOver, row.carriedOverLeft)}
        {line(labels.yearQuota, row.yearLeft)}
        {line(labels.usedToDate, row.usedToDate)}
        {row.planned > 0 ? line(labels.planned, row.planned) : null}
        {row.pending > 0 ? line(labels.pending, row.pending) : null}
        <dt className="border-border mt-0.5 border-t pt-0.5 font-medium">{labels.remaining}</dt>
        <dd className="border-border mt-0.5 border-t pt-0.5 text-right font-medium tabular-nums">
          {formatDays(row.remaining)}
        </dd>
      </dl>
    </div>
  );
}

/**
 * Days each member still has, stacked by where they came from: carry-over at
 * the base because it is spent first, so the solid block on top is what is
 * left of the year's own grant. Anything taken beyond the allowance hangs
 * below zero rather than reading as a member with nothing left.
 */
export function TeamRemainingChart({ remaining, year, color }: Props) {
  const { t } = useTranslation();

  const rows: Row[] = remaining.map((entry) => ({
    id: entry.member.id,
    name: entry.member.name,
    carriedOverLeft: entry.carriedOverLeft,
    yearLeft: entry.yearLeft,
    overdraft: entry.overdraft,
    remaining: entry.remaining,
    usedToDate: entry.usedToDate,
    planned: entry.planned,
    pending: entry.pending,
  }));

  const [boxRef, width] = useMeasuredWidth();
  // Until the box is measured, assume the labels fit: a first paint with
  // straight labels settles more quietly than one that starts rotated.
  const angled = width > 0 && rows.length > 0 && width / rows.length < MIN_WIDTH_PER_LABEL;
  const overdrawn = rows.some((row) => row.overdraft < 0);
  // Gated on the drawn value, not the granted one: a team that has already
  // spent its carry-over has no translucent segment for the key to point at.
  const carriesOver = rows.some((row) => row.carriedOverLeft > 0);
  // Booking against a group default rather than a personal quota row is a
  // supported state, so leave taken with a zero allowance still has to chart —
  // that member is overdrawn, which is exactly what someone opens this for.
  const anything = remaining.some(
    (entry) => entry.carriedOver > 0 || entry.yearQuota > 0 || entry.used > 0 || entry.pending > 0
  );

  const labels = {
    carriedOver: t.report.charts.carriedOver,
    yearQuota: t.report.charts.yearQuota(year),
    usedToDate: t.report.table.usedToDate,
    planned: t.report.table.planned,
    pending: t.report.charts.pending,
    remaining: t.report.charts.remainingLabel,
    overdraft: t.report.charts.overdraft,
  };

  // A leave type nobody has an allowance for still gets a panel, and an axis
  // with no bars under it reads as a broken chart rather than as "not set up".
  if (!anything) {
    return <p className="text-muted-foreground text-sm">{t.report.charts.remainingEmpty}</p>;
  }

  return (
    <div>
      <div ref={boxRef} className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} maxBarSize={64} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              angle={angled ? -35 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 68 : 30}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={<RemainingTooltip labels={labels} />}
            />
            {overdrawn ? <ReferenceLine y={0} stroke="var(--border)" /> : null}
            <Bar
              dataKey="carriedOverLeft"
              stackId="days"
              fill={color}
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Bar
              dataKey="yearLeft"
              stackId="days"
              fill={color}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="overdraft"
              stackId="days"
              fill="var(--destructive)"
              radius={[0, 0, 3, 3]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-xs">
        {carriesOver ? (
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: color, opacity: 0.35 }}
            />
            {labels.carriedOver}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          {labels.yearQuota}
        </span>
        {overdrawn ? (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="bg-destructive size-2.5 shrink-0 rounded-full" />
            {labels.overdraft}
          </span>
        ) : null}
      </div>
    </div>
  );
}
