"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { PALETTE, type SwatchKey } from "@/lib/calendar-sync/meta";

/** A compact popover for picking one of the shared palette swatches. */
export function SwatchPicker({
  value,
  onChange,
  label,
}: {
  value: SwatchKey;
  onChange: (key: SwatchKey) => void;
  label: string;
}) {
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

  const cur = PALETTE.find((p) => p.key === value) ?? PALETTE[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${label}: ${cur.name}`}
        title={`${label}: ${cur.name}`}
        className="flex items-center gap-1.5 rounded-full"
        style={{
          padding: "4px 8px 4px 5px",
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
        }}
      >
        <span
          className="rounded-full"
          style={{
            width: 18,
            height: 18,
            background: cur.css,
            boxShadow: "inset 0 0 0 1px oklch(0 0 0 / .12)",
          }}
        />
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {cur.name}
        </span>
        <ChevronDown size={13} style={{ color: "var(--text-faint)" }} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-9 z-40 rounded-2xl p-2.5"
          style={{
            width: 172,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {PALETTE.map((p) => {
              const on = p.key === value;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    onChange(p.key);
                    setOpen(false);
                  }}
                  title={p.name}
                  aria-label={p.name}
                  className="grid place-items-center rounded-full"
                  style={{
                    width: 26,
                    height: 26,
                    background: p.css,
                    boxShadow: on
                      ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)"
                      : "inset 0 0 0 1px oklch(0 0 0 / .12)",
                  }}
                >
                  {on ? <Check size={14} style={{ color: "#fff" }} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
