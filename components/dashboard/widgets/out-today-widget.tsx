"use client";

// TODO(out-today widget): replace DEMO_LEAVE filter with real vacation data joined
//   to team metadata once we can list group teammates and their currently-active leave.

import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { LeaveTag } from "@/components/dashboard/leave-tag";
import { DEMO_LEAVE, DEMO_MONTH, demoById } from "@/lib/demo/team";

export function OutTodayWidget() {
  const out = DEMO_LEAVE.filter(
    (e) => e.who !== "all" && e.from <= DEMO_MONTH.today && e.to >= DEMO_MONTH.today
  );

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
          Everyone&apos;s in today.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {out.map((e) => {
            const p = demoById(e.who);
            if (!p) return null;
            return (
              <div key={e.id} className="flex items-center gap-3">
                <AvatarBubble initials={p.initials} background={p.av} size={36} name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{p.name}</div>
                  <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                    {p.role}
                  </div>
                </div>
                <LeaveTag type={e.type} small />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
