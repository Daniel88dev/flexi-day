"use client";

// TODO(approvals widget): wire to real pending approvals for the manager's groups.
//   The existing API only exposes `useApproveVacation(id)` plus per-month vacations;
//   when a "list pending across managed groups" endpoint exists, swap DEMO_APPROVALS
//   for that query and call useApproveVacation / a reject mutation from `act()`.

import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { DEMO_APPROVALS, demoById } from "@/lib/demo/team";
import { leaveMetaFor } from "@/lib/demo/leave-meta";

export function ApprovalsWidget() {
  const [items, setItems] = useState(DEMO_APPROVALS);
  const act = (id: string) => setItems((s) => s.filter((i) => i.id !== id));

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Pending approvals</h3>
        {items.length > 0 ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[12.5px] font-semibold"
            style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
          >
            {items.length} to review
          </span>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div
          className="flex items-center gap-2.5 px-1 py-3.5 text-[14px]"
          style={{ color: "var(--text-muted)" }}
        >
          <CheckCircle2 className="h-5 w-5" style={{ color: "var(--c-home)" }} /> All caught up —
          nothing waiting.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((a) => {
            const p = demoById(a.who);
            if (!p) return null;
            const meta = leaveMetaFor(a.type);
            return (
              <div key={a.id} className="flex items-start gap-3">
                <AvatarBubble initials={p.initials} background={p.av} size={38} name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{p.name}</div>
                  <div className="mb-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                    {meta.label} · Jun {a.from}–{a.to} · {a.days} days
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => act(a.id)}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13.5px] font-semibold"
                      style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => act(a.id)}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-[13.5px] font-semibold"
                      style={{
                        borderColor: "var(--border-strong)",
                        color: "var(--text)",
                        background: "transparent",
                      }}
                    >
                      Decline
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
