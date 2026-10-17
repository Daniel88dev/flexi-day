"use client";

// PROTOTYPE (T-339): the Group events and Birthdays toggles in the calendar builder, three
// arrangements switched with ?variant=A|B|C. Nothing saves: the extras live in builder state
// only and feed fixture entries into the preview. Lives on prototype/birthday-settings only.

import { Cake, CalendarHeart, Check } from "lucide-react";
import type { CalendarRecordType } from "@/lib/api/types";
import type { BuilderConfig, SwatchKey } from "@/lib/calendar-sync/meta";
import { swatch, TYPE_META } from "@/lib/calendar-sync/meta";
import type { PreviewEntry } from "@/lib/calendar-sync/preview";
import { SwatchPicker } from "./swatch-picker";

export type ExtraKey = "events" | "birthdays";
export type Extras = { on: Record<ExtraKey, boolean>; colors: Record<ExtraKey, SwatchKey> };

export const initialExtras: Extras = {
  on: { events: false, birthdays: false },
  colors: { events: "teal", birthdays: "coral" },
};

// The preview labels an entry by its type string, so these double as the visible labels.
const EVENT_TYPE = "Group event" as CalendarRecordType;
const BIRTHDAY_TYPE = "Birthday" as CalendarRecordType;
(TYPE_META as Record<string, unknown>)[EVENT_TYPE] = { icon: CalendarHeart, def: "teal" };
(TYPE_META as Record<string, unknown>)[BIRTHDAY_TYPE] = { icon: Cake, def: "coral" };

const META: Record<ExtraKey, { label: string; icon: typeof Cake }> = {
  events: { label: "Group events", icon: CalendarHeart },
  birthdays: { label: "Birthdays", icon: Cake },
};

export function extraReading(key: ExtraKey, scope: BuilderConfig["scope"]) {
  if (key === "events") {
    return scope === "TEAM" ? "Events in the selected groups." : "Events in every group you're in.";
  }
  return scope === "TEAM"
    ? "Birthdays that members of the selected groups chose to share. Never with ages."
    : "Only your own birthday.";
}

export function extraPreviewEntries(config: BuilderConfig, extras: Extras): PreviewEntry[] {
  const out: PreviewEntry[] = [];
  const c = (k: ExtraKey) => swatch(extras.colors[k]);
  if (extras.on.events) {
    out.push(
      {
        id: "x-e1",
        type: EVENT_TYPE,
        from: 9,
        to: 9,
        name: "Team lunch, 12:00",
        isMine: false,
        color: c("events"),
        note: null,
      },
      {
        id: "x-e2",
        type: EVENT_TYPE,
        from: 20,
        to: 22,
        name: "Offsite in Brno",
        isMine: false,
        color: c("events"),
        note: null,
      }
    );
  }
  if (extras.on.birthdays) {
    if (config.scope === "TEAM") {
      out.push(
        {
          id: "x-b1",
          type: BIRTHDAY_TYPE,
          from: 6,
          to: 6,
          name: "Tereza Nováková",
          isMine: false,
          color: c("birthdays"),
          note: null,
        },
        {
          id: "x-b2",
          type: BIRTHDAY_TYPE,
          from: 27,
          to: 27,
          name: "Marek Dvořák",
          isMine: false,
          color: c("birthdays"),
          note: null,
        }
      );
    } else {
      out.push({
        id: "x-b0",
        type: BIRTHDAY_TYPE,
        from: 24,
        to: 24,
        name: "You",
        isMine: true,
        color: c("birthdays"),
        note: null,
      });
    }
  }
  return out;
}

type RowProps = {
  k: ExtraKey;
  config: BuilderConfig;
  extras: Extras;
  setExtras: React.Dispatch<React.SetStateAction<Extras>>;
};

function toggle(extras: Extras, k: ExtraKey): Extras {
  return { ...extras, on: { ...extras.on, [k]: !extras.on[k] } };
}

/* A and C: the same row as a record type, with a second line saying what the toggle covers. */
export function ExtraCheckRow({ k, config, extras, setExtras }: RowProps) {
  const on = extras.on[k];
  const Icon = META[k].icon;
  const color = swatch(extras.colors[k]);
  return (
    <div
      className="flex items-center gap-3 rounded-xl"
      style={{
        padding: "10px 12px",
        border: "1px solid var(--border)",
        background: on ? "var(--surface)" : "var(--surface-2)",
        opacity: on ? 1 : 0.72,
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={() => setExtras((e) => toggle(e, k))}
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
          color,
          background: `color-mix(in oklch, ${color} 15%, transparent)`,
        }}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold">{META[k].label}</span>
        <span className="block text-xs" style={{ color: "var(--text-faint)" }}>
          {extraReading(k, config.scope)}
        </span>
      </span>
      {on ? (
        <SwatchPicker
          label={META[k].label}
          value={extras.colors[k]}
          onChange={(v) => setExtras((e) => ({ ...e, colors: { ...e.colors, [k]: v } }))}
        />
      ) : null}
    </div>
  );
}

export function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-2 text-[10.5px] font-bold uppercase first:mt-0"
      style={{ letterSpacing: ".06em", color: "var(--text-faint)" }}
    >
      {children}
    </div>
  );
}

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="flex flex-none p-[2px]"
      style={{
        width: 40,
        height: 23,
        borderRadius: 999,
        border: "none",
        background: on ? "var(--primary)" : "var(--border-strong)",
        justifyContent: on ? "flex-end" : "flex-start",
        transition: "background .18s",
      }}
    >
      <span
        className="rounded-full"
        style={{ width: 19, height: 19, background: "#fff", boxShadow: "var(--shadow-sm)" }}
      />
    </button>
  );
}

/* B: its own section under the record types, switches instead of checkboxes. */
export function ExtrasSection({ config, extras, setExtras }: Omit<RowProps, "k">) {
  return (
    <div>
      <span className="cs-label">Also from the group calendar</span>
      <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
        {(["events", "birthdays"] as const).map((k, i) => {
          const Icon = META[k].icon;
          const color = swatch(extras.colors[k]);
          return (
            <div
              key={k}
              className="flex items-start gap-3"
              style={{
                padding: "12px 14px",
                borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                background: "var(--surface)",
              }}
            >
              <Icon size={17} style={{ color, marginTop: 2 }} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{META[k].label}</div>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                  {extraReading(k, config.scope)}
                </p>
                {extras.on[k] ? (
                  <div className="mt-2">
                    <SwatchPicker
                      label={META[k].label}
                      value={extras.colors[k]}
                      onChange={(v) =>
                        setExtras((e) => ({ ...e, colors: { ...e.colors, [k]: v } }))
                      }
                    />
                  </div>
                ) : null}
              </div>
              <Switch
                on={extras.on[k]}
                label={META[k].label}
                onClick={() => setExtras((e) => toggle(e, k))}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
        Off until you turn them on, on new and existing calendars alike.
      </p>
    </div>
  );
}
