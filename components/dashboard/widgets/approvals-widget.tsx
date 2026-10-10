"use client";

import { useId, type ReactNode } from "react";
import { Check, CheckCircle2, Clock } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import {
  useApproveVacations,
  useMyApprovals,
  useMyPendingRequests,
  useRejectVacations,
} from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { recordTypeLabel } from "@/lib/i18n/record-type-label";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import { useOpenVacationDetail } from "@/lib/vacations/use-vacation-detail";
import { useViewerRoles } from "@/lib/viewer/use-viewer-roles";
import type { PendingApproval } from "@/lib/api/types";

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

type ListQuery = { data?: PendingApproval[]; isLoading: boolean; error: Error | null };

export function ApprovalsWidget() {
  const { t } = useTranslation();
  const approvals = useMyApprovals();
  const roles = useViewerRoles();

  const items = approvals.data ?? [];
  const isApprover = items.length > 0 || (!roles.isLoading && roles.isApprover);

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

      <div className="flex flex-col gap-5">
        {isApprover ? (
          <Section title={t.widgets.approvals.waitingOnYou}>
            <WaitingOnYou query={approvals} />
          </Section>
        ) : null}
        <Section title={t.widgets.approvals.yourRequests}>
          <YourRequests />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h4
        id={id}
        className="mb-2.5 text-[12px] font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

function ListStatus({ query, empty }: { query: ListQuery; empty: ReactNode }) {
  const { t } = useTranslation();
  if (query.isLoading) {
    return (
      <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
        {t.common.loading}
      </p>
    );
  }
  if (query.error) {
    return (
      <p className="text-[14px]" style={{ color: "var(--destructive)" }}>
        {query.error.message}
      </p>
    );
  }
  return (
    <div
      className="flex items-center gap-2.5 px-1 py-2 text-[14px]"
      style={{ color: "var(--text-muted)" }}
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--c-home)" }} /> {empty}
    </div>
  );
}

function WaitingOnYou({ query }: { query: ListQuery }) {
  const { t } = useTranslation();
  const approve = useApproveVacations();
  const reject = useRejectVacations();
  const items = query.data ?? [];
  const isMutating = approve.isPending || reject.isPending;

  if (query.isLoading || query.error || items.length === 0) {
    return <ListStatus query={query} empty={t.widgets.approvals.allCaughtUp} />;
  }

  return (
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
  );
}

function YourRequests() {
  const { t } = useTranslation();
  const query = useMyPendingRequests();
  const { openVacation } = useOpenVacationDetail();
  const items = query.data ?? [];

  if (query.isLoading || query.error || items.length === 0) {
    return <ListStatus query={query} empty={t.widgets.approvals.noPendingRequests} />;
  }

  return (
    <div className="-mx-2 flex flex-col gap-1">
      {items.map((r) => {
        const firstId = r.vacationIds[0];
        return (
          <button
            key={firstId ?? `${r.groupId}-${r.from}`}
            type="button"
            onClick={() => firstId && openVacation(firstId)}
            disabled={!firstId}
            className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors outline-none hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <span
              aria-hidden
              className="mt-1 h-9 w-1 shrink-0 rounded-full"
              style={{ background: leaveMetaFor(r.vacationType).cssVar }}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[14.5px] font-semibold">
                {recordTypeLabel(t.calendarRecordTypes, r.vacationType)}
              </span>
              <span className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                {t.widgets.approvals.span(
                  formatRange(r.from, r.to, t.calendar.monthsShort),
                  r.businessDays
                )}
              </span>
              <span
                className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium"
                style={{ color: "var(--warm)" }}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {t.widgets.approvals.waitingIn(r.groupName)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
