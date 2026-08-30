"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { useApproveVacations, useMyApprovals, useRejectVacations } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";

function formatRange(fromIso: string, toIso: string, monthsShort: string[]) {
  const f = new Date(fromIso);
  const t = new Date(toIso);
  const fm = monthsShort[f.getMonth()];
  const tm = monthsShort[t.getMonth()];
  // Or next January's "Jan 6" reads as this January's.
  const year = f.getFullYear() === new Date().getFullYear() ? "" : ` ${f.getFullYear().toString()}`;
  if (fromIso === toIso) return `${fm} ${f.getDate()}${year}`;
  if (fm === tm) return `${fm} ${f.getDate()}–${t.getDate()}${year}`;
  return `${fm} ${f.getDate()} – ${tm} ${t.getDate()}${year}`;
}

export function ApprovalsWidget() {
  const { t } = useTranslation();
  const query = useMyApprovals();
  const approve = useApproveVacations();
  const reject = useRejectVacations();

  const items = query.data ?? [];
  const isLoading = query.isLoading;
  const isMutating = approve.isPending || reject.isPending;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">{t.widgets.approvals.title}</h3>
        {items.length > 0 ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[12.5px] font-semibold"
            style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
          >
            {t.widgets.approvals.toReview(items.length)}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          {t.common.loading}
        </p>
      ) : query.error ? (
        <p className="text-[14px]" style={{ color: "var(--destructive)" }}>
          {query.error.message}
        </p>
      ) : items.length === 0 ? (
        <div
          className="flex items-center gap-2.5 px-1 py-3.5 text-[14px]"
          style={{ color: "var(--text-muted)" }}
        >
          <CheckCircle2 className="h-5 w-5" style={{ color: "var(--c-home)" }} />{" "}
          {t.widgets.approvals.allCaughtUp}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((a) => {
            const typeLabel = recordTypeLabel(t.calendarRecordTypes, a.vacationType);
            const rowKey = a.vacationIds[0] ?? `${a.user.id}-${a.from}`;
            return (
              <div key={rowKey} className="flex items-start gap-3">
                <AvatarBubble
                  initials={a.user.initials}
                  background={a.user.avatarColor}
                  size={38}
                  name={a.user.name}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{a.user.name}</div>
                  <div className="mb-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                    {t.widgets.approvals.meta(
                      typeLabel,
                      formatRange(a.from, a.to, t.calendar.monthsShort),
                      a.businessDays
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approve.mutate(a.vacationIds)}
                      disabled={isMutating || a.vacationIds.length === 0}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13.5px] font-semibold disabled:opacity-60"
                      style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
                    >
                      <Check className="h-3.5 w-3.5" /> {t.widgets.approvals.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => reject.mutate({ ids: a.vacationIds })}
                      disabled={isMutating || a.vacationIds.length === 0}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-[13.5px] font-semibold disabled:opacity-60"
                      style={{
                        borderColor: "var(--border-strong)",
                        color: "var(--text)",
                        background: "transparent",
                      }}
                    >
                      {t.widgets.approvals.decline}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
