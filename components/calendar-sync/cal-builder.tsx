"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, Check, ShieldCheck, TriangleAlert, User, Users, X } from "lucide-react";
import type { CalendarSyncConfig, CalendarSyncInput } from "@/lib/api/calendar-sync";
import type { Group, VacationListItem } from "@/lib/api/types";
import { VACATION_KIND_LABELS, VacationKind } from "@/lib/api/types";
import {
  builderToInput,
  swatch,
  TYPE_META,
  TYPE_ORDER,
  type BuilderConfig,
  type SwatchKey,
} from "@/lib/calendar-sync/meta";
import { buildPreviewEntries } from "@/lib/calendar-sync/preview";
import { PreviewPanel, type PreviewMode } from "./preview-panel";
import { SubscribePanel } from "./subscribe-panel";
import { SwatchPicker } from "./swatch-picker";
import { pushToast } from "./toast";

export type MonthContext = {
  year: number;
  month: number; // 1-12
  label: string; // e.g. "July 2026"
  days: number;
  firstWeekdayMondayIdx: number;
};

function TypeRow({
  config,
  type,
  onToggle,
  onColor,
}: {
  config: BuilderConfig;
  type: VacationKind;
  onToggle: (t: VacationKind) => void;
  onColor: (key: string, v: SwatchKey) => void;
}) {
  const Icon = TYPE_META[type].icon;
  const on = config.types.includes(type);
  const split = config.distinguishMine && config.scope === "TEAM";
  const baseColor = swatch(config.colors[type]);
  return (
    <div
      className="flex items-center gap-3 rounded-xl"
      style={{
        padding: "10px 12px",
        border: "1px solid var(--border)",
        background: on ? "var(--surface)" : "var(--surface-2)",
        opacity: on ? 1 : 0.72,
        transition: "opacity .15s, background .15s",
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={() => onToggle(type)}
        className="grid flex-none place-items-center rounded-md"
        style={{
          width: 22,
          height: 22,
          border: `1.5px solid ${on ? "var(--primary)" : "var(--border-strong)"}`,
          background: on ? "var(--primary)" : "var(--surface)",
          color: "var(--primary-fg)",
        }}
      >
        {on ? <Check size={14} /> : null}
      </button>
      <span
        className="grid flex-none place-items-center rounded-lg"
        style={{
          width: 30,
          height: 30,
          color: baseColor,
          background: `color-mix(in oklch, ${baseColor} 15%, transparent)`,
        }}
      >
        <Icon size={16} />
      </span>
      <span className="flex-1 text-[14.5px] font-semibold">{VACATION_KIND_LABELS[type]}</span>
      {on ? (
        split ? (
          <div className="flex gap-1.5">
            <div className="text-right">
              <div
                className="mb-[3px] text-[9.5px] font-bold uppercase"
                style={{ letterSpacing: ".05em", color: "var(--text-faint)" }}
              >
                Mine
              </div>
              <SwatchPicker
                label={`${VACATION_KIND_LABELS[type]} — mine`}
                value={config.colors[`${type}_mine`] ?? config.colors[type]}
                onChange={(v) => onColor(`${type}_mine`, v)}
              />
            </div>
            <div className="text-right">
              <div
                className="mb-[3px] text-[9.5px] font-bold uppercase"
                style={{ letterSpacing: ".05em", color: "var(--text-faint)" }}
              >
                Team
              </div>
              <SwatchPicker
                label={`${VACATION_KIND_LABELS[type]} — team`}
                value={config.colors[type]}
                onChange={(v) => onColor(type, v)}
              />
            </div>
          </div>
        ) : (
          <SwatchPicker
            label={VACATION_KIND_LABELS[type]}
            value={config.colors[type]}
            onChange={(v) => onColor(type, v)}
          />
        )
      ) : null}
    </div>
  );
}

export function CalBuilder({
  initial,
  isNew,
  groups,
  vacations,
  currentUserId,
  monthCtx,
  onClose,
  onSubmit,
}: {
  initial: BuilderConfig;
  isNew: boolean;
  groups: Group[];
  vacations: VacationListItem[];
  currentUserId: string;
  monthCtx: MonthContext;
  onClose: () => void;
  onSubmit: (input: CalendarSyncInput) => Promise<CalendarSyncConfig>;
}) {
  const [config, setConfig] = useState<BuilderConfig>(initial);
  const [step, setStep] = useState<"form" | "loading" | "done">("form");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("month");
  const [touched, setTouched] = useState(false);

  const patch = (p: Partial<BuilderConfig>) => setConfig((c) => ({ ...c, ...p }));
  const nameError = touched && !config.name.trim();
  const teamError = touched && config.scope === "TEAM" && config.teamIds.length === 0;

  const toggleType = (id: VacationKind) =>
    patch({
      types: config.types.includes(id)
        ? config.types.filter((x) => x !== id)
        : [...config.types, id],
    });
  const setColor = (key: string, v: SwatchKey) =>
    setConfig((c) => ({ ...c, colors: { ...c.colors, [key]: v } }));
  const toggleTeam = (id: string) => {
    const has = config.teamIds.includes(id);
    patch({ teamIds: has ? config.teamIds.filter((x) => x !== id) : [...config.teamIds, id] });
  };
  const allTeams = groups.length > 0 && groups.every((g) => config.teamIds.includes(g.id));

  const previewEntries = useMemo(
    () => buildPreviewEntries(config, vacations, currentUserId, monthCtx.year, monthCtx.month),
    [config, vacations, currentUserId, monthCtx.year, monthCtx.month]
  );

  const submit = async () => {
    setTouched(true);
    if (!config.name.trim()) return;
    if (config.types.length === 0) {
      pushToast("Pick at least one record type", "danger");
      return;
    }
    if (config.scope === "TEAM" && config.teamIds.length === 0) return;
    setStep("loading");
    try {
      const saved = await onSubmit(builderToInput(config));
      setConfig((c) => ({ ...c, id: saved.id, feedUrl: saved.feedUrl, tokenMasked: false }));
      setStep("done");
    } catch (e) {
      setStep("form");
      pushToast(e instanceof Error ? e.message : "Couldn’t save the calendar", "danger");
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-[120] grid place-items-center p-[18px]"
      style={{
        background: "oklch(0.2 0.02 288 / 0.5)",
        backdropFilter: "blur(4px)",
        animation: "fx-fade .2s ease",
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="cs-card flex flex-col overflow-hidden"
        style={{
          width: step === "done" ? "min(720px,100%)" : "min(1060px,100%)",
          height: step === "done" ? "auto" : "min(88vh, 760px)",
          maxHeight: "92vh",
          boxShadow: "var(--shadow-lg)",
          animation: "fx-pop .28s ease",
        }}
      >
        {/* header */}
        <div
          className="flex flex-none items-center gap-3"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="grid flex-none place-items-center rounded-lg"
            style={{ width: 34, height: 34, color: "var(--primary)", background: "var(--primary-soft)" }}
          >
            <Calendar size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[17px] font-semibold"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              {step === "done" ? "Subscribe" : isNew ? "New calendar" : "Edit calendar"}
            </div>
            <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
              {step === "done"
                ? "Add it to your calendar app"
                : "Choose what to include and how it looks"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--text-muted)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {step === "done" && config.feedUrl ? (
          <div className="overflow-auto">
            <SubscribePanel
              name={config.name}
              feedUrl={config.feedUrl}
              onBack={() => setStep("form")}
              onClose={onClose}
            />
          </div>
        ) : step === "loading" ? (
          <div className="grid flex-1 place-items-center gap-4">
            <div className="text-center">
              <div
                className="mx-auto mb-4 rounded-full"
                style={{
                  width: 42,
                  height: 42,
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--primary)",
                  animation: "fx-spin .8s linear infinite",
                }}
              />
              <p className="text-[15px] font-semibold">Generating your secure link…</p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-faint)" }}>
                Creating a private token for this feed.
              </p>
            </div>
          </div>
        ) : (
          <div className="cs-cb-grid grid min-h-0 flex-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* LEFT: form */}
            <div
              className="flex flex-col gap-[22px] overflow-auto"
              style={{ padding: "22px 24px", borderRight: "1px solid var(--border)" }}
            >
              {/* name */}
              <div>
                <label className="cs-label" htmlFor="cal-name">
                  Calendar name
                </label>
                <input
                  id="cal-name"
                  className="cs-input"
                  placeholder="e.g. My time off, Design team absences"
                  value={config.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  style={nameError ? { borderColor: "var(--danger)" } : undefined}
                />
                {nameError ? (
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--danger)" }}
                  >
                    <TriangleAlert size={13} />
                    Give your calendar a name.
                  </p>
                ) : null}
              </div>

              {/* scope */}
              <div>
                <span className="cs-label">Whose records to include</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["ME", "Only my records", User],
                      ["TEAM", "My team’s records", Users],
                    ] as const
                  ).map(([v, l, Ic]) => {
                    const on = config.scope === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => patch({ scope: v })}
                        className="flex items-center gap-2.5 rounded-xl text-left"
                        style={{
                          padding: "12px 14px",
                          border: `1.5px solid ${on ? "var(--primary)" : "var(--border-strong)"}`,
                          background: on ? "var(--primary-soft)" : "var(--surface)",
                          color: on ? "var(--primary-strong)" : "var(--text-muted)",
                        }}
                      >
                        <Ic size={17} />
                        <span className="text-[13.5px] font-semibold">{l}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* teams */}
              <div
                style={{
                  opacity: config.scope === "ME" ? 0.5 : 1,
                  pointerEvents: config.scope === "ME" ? "none" : "auto",
                  transition: "opacity .15s",
                }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="cs-label" style={{ margin: 0 }}>
                    Teams to include
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      patch({ teamIds: allTeams ? [] : groups.map((g) => g.id) })
                    }
                    className="text-[12.5px] font-semibold"
                    style={{ color: "var(--primary)", background: "none", border: "none" }}
                  >
                    {allTeams ? "Clear all" : "Select all"}
                  </button>
                </div>
                {groups.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    You’re not a member of any team yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-[7px]">
                    {groups.map((g) => {
                      const on = config.teamIds.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleTeam(g.id)}
                          className="inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold"
                          style={{
                            padding: "7px 12px",
                            border: `1px solid ${on ? "var(--primary)" : "var(--border-strong)"}`,
                            background: on ? "var(--primary-soft)" : "var(--surface)",
                            color: on ? "var(--primary-strong)" : "var(--text-muted)",
                          }}
                        >
                          <span
                            className="grid place-items-center rounded-[5px]"
                            style={{
                              width: 16,
                              height: 16,
                              border: `1.5px solid ${on ? "var(--primary)" : "var(--border-strong)"}`,
                              background: on ? "var(--primary)" : "transparent",
                              color: "var(--primary-fg)",
                            }}
                          >
                            {on ? <Check size={11} /> : null}
                          </span>
                          {g.groupName}
                        </button>
                      );
                    })}
                  </div>
                )}
                {teamError ? (
                  <p
                    className="mt-2 flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--danger)" }}
                  >
                    <TriangleAlert size={13} />
                    Pick at least one team.
                  </p>
                ) : config.scope === "ME" ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
                    Only your own records are included — team choice doesn’t apply.
                  </p>
                ) : null}
              </div>

              {/* record types + colors */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="cs-label" style={{ margin: 0 }}>
                    Record types &amp; colors
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {TYPE_ORDER.map((id) => (
                    <TypeRow
                      key={id}
                      config={config}
                      type={id}
                      onToggle={toggleType}
                      onColor={setColor}
                    />
                  ))}
                </div>
                {config.scope === "TEAM" ? (
                  <div
                    className="mt-3 flex items-center gap-2.5 rounded-xl"
                    style={{ padding: "10px 12px", background: "var(--surface-2)" }}
                  >
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.distinguishMine}
                      onClick={() => patch({ distinguishMine: !config.distinguishMine })}
                      className="flex flex-none p-[2px]"
                      style={{
                        width: 40,
                        height: 23,
                        borderRadius: 999,
                        border: "none",
                        background: config.distinguishMine ? "var(--primary)" : "var(--border-strong)",
                        justifyContent: config.distinguishMine ? "flex-end" : "flex-start",
                        transition: "background .18s",
                      }}
                    >
                      <span
                        className="rounded-full"
                        style={{ width: 19, height: 19, background: "#fff", boxShadow: "var(--shadow-sm)" }}
                      />
                    </button>
                    <span className="text-[13.5px] font-semibold">
                      Give my own records a distinct color
                      <br />
                      <span className="text-xs font-normal" style={{ color: "var(--text-faint)" }}>
                        Tell your vacation apart from the team’s at a glance.
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* RIGHT: preview */}
            <div
              className="cs-cb-preview flex flex-col overflow-auto"
              style={{ padding: "22px 24px", background: "var(--bg-tint)" }}
            >
              <PreviewPanel
                name={config.name}
                entries={previewEntries}
                mode={previewMode}
                setMode={setPreviewMode}
                geometry={{
                  monthLabel: monthCtx.label,
                  monthDays: monthCtx.days,
                  firstWeekdayMondayIdx: monthCtx.firstWeekdayMondayIdx,
                }}
              />
            </div>
          </div>
        )}

        {/* footer (form step only) */}
        {step === "form" ? (
          <div
            className="flex flex-none items-center justify-between gap-3"
            style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <span
              className="flex items-center gap-1.5 text-[12.5px]"
              style={{ color: "var(--text-faint)" }}
            >
              <ShieldCheck size={14} />
              Read-only feed · a private link is generated on save
            </span>
            <div className="flex gap-2.5">
              <button type="button" className="cs-btn cs-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="cs-btn cs-btn-primary" onClick={submit}>
                {isNew ? "Save & get link" : "Save changes"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <style>{`@media (max-width: 860px){ .cs-cb-grid{ grid-template-columns: 1fr !important; grid-auto-rows: min-content; } .cs-cb-preview{ min-height: 380px; border-top: 1px solid var(--border); } }`}</style>
    </div>
  );
}
