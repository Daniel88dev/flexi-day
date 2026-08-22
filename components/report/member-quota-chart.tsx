"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "@/lib/report/series";
import { formatDays, monthAxisLabel, monthlyTargetFor } from "@/lib/report/series";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  series: MonthPoint[];
  /** Total allowance for the year; drawn as a per-month average guide line. */
  quota: number;
};

type TooltipPayload = {
  payload?: MonthPoint;
}[];

function ChartTooltip({
  active,
  payload,
  monthLabels,
  labels,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  monthLabels: readonly string[];
  labels: { used: string; pending: string };
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="bg-popover text-popover-foreground rounded-lg px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
      <p className="mb-1 font-medium">
        {monthLabels[point.month - 1]} {point.year}
      </p>
      <p>
        {labels.used}: {formatDays(point.used)}
      </p>
      {point.pending > 0 ? (
        <p className="text-muted-foreground">
          {labels.pending}: {formatDays(point.pending)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Monthly leave for one member. Approved and pending days stack so the bar
 * reads as "committed", with pending visibly lighter; the dashed line is the
 * allowance spread evenly across the window, which is what makes a
 * front-loaded or unused allowance obvious at a glance.
 */
export function MemberQuotaChart({ series, quota }: Props) {
  const { t } = useTranslation();
  const monthlyTarget = monthlyTargetFor(series, quota);

  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(month: number) => monthAxisLabel(month, series, t.calendar.monthsShort)}
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
            content={
              <ChartTooltip
                monthLabels={t.calendar.months}
                labels={{ used: t.report.charts.used, pending: t.report.charts.pending }}
              />
            }
          />
          {monthlyTarget > 0 ? (
            <ReferenceLine
              y={monthlyTarget}
              stroke="var(--primary)"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
          ) : null}
          <Bar
            dataKey="used"
            stackId="days"
            fill="var(--c-vacation)"
            radius={[0, 0, 0, 0]}
            isAnimationActive={false}
          >
            {series.map((point) => (
              <Cell key={`used-${point.year}-${point.month}`} />
            ))}
          </Bar>
          <Bar
            dataKey="pending"
            stackId="days"
            fill="var(--c-vacation)"
            fillOpacity={0.35}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
