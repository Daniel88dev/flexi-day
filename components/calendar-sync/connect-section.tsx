"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Globe,
  Info,
  MoreHorizontal,
  PauseCircle,
  RefreshCw,
  TriangleAlert,
  Unlink,
  Users,
} from "lucide-react";
import type { CalendarProvider, CalendarSyncConfig, CalendarTarget } from "@/lib/api/calendar-sync";
import {
  CALENDAR_PROVIDER_SLUGS,
  providerSlug,
  type CalendarProviderSlug,
} from "@/lib/api/calendar-connections";
import { listTimezones } from "@/lib/attendance/timezones";
import { relativeTime } from "@/lib/calendar-sync/relative-time";
import type { Dictionary } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/use-translation";
import { GoogleMark, MicrosoftMark } from "./service-marks";

export const PROVIDER_NAMES: Record<CalendarProviderSlug, string> = {
  google: "Google",
  microsoft: "Microsoft",
};

export type ConnectHandlers = {
  /** Which provider switches are on; a provider that is off gets no button. */
  providers: Record<CalendarProviderSlug, boolean>;
  connectDisabled: boolean;
  onConnect: (config: CalendarSyncConfig, provider: CalendarProviderSlug) => void;
  onSyncNow: (config: CalendarSyncConfig) => void;
  onDisconnect: (config: CalendarSyncConfig) => void;
  onTimeZoneChange: (config: CalendarSyncConfig, timeZone: string) => Promise<unknown>;
};

type TargetState = "synced" | "syncing" | "reconnect" | "paused" | "failed";

function targetState(target: CalendarTarget): TargetState {
  if (target.status === "NEEDS_RECONNECT" || target.lastError === "auth_revoked") {
    return "reconnect";
  }
  if (target.status === "PAUSED") return "paused";
  // "plan" outlives the pause until the next successful sync; an active target is not paused.
  if (target.lastError && target.lastError !== "plan") return "failed";
  return target.syncing ? "syncing" : "synced";
}

function accountNote(target: CalendarTarget, t: Dictionary): string {
  const c = t.calSync.connect;
  if (target.provider === "MICROSOFT") {
    return target.lastSyncedAt ? c.notes.microsoft : c.checking;
  }
  if (target.capability === "STATUS") return c.notes.googleStatus;
  if (target.capability === "PLAIN") return c.notes.googlePlain;
  return c.checking;
}

function ProviderMark({ provider, size }: { provider: CalendarProviderSlug; size: number }) {
  return provider === "google" ? <GoogleMark size={size} /> : <MicrosoftMark size={size} />;
}

function Note({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p
      className="flex items-start gap-[7px] text-[12.5px] leading-normal"
      style={{ color: "var(--text-muted)" }}
    >
      <span className="flex-none" style={{ marginTop: 3 }}>
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}

function WarmAlert({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl"
      style={{
        padding: "13px 15px",
        background: "var(--warm-soft)",
        border: "1px solid color-mix(in oklch, var(--warm) 28%, transparent)",
      }}
    >
      <TriangleAlert
        size={17}
        className="flex-none"
        style={{ color: "var(--warm)", marginTop: 2 }}
      />
      <p
        className="flex-1 text-[13px] leading-normal"
        style={{ color: "color-mix(in oklch, var(--warm) 62%, var(--text))" }}
      >
        {children}
      </p>
      {action}
    </div>
  );
}

const CHIP_TONES = {
  ok: { color: "var(--ok)", background: "var(--ok-soft)", borderColor: "transparent" },
  warm: { color: "var(--warm)", background: "var(--warm-soft)", borderColor: "transparent" },
  neutral: undefined,
} as const;

function StatusChip({ state, t }: { state: TargetState; t: Dictionary }) {
  const chips = t.calSync.connect.chips;
  const [label, tone, icon] = {
    synced: [chips.synced, "ok", <Check key="i" size={12} />],
    syncing: [chips.syncing, "neutral", <RefreshCw key="i" size={12} />],
    reconnect: [chips.needsReconnect, "warm", <TriangleAlert key="i" size={12} />],
    failed: [chips.failed, "warm", <TriangleAlert key="i" size={12} />],
    paused: [chips.paused, "neutral", <PauseCircle key="i" size={12} />],
  }[state] as [string, keyof typeof CHIP_TONES, ReactNode];
  return (
    <span className="cs-chip" style={{ padding: "3px 9px", fontSize: 11.5, ...CHIP_TONES[tone] }}>
      {icon}
      {label}
    </span>
  );
}

function SyncMenu({
  showSyncNow,
  onSyncNow,
  onDisconnect,
}: {
  showSyncNow: boolean;
  onSyncNow: () => void;
  onDisconnect: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.calSync.connect.actions}
        aria-expanded={open}
        className="grid place-items-center rounded-lg"
        style={{
          width: 30,
          height: 30,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--text-muted)",
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div
          className="cs-card absolute top-[36px] right-0 z-30 p-1.5"
          style={{ width: 200, boxShadow: "var(--shadow-lg)" }}
        >
          {showSyncNow ? (
            <button
              type="button"
              onClick={pick(onSyncNow)}
              className="flex w-full items-center gap-2.5 rounded-lg text-left text-sm"
              style={{ padding: "9px 11px", color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <RefreshCw size={16} />
              {t.calSync.connect.syncNow}
            </button>
          ) : null}
          <button
            type="button"
            onClick={pick(onDisconnect)}
            className="flex w-full items-center gap-2.5 rounded-lg text-left text-sm"
            style={{
              padding: "9px 11px",
              color: "var(--danger)",
              ...(showSyncNow ? { marginTop: 4, borderTop: "1px solid var(--border)" } : {}),
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-soft)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Unlink size={16} />
            {t.calSync.connect.disconnect}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TimeZoneSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (timeZone: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);
  const zones = useMemo(() => {
    const all = listTimezones();
    return all.includes(value) ? all : [value, ...all];
  }, [value]);
  const shown = draft ?? value;

  return (
    <label className="inline-flex items-center gap-2">
      <Globe size={14} />
      {t.calSync.connect.timeZone}
      <select
        aria-label={t.calSync.connect.timeZone}
        value={shown}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          onChange(next).then(
            () => setDraft(null),
            () => setDraft(null)
          );
        }}
        className="cursor-pointer rounded-lg text-[13px] font-semibold"
        style={{
          color: "var(--text)",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          padding: "5px 10px",
        }}
      >
        {zones.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ children, menu }: { children: ReactNode; menu?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col gap-3"
      style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}
    >
      <div className="flex items-center justify-between gap-2.5" style={{ minHeight: 30 }}>
        <span className="cs-label" style={{ margin: 0 }}>
          {t.calSync.connect.label}
        </span>
        {menu}
      </div>
      {children}
    </div>
  );
}

function NotConnected({ config, ...h }: { config: CalendarSyncConfig } & ConnectHandlers) {
  const { t } = useTranslation();
  const c = t.calSync.connect;
  const enabled = CALENDAR_PROVIDER_SLUGS.filter((p) => h.providers[p]);
  const intro =
    enabled.length === 2
      ? c.intro.both
      : enabled[0] === "google"
        ? c.intro.google
        : c.intro.microsoft;

  return (
    <Section>
      <p className="text-sm leading-normal" style={{ color: "var(--text-muted)" }}>
        {intro}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {enabled.map((p) => (
          <button
            key={p}
            type="button"
            className="cs-btn cs-btn-ghost"
            disabled={h.connectDisabled}
            onClick={() => h.onConnect(config, p)}
            style={{
              flex: "1 1 180px",
              padding: "12px 16px",
              justifyContent: "flex-start",
              gap: 11,
              fontSize: 14.5,
            }}
          >
            <ProviderMark provider={p} size={20} />
            {c.connectProvider(PROVIDER_NAMES[p])}
          </button>
        ))}
      </div>
      <p
        className="flex items-start gap-[7px] text-[12.5px] leading-normal"
        style={{ color: "var(--text-faint)" }}
      >
        <Info size={14} className="flex-none" style={{ marginTop: 3 }} />
        <span>{c.whyPrimary}</span>
      </p>
    </Section>
  );
}

function Connected({
  config,
  target,
  ...h
}: { config: CalendarSyncConfig; target: CalendarTarget } & ConnectHandlers) {
  const { t } = useTranslation();
  const c = t.calSync.connect;
  const state = targetState(target);
  const slug = providerSlug(target.provider);

  const meta = (
    <div
      className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px]"
      style={{ color: "var(--text-muted)" }}
    >
      <span>{c.primaryCalendar}</span>
      <span style={{ opacity: 0.4 }}>•</span>
      {target.lastSyncedAt ? (
        <>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw size={14} />
            {c.lastSynced(relativeTime(target.lastSyncedAt, t))}
          </span>
          <span style={{ opacity: 0.4 }}>•</span>
        </>
      ) : null}
      <TimeZoneSelect value={target.timeZone} onChange={(tz) => h.onTimeZoneChange(config, tz)} />
    </div>
  );

  return (
    <Section
      menu={
        <SyncMenu
          showSyncNow={state !== "reconnect" && state !== "paused"}
          onSyncNow={() => h.onSyncNow(config)}
          onDisconnect={() => h.onDisconnect(config)}
        />
      }
    >
      <div className="flex items-center gap-[11px]">
        <ProviderMark provider={slug} size={22} />
        <span className="text-[14.5px] font-semibold">{PROVIDER_NAMES[slug]}</span>
        <StatusChip state={state} t={t} />
      </div>
      {state === "reconnect" ? (
        <>
          <WarmAlert
            action={
              <button
                type="button"
                className="cs-btn cs-btn-primary cs-btn-sm self-center"
                disabled={h.connectDisabled}
                onClick={() => h.onConnect(config, slug)}
              >
                {c.reconnect}
              </button>
            }
          >
            {c.reconnectBody}
          </WarmAlert>
          {meta}
        </>
      ) : (
        <>
          {meta}
          {state === "failed" ? (
            <WarmAlert>{c.failedBody}</WarmAlert>
          ) : (
            <Note icon={<Info size={14} />}>
              {state === "paused" ? c.pausedBody : accountNote(target, t)}
            </Note>
          )}
        </>
      )}
    </Section>
  );
}

export function ConnectSection({ config, ...h }: { config: CalendarSyncConfig } & ConnectHandlers) {
  const { t } = useTranslation();
  const anyProvider = CALENDAR_PROVIDER_SLUGS.some((p) => h.providers[p]);

  if (config.scope === "TEAM") {
    if (!anyProvider) return null;
    return (
      <Section>
        <Note icon={<Users size={14} />}>{t.calSync.connect.teamNote}</Note>
      </Section>
    );
  }
  if (config.target) return <Connected config={config} target={config.target} {...h} />;
  if (!anyProvider) return null;
  return <NotConnected config={config} {...h} />;
}

export function providerName(provider: CalendarProvider): string {
  return PROVIDER_NAMES[providerSlug(provider)];
}
