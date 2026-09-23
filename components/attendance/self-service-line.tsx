"use client";

import Link from "next/link";
import { CalendarDays, Lock } from "lucide-react";
import { selfServiceMode, type SelfServiceWindow } from "@/lib/attendance/self-service";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The organization's self-service window in one line above Team attendance. A
 * group admin cannot open the Organization page, so this is where they read
 * it; an org admin gets a link to change it.
 */
export function SelfServiceLine({
  selfService,
  canChange,
}: {
  selfService: SelfServiceWindow;
  canChange: boolean;
}) {
  const { t } = useTranslation();
  const copy = t.teamAttendance;

  const days = selfService.days ?? 0;
  const [title, body] = (() => {
    switch (selfServiceMode(selfService)) {
      case "OFF":
        return [copy.selfServiceOffTitle, copy.selfServiceOffBody];
      case "NO_LIMIT":
        return [copy.selfServiceNoLimitTitle, copy.selfServiceNoLimitBody];
      case "TODAY":
        return [copy.selfServiceZeroTitle, copy.selfServiceZeroBody];
      case "DAYS":
        return [copy.selfServiceDaysTitle(days), copy.selfServiceDaysBody(days)];
    }
  })();

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 text-sm"
      style={{ borderColor: "var(--border)" }}
    >
      {canChange ? (
        <CalendarDays className="size-4 shrink-0" aria-hidden />
      ) : (
        <Lock className="size-4 shrink-0" aria-hidden />
      )}
      <p className="min-w-0 flex-1">
        <b>{title}</b> {body}
      </p>
      {canChange ? (
        <Link href="/organization" className="text-primary text-sm font-medium underline">
          {copy.selfServiceChange}
        </Link>
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {copy.selfServiceSetBy}
        </span>
      )}
    </div>
  );
}
