"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export interface MobileStat {
  id: string;
  icon: ReactNode;
  tint: string;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accentValue?: boolean;
}

interface MobileStatStripProps {
  stats: MobileStat[];
  className?: string;
}

/**
 * Phone-sized counterpart to the four `StatCard`s: icon + number only, so all
 * four fit one row and the calendar stays above the fold. Tapping a tile opens
 * a single shared panel underneath with the label, sub-text and a link.
 */
export function MobileStatStrip({ stats, className }: MobileStatStripProps) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const panelId = useId();

  const open = stats.find((s) => s.id === openId) ?? null;

  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => {
          const isOpen = stat.id === openId;
          return (
            <button
              key={stat.id}
              type="button"
              aria-label={`${stat.label}: ${stat.value}`}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : stat.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 transition-colors"
              )}
              style={{
                background: isOpen
                  ? `color-mix(in oklch, ${stat.tint} 10%, var(--surface))`
                  : "var(--surface)",
                borderColor: isOpen
                  ? `color-mix(in oklch, ${stat.tint} 40%, transparent)`
                  : "var(--border)",
              }}
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-[9px]"
                style={{
                  color: stat.tint,
                  background: `color-mix(in oklch, ${stat.tint} 14%, transparent)`,
                }}
              >
                {stat.icon}
              </span>
              <span
                className="font-display tnum leading-none font-bold"
                style={{
                  fontSize: 22,
                  letterSpacing: "-0.03em",
                  color: stat.accentValue ? stat.tint : "var(--text)",
                }}
              >
                {stat.value}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="region"
        className={cn("overflow-hidden transition-all", open ? "mt-2" : "mt-0")}
      >
        {open ? (
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="min-w-0">
              <div className="text-[14px] font-semibold">{open.label}</div>
              {open.sub ? (
                <div className="text-[13px]" style={{ color: "var(--text-faint)" }}>
                  {open.value} {open.sub}
                </div>
              ) : null}
            </div>
            {open.href ? (
              <Link
                href={open.href}
                className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {t.dashboard.stats.viewRequests}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
