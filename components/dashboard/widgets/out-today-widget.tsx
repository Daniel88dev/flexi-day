"use client";

import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { LeaveTag } from "@/components/dashboard/leave-tag";
import { DEFAULT_LEAVE_TYPES, type LeaveTypeKey } from "@/lib/demo/leave-meta";
import { vacationStatus, VacationKind, type VacationListItem } from "@/lib/api/types";

interface OutTodayWidgetProps {
  vacations: VacationListItem[];
  todayDay: number | null;
}

export function OutTodayWidget({ vacations, todayDay }: OutTodayWidgetProps) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  // If the calendar month being viewed isn't the current month, "today" isn't meaningful.
  const considerToday = todayDay !== null;

  const seen = new Set<string>();
  const out: Array<{ user: VacationListItem["user"]; type: LeaveTypeKey }> = [];
  if (considerToday) {
    for (const v of vacations) {
      if (v.requestedDay !== todayIso) continue;
      if (vacationStatus(v) !== "approved") continue;
      if (v.vacationType === VacationKind.BankHoliday) continue;
      if (seen.has(v.userId)) continue;
      seen.add(v.userId);
      out.push({
        user: v.user,
        type: (DEFAULT_LEAVE_TYPES.includes(v.vacationType as LeaveTypeKey)
          ? v.vacationType
          : VacationKind.Vacation) as LeaveTypeKey,
      });
    }
  }

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Out today</h3>
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-[5px] text-[12.5px] font-semibold"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-muted)",
            borderColor: "var(--border)",
          }}
        >
          {out.length} away
        </span>
      </div>
      {out.length === 0 ? (
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          {considerToday ? "Everyone's in today." : "Viewing another month."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {out.map((e) => (
            <div key={e.user.id} className="flex items-center gap-3">
              <AvatarBubble
                initials={e.user.initials}
                background={e.user.avatarColor}
                size={36}
                name={e.user.name}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">{e.user.name}</div>
              </div>
              <LeaveTag type={e.type} small />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
