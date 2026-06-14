"use client";

import { useMyBalances } from "@/lib/api/queries";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import { VACATION_KIND_LABELS } from "@/lib/api/types";

interface BalanceWidgetProps {
  year: number;
}

export function BalanceWidget({ year }: BalanceWidgetProps) {
  const query = useMyBalances(year);
  const data = query.data;
  const visible = (data?.buckets ?? []).filter((b) => b.allocated > 0);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h3 className="font-display mb-4 text-[16px] font-semibold">My balance</h3>
      {query.isLoading ? (
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      ) : query.error ? (
        <p className="text-[14px]" style={{ color: "var(--destructive)" }}>
          {query.error.message}
        </p>
      ) : visible.length === 0 ? (
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          No quota set for {year}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((b) => {
            const meta = leaveMetaFor(b.type);
            const left = Math.max(0, b.allocated - b.used);
            const pct = b.allocated > 0 ? Math.min(100, (b.used / b.allocated) * 100) : 0;
            const label = meta.label !== b.type ? meta.label : VACATION_KIND_LABELS[b.type];
            return (
              <div key={b.type}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[13.5px] font-semibold">{label}</span>
                  <span className="tnum text-[13px]" style={{ color: "var(--text-muted)" }}>
                    <b style={{ color: "var(--text)" }}>{left}</b> / {b.allocated} left
                    {b.pending > 0 ? (
                      <span style={{ color: "var(--text-faint)" }}> · {b.pending} pending</span>
                    ) : null}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: meta.cssVar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
