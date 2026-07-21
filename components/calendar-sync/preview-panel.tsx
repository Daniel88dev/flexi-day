"use client";

import { Filter, Info } from "lucide-react";
import { VACATION_KIND_LABELS } from "@/lib/api/types";
import { TYPE_META } from "@/lib/calendar-sync/meta";
import type { PreviewEntry } from "@/lib/calendar-sync/preview";

const WD = ["M", "T", "W", "T", "F", "S", "S"];

function buildWeeks(monthDays: number, firstIdxMon: number) {
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstIdxMon; i++) cells.push(null);
  for (let d = 1; d <= monthDays; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export type PreviewMode = "month" | "agenda";

type Geometry = { monthLabel: string; monthDays: number; firstWeekdayMondayIdx: number };

export function PreviewPanel({
  name,
  entries,
  mode,
  setMode,
  geometry,
}: {
  name: string;
  entries: PreviewEntry[];
  mode: PreviewMode;
  setMode: (m: PreviewMode) => void;
  geometry: Geometry;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3.5 flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex-none rounded"
            style={{ width: 12, height: 12, background: "var(--primary)" }}
          />
          <span className="truncate text-sm font-bold">{name || "Untitled calendar"}</span>
        </div>
        <div
          className="flex gap-[3px] rounded-full p-[3px]"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          {(["month", "agenda"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="rounded-full text-xs font-semibold capitalize"
              style={{
                padding: "6px 13px",
                background: mode === m ? "var(--surface)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--text-muted)",
                boxShadow: mode === m ? "var(--shadow-sm)" : "none",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="grid flex-1 place-items-center rounded-xl p-8 text-center"
          style={{ border: "1px dashed var(--border-strong)", color: "var(--text-faint)" }}
        >
          <div>
            <Filter size={26} style={{ marginBottom: 8 }} />
            <p className="text-[13.5px]">
              Nothing matches in {geometry.monthLabel}.
              <br />
              Turn on a record type or pick a team.
            </p>
          </div>
        </div>
      ) : mode === "month" ? (
        <MonthPreview entries={entries} geometry={geometry} />
      ) : (
        <AgendaPreview entries={entries} monthLabel={geometry.monthLabel} />
      )}

      <div
        className="mt-3 flex items-center gap-1.5 text-xs"
        style={{ color: "var(--text-faint)" }}
      >
        <Info size={13} /> Preview of {geometry.monthLabel} · {entries.length} event
        {entries.length === 1 ? "" : "s"} in this feed.
      </div>
    </div>
  );
}

type PlacedBar = PreviewEntry & {
  sc: number;
  ec: number;
  contL: boolean;
  contR: boolean;
  lane: number;
};

function MonthPreview({ entries, geometry }: { entries: PreviewEntry[]; geometry: Geometry }) {
  const weeks = buildWeeks(geometry.monthDays, geometry.firstWeekdayMondayIdx);
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div
        className="grid grid-cols-7"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        {WD.map((w, i) => (
          <div
            key={i}
            className="text-[10px] font-bold"
            style={{
              padding: "6px 8px",
              letterSpacing: ".04em",
              color: i >= 5 ? "var(--text-faint)" : "var(--text-muted)",
            }}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        {weeks.map((week, wi) => {
          const nums = week.filter((d): d is number => d !== null);
          if (nums.length === 0) return null;
          const ws = nums[0];
          const we = nums[nums.length - 1];
          const bars: PlacedBar[] = entries
            .filter((e) => e.from <= we && e.to >= ws)
            .map((e) => {
              const cf = Math.max(e.from, ws);
              const ct = Math.min(e.to, we);
              return {
                ...e,
                sc: week.indexOf(cf) + 1,
                ec: week.indexOf(ct) + 2,
                contL: e.from < ws,
                contR: e.to > we,
                lane: 0,
              };
            })
            .sort((a, b) => a.sc - b.sc || b.ec - b.sc - (a.ec - a.sc));

          const lanes: PlacedBar[][] = [];
          for (const b of bars) {
            let placed = false;
            for (let li = 0; li < lanes.length; li++) {
              if (lanes[li].every((x) => b.sc >= x.ec || b.ec <= x.sc)) {
                lanes[li].push(b);
                b.lane = li;
                placed = true;
                break;
              }
            }
            if (!placed) {
              b.lane = lanes.length;
              lanes.push([b]);
            }
          }
          const shown = bars.filter((b) => b.lane < 2);
          const overflow = Math.max(0, lanes.length - 2);

          return (
            <div
              key={wi}
              className="relative flex-1"
              style={{
                borderBottom: wi < weeks.length - 1 ? "1px solid var(--border)" : "none",
                minHeight: 62,
              }}
            >
              <div className="grid h-full grid-cols-7">
                {week.map((d, di) => (
                  <div
                    key={di}
                    style={{
                      borderRight: di < 6 ? "1px solid var(--border)" : "none",
                      padding: "4px 6px",
                      background:
                        d == null
                          ? "color-mix(in oklch, var(--surface-2) 50%, transparent)"
                          : di >= 5
                            ? "color-mix(in oklch, var(--surface-2) 40%, transparent)"
                            : "transparent",
                    }}
                  >
                    {d ? (
                      <span
                        className="tnum text-[10.5px] font-medium"
                        style={{ color: di >= 5 ? "var(--text-faint)" : "var(--text-muted)" }}
                      >
                        {d}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div
                className="pointer-events-none absolute grid grid-cols-7"
                style={{ left: 0, right: 0, top: 20, bottom: 3, gridAutoRows: "16px", rowGap: 2, padding: "0 3px" }}
              >
                {shown.map((b, i) => {
                  const Icon = TYPE_META[b.type].icon;
                  return (
                    <div key={i} style={{ gridColumn: `${b.sc} / ${b.ec}`, gridRow: b.lane + 1 }}>
                      <div
                        title={`${b.name} · ${VACATION_KIND_LABELS[b.type]}`}
                        className="flex items-center gap-[3px] overflow-hidden whitespace-nowrap text-[9px] font-bold"
                        style={{
                          height: 15,
                          borderRadius: `${b.contL ? 0 : 5}px ${b.contR ? 0 : 5}px ${b.contR ? 0 : 5}px ${b.contL ? 0 : 5}px`,
                          padding: "0 4px",
                          color: `color-mix(in oklch, ${b.color} 74%, var(--text))`,
                          background: `color-mix(in oklch, ${b.color} 20%, var(--surface))`,
                          borderLeft: `2.5px solid ${b.color}`,
                        }}
                      >
                        {!b.contL ? <Icon size={9} style={{ color: b.color, flex: "none" }} /> : null}
                        {!b.contL ? (
                          <span className="overflow-hidden text-ellipsis">
                            {b.isMine ? "You" : b.name.split(" ")[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              {overflow > 0 ? (
                <span
                  className="absolute text-[9px] font-bold"
                  style={{ right: 5, bottom: 3, color: "var(--text-faint)" }}
                >
                  +{overflow}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaPreview({ entries, monthLabel }: { entries: PreviewEntry[]; monthLabel: string }) {
  const sorted = [...entries].sort((a, b) => a.from - b.from || a.to - b.to);
  const mon = monthLabel.split(" ")[0].slice(0, 3);
  const fmt = (d: number) => `${mon} ${d}`;
  return (
    <div
      className="min-h-0 flex-1 overflow-auto rounded-xl"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      {sorted.map((e, i) => {
        const Icon = TYPE_META[e.type].icon;
        return (
          <div
            key={e.id}
            className="flex items-center gap-3"
            style={{
              padding: "11px 14px",
              borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none",
              borderLeft: `3px solid ${e.color}`,
            }}
          >
            <div
              className="tnum flex-none text-[11.5px] font-bold leading-tight"
              style={{ width: 62, color: "var(--text-muted)" }}
            >
              {fmt(e.from)}
              {e.to !== e.from ? (
                <>
                  <br />
                  <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>– {fmt(e.to)}</span>
                </>
              ) : null}
            </div>
            <span
              className="grid flex-none place-items-center rounded-lg"
              style={{
                width: 30,
                height: 30,
                color: e.color,
                background: `color-mix(in oklch, ${e.color} 15%, transparent)`,
              }}
            >
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold">
                {e.name} — {VACATION_KIND_LABELS[e.type]}
              </div>
              {e.note ? (
                <div className="truncate text-xs" style={{ color: "var(--text-faint)" }}>
                  {e.note}
                </div>
              ) : null}
            </div>
            {e.isMine ? (
              <span
                className="rounded-full text-[10.5px] font-semibold"
                style={{
                  padding: "3px 8px",
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                You
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
