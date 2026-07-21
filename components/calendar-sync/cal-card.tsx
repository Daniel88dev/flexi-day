"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Copy,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  User,
  Users,
} from "lucide-react";
import type { CalendarSyncConfig } from "@/lib/api/calendar-sync";
import { colorFor, configToBuilder } from "@/lib/calendar-sync/meta";
import { TypeBadge } from "./type-badge";
import { copyText, pushToast } from "./toast";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function CalCard({
  config,
  teamsLabel,
  onEdit,
  onDelete,
  onRegen,
  resolveFeedUrl,
}: {
  config: CalendarSyncConfig;
  teamsLabel: string;
  onEdit: (c: CalendarSyncConfig) => void;
  onDelete: (c: CalendarSyncConfig) => void;
  onRegen: (c: CalendarSyncConfig) => void;
  resolveFeedUrl: (id: string) => Promise<string>;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menu]);

  const builder = configToBuilder(config);
  const copyUrl = async () => {
    try {
      const url = await resolveFeedUrl(config.id);
      await copyText(url);
      pushToast("Feed URL copied");
    } catch {
      pushToast("Couldn’t copy the feed URL", "danger");
    }
  };

  const ScopeIcon = config.scope === "ME" ? User : Users;

  return (
    <div className="cs-card flex h-full flex-col gap-4" style={{ padding: 22 }}>
      <div className="flex items-start gap-3.5">
        <span
          className="grid flex-none place-items-center rounded-xl"
          style={{ width: 44, height: 44, color: "var(--primary)", background: "var(--primary-soft)" }}
        >
          <Calendar size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-lg">{config.name}</h3>
          <div
            className="flex flex-wrap items-center gap-2 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <ScopeIcon size={14} />
              {config.scope === "ME" ? "My records" : `Team records · ${teamsLabel}`}
            </span>
            {config.lastFetchedAt ? (
              <>
                <span style={{ opacity: 0.4 }}>•</span>
                <span>Last fetched {relativeTime(config.lastFetchedAt)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="More actions"
            className="grid place-items-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--text-muted)",
            }}
          >
            <MoreHorizontal size={18} />
          </button>
          {menu ? (
            <div
              className="cs-card absolute right-0 top-[42px] z-30 p-1.5"
              style={{ width: 200, boxShadow: "var(--shadow-lg)" }}
            >
              {(
                [
                  ["Edit", <Pencil key="i" size={16} />, () => onEdit(config)],
                  ["Copy feed URL", <Copy key="i" size={16} />, copyUrl],
                  ["Regenerate token", <RefreshCw key="i" size={16} />, () => onRegen(config)],
                ] as const
              ).map(([label, icon, fn]) => (
                <button
                  key={label}
                  onClick={() => {
                    setMenu(false);
                    fn();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg text-left text-sm"
                  style={{ padding: "9px 11px", color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {icon}
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMenu(false);
                  onDelete(config);
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg text-left text-sm"
                style={{
                  padding: "9px 11px",
                  color: "var(--danger)",
                  borderTop: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-auto flex flex-wrap gap-[7px]">
        {config.types.map((t) => (
          <TypeBadge
            key={t.type}
            type={t.type}
            color={colorFor(builder, t.type, config.scope === "ME")}
            small
          />
        ))}
      </div>

      <div
        className="flex items-center gap-2 rounded-xl"
        style={{
          padding: "8px 8px 8px 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <LinkIcon size={16} style={{ color: "var(--text-faint)", flex: "none" }} />
        <span
          className="tnum min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
        >
          {config.feedUrl}
        </span>
        <button
          onClick={copyUrl}
          className="cs-btn cs-btn-primary cs-btn-sm"
          style={{ padding: "7px 12px" }}
        >
          <Copy size={15} />
          Copy
        </button>
      </div>
    </div>
  );
}
