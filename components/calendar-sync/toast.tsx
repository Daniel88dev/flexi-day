"use client";

import { useEffect, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";

export type ToastKind = "ok" | "danger" | "warm";
type Toast = { id: number; msg: string; kind: ToastKind };

let toastSeq = 0;
const listeners = new Set<(t: Toast) => void>();

/** Fire a transient toast from anywhere in the calendar-sync feature. */
export function pushToast(msg: string, kind: ToastKind = "ok") {
  const t: Toast = { id: ++toastSeq, msg, kind };
  listeners.forEach((fn) => fn(t));
}

/** Copy text to the clipboard, with a legacy fallback for non-secure contexts. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta);
  }
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const fn = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 2600);
    };
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2.5"
      aria-live="polite"
    >
      {items.map((t) => {
        const c =
          t.kind === "danger" ? "var(--danger)" : t.kind === "warm" ? "var(--warm)" : "var(--ok)";
        return (
          <div
            key={t.id}
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              animation: "fx-toast .3s ease",
            }}
          >
            <span
              className="grid h-5 w-5 place-items-center rounded-full"
              style={{ color: c, background: `color-mix(in oklch, ${c} 16%, transparent)` }}
            >
              {t.kind === "danger" ? <TriangleAlert size={13} /> : <Check size={13} />}
            </span>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
