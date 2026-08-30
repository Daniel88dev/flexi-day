"use client";

import { useMyBalances } from "@/lib/api/queries";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

interface BalanceWidgetProps {
  year: number;
}

export function BalanceWidget({ year }: BalanceWidgetProps) {
  const { t } = useTranslation();
  const query = useMyBalances(year);
  const data = query.data;
  const visible = (data?.buckets ?? []).filter((b) => b.allocated > 0);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h3 className="font-display mb-4 text-[16px] font-semibold">{t.widgets.balance.title}</h3>
      {query.isLoading ? (
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          {t.common.loading}
        </p>
      ) : query.error ? (
        <p className="text-[14px]" style={{ color: "var(--destructive)" }}>
          {query.error.message}
        </p>
      ) : visible.length === 0 ? (
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          {t.widgets.balance.noQuota(year)}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((b) => {
            const meta = leaveMetaFor(b.type);
            // Deliberately unclamped: an overdraft has to be visible here too.
            const left = b.allocated - b.used;
            const pct = b.allocated > 0 ? Math.min(100, (b.used / b.allocated) * 100) : 0;
            const label = recordTypeLabel(t.calendarRecordTypes, b.type);
            return (
              <div key={b.type}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[13.5px] font-semibold">{label}</span>
                  <span className="tnum text-[13px]" style={{ color: "var(--text-muted)" }}>
                    <b style={{ color: left < 0 ? "var(--destructive)" : "var(--text)" }}>{left}</b>{" "}
                    / {b.allocated} {t.widgets.balance.leftSuffix}
                    {b.pending > 0 ? (
                      <span style={{ color: "var(--text-faint)" }}>
                        {t.widgets.balance.pending(b.pending)}
                      </span>
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
