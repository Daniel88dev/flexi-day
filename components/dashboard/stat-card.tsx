import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  tint: string;
  label: string;
  value: string | number;
  sub?: string;
  accentValue?: boolean;
}

export function StatCard({ icon, tint, label, value, sub, accentValue }: StatCardProps) {
  return (
    <div
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span
          className="grid h-[38px] w-[38px] place-items-center rounded-[11px]"
          style={{
            color: tint,
            background: `color-mix(in oklch, ${tint} 14%, transparent)`,
          }}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span
          className="font-display tnum leading-none font-bold"
          style={{
            fontSize: 42,
            letterSpacing: "-0.03em",
            color: accentValue ? tint : "var(--text)",
          }}
        >
          {value}
        </span>
        {sub ? (
          <span className="text-[13.5px]" style={{ color: "var(--text-faint)" }}>
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}
