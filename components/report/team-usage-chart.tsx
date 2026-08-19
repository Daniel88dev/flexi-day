"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { ReportScopeMember } from "@/lib/api/report-types";
import type { TeamMonthRow } from "@/lib/report/series";
import { formatDays } from "@/lib/report/series";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  /** Deduped and sorted by the caller; order defines the stack order. */
  members: ReportScopeMember[];
  series: TeamMonthRow[];
  colors: Record<string, string>;
};

function TeamTooltip({
  active,
  payload,
  members,
  colors,
  monthLabels,
  totalLabel,
}: {
  active?: boolean;
  payload?: { payload?: TeamMonthRow }[];
  members: ReportScopeMember[];
  colors: Record<string, string>;
  monthLabels: string[];
  totalLabel: string;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  // Top of the stack first, so the tooltip reads in the same order as the bar.
  const entries = [...members]
    .reverse()
    .map((member) => ({ member, value: row[member.id] ?? 0 }))
    .filter((entry) => entry.value > 0);
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="bg-popover text-popover-foreground rounded-lg px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
      <p className="mb-1 flex items-baseline justify-between gap-4 font-medium">
        {monthLabels[row.month - 1]}
        <span>
          {totalLabel}: {formatDays(Number(total.toFixed(2)))}
        </span>
      </p>
      {entries.map(({ member, value }) => (
        <p key={member.id} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ background: colors[member.id] }}
          />
          <span className="text-muted-foreground">{member.name}</span>
          <span className="ml-auto pl-3">{formatDays(value)}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Team-wide monthly usage for one leave type: bars stack every member's
 * committed days per month, dotted lines trace each member's own spend so an
 * individual stays readable inside the aggregate. Bars/lines and individual
 * members can be hidden — display state only, the data filters live above.
 */
export function TeamUsageChart({ members, series, colors }: Props) {
  const { t } = useTranslation();
  const monthLabels = t.calendar.monthsShort;

  const [showBars, setShowBars] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());

  const visible = useMemo(
    () => members.filter((member) => !hiddenIds.has(member.id)),
    [members, hiddenIds]
  );

  const toggleMember = (id: string) => {
    setHiddenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const layerToggle = (label: string, pressed: boolean, onToggle: () => void) => (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        pressed
          ? "border-transparent bg-secondary text-secondary-foreground"
          : "text-muted-foreground border-border bg-transparent opacity-70"
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex justify-end gap-1 pb-2">
        {layerToggle(t.report.charts.bars, showBars, () => setShowBars((v) => !v))}
        {layerToggle(t.report.charts.lines, showLines, () => setShowLines((v) => !v))}
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(month: number) => monthLabels[month - 1] ?? String(month)}
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
                <TeamTooltip
                  members={visible}
                  colors={colors}
                  monthLabels={monthLabels}
                  totalLabel={t.report.charts.total}
                />
              }
            />
            {showBars
              ? visible.map((member, index) => (
                  <Bar
                    key={member.id}
                    dataKey={member.id}
                    stackId="team"
                    fill={colors[member.id]}
                    stroke="var(--card)"
                    strokeWidth={1}
                    radius={index === visible.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  />
                ))
              : null}
            {showLines
              ? visible.map((member) => (
                  <Line
                    key={`line-${member.id}`}
                    dataKey={member.id}
                    type="monotone"
                    stroke={colors[member.id]}
                    strokeWidth={2}
                    strokeDasharray="2 5"
                    strokeLinecap="round"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))
              : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {members.map((member) => {
          const hidden = hiddenIds.has(member.id);
          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={!hidden}
              aria-label={t.report.charts.toggleMember(member.name)}
              onClick={() => toggleMember(member.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-opacity",
                hidden && "text-muted-foreground opacity-50"
              )}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: hidden ? "var(--muted-foreground)" : colors[member.id] }}
              />
              {member.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
