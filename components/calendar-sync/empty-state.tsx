"use client";

import { Calendar, Plus, RefreshCw } from "lucide-react";

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="cs-card flex flex-col items-center gap-2 text-center"
      style={{ padding: "64px 32px", borderStyle: "dashed", animation: "fx-fade .4s ease" }}
    >
      <div className="relative mb-3" style={{ width: 96, height: 96 }}>
        <span
          className="absolute inset-0 rounded-3xl"
          style={{ background: "var(--primary-soft)" }}
        />
        <span
          className="absolute inset-0 grid place-items-center"
          style={{ color: "var(--primary)" }}
        >
          <Calendar size={44} />
        </span>
        <span
          className="absolute grid place-items-center rounded-full"
          style={{
            right: -6,
            bottom: -6,
            width: 36,
            height: 36,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--primary)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <RefreshCw size={18} />
        </span>
      </div>
      <h2 className="text-[25px]">No calendars yet</h2>
      <p className="mb-3 text-[15.5px]" style={{ color: "var(--text-muted)", maxWidth: 440 }}>
        Create a calendar to push your team&apos;s time off into Google, Outlook or Apple Calendar.
        Subscribe once — it stays up to date on its own.
      </p>
      <button type="button" className="cs-btn cs-btn-primary cs-btn-lg" onClick={onCreate}>
        <Plus size={18} />
        Create your first calendar
      </button>
    </div>
  );
}
