"use client";

// TODO(balance widget): pull from `useQuotas(groupId, { year })` once a "list across all
//   my groups" call exists. For now this renders the design's placeholder balances so the
//   sidebar isn't empty during prototyping.

import { DEMO_BALANCES } from "@/lib/demo/team";

export function BalanceWidget() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h3 className="font-display mb-4 text-[16px] font-semibold">My balance</h3>
      <div className="flex flex-col gap-4">
        {DEMO_BALANCES.map((b) => {
          const left = b.total - b.used;
          const pct = (b.used / b.total) * 100;
          return (
            <div key={b.id}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[13.5px] font-semibold">{b.label}</span>
                <span className="tnum text-[13px]" style={{ color: "var(--text-muted)" }}>
                  <b style={{ color: "var(--text)" }}>{left}</b> / {b.total} left
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: b.cssVar }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
