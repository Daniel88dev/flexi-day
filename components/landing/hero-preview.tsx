"use client";

import { Lock } from "lucide-react";
import { LeaveCalendar, type CalendarRange } from "@/components/dashboard/leave-calendar";
import { DEFAULT_LEAVE_TYPES, leaveMetaFor } from "@/lib/demo/leave-meta";
import { DEMO_LEAVE, DEMO_MONTH, demoById } from "@/lib/demo/team";

export function HeroPreview() {
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
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        <span className="flex gap-1.5">
          {["#f0916b", "#e9b15a", "#74c08a"].map((c) => (
            <span
              key={c}
              className="block h-[11px] w-[11px] rounded-full"
              style={{ background: c }}
            />
          ))}
        </span>
        <div className="flex flex-1 justify-center">
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: "var(--text-faint)" }}
          >
            <Lock className="h-[11px] w-[11px]" /> app.flexiday.com
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-display text-[17px] font-semibold">{DEMO_MONTH.label}</div>
            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
              Northwind · 10 teammates
            </div>
          </div>
          <div className="flex gap-1.5">
            {DEFAULT_LEAVE_TYPES.slice(0, 4).map((t) => {
              const m = leaveMetaFor(t);
              return (
                <span
                  key={t}
                  title={m.label}
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
