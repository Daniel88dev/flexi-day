"use client";

import { LeaveCalendar, type CalendarRange } from "@/components/dashboard/leave-calendar";
import { DEFAULT_LEAVE_TYPES, leaveMetaFor } from "@/lib/demo/leave-meta";
import { DEMO_LEAVE, DEMO_MONTH, demoById } from "@/lib/demo/team";
import { useTranslation } from "@/lib/i18n/use-translation";

export function HeroPreview() {
  const { t } = useTranslation();
  const ranges: CalendarRange[] = DEMO_LEAVE.map((l) => {
    const p = l.who === "all" ? undefined : demoById(l.who);
    return {
      id: l.id,
      who: l.who,
      user: p ? { id: p.id, name: p.name, initials: p.initials, avatarColor: p.av } : undefined,
      type: l.type,
      from: l.from,
      to: l.to,
      note: l.note,
    };
  });
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-display text-[17px] font-semibold">
              {t.calendar.months[DEMO_MONTH.monthIdx]} {DEMO_MONTH.year}
            </div>
            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
              {t.landing.heroPreviewTeam(10)}
            </div>
          </div>
          <div className="flex gap-1.5">
            {DEFAULT_LEAVE_TYPES.slice(0, 4).map((kind) => {
              const m = leaveMetaFor(kind);
              return (
                <span
                  key={kind}
                  title={t.leaveTypes[kind].label}
                  className="block h-[9px] w-[9px] rounded-full"
                  style={{ background: m.cssVar }}
                />
              );
            })}
          </div>
        </div>
        <LeaveCalendar
          monthDays={30}
          firstWeekdayMondayIdx={0}
          todayDay={DEMO_MONTH.today}
          ranges={ranges}
          mini
        />
      </div>
    </div>
  );
}
