"use client";

import { Check } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { DEMO_TEAM } from "@/lib/demo/team";
import { VacationKind } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Decorative mini approval card for the landing bento; real components, no interactivity. */
export function ApprovalPreview() {
  const { t } = useTranslation();
  const p = DEMO_TEAM[1];
  return (
    <div
      aria-hidden
      className="pointer-events-none mt-auto select-none rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="flex items-center gap-3">
        <AvatarBubble initials={p.initials} background={p.av} name={p.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">{p.name}</div>
          <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            {t.leaveTypes[VacationKind.Vacation].label} · {t.landing.approvalPreviewDates}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
        >
          <Check className="h-[14px] w-[14px]" /> {t.vacationDetail.approve}
        </span>
        <span
          className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold"
          style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
        >
          {t.vacationDetail.decline}
        </span>
      </div>
    </div>
  );
}
