"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "ok" | "danger" | "warm";
export type ToastAction = { label: string; href: string };
type Toast = { id: number; msg: string; kind: ToastKind; action?: ToastAction };

let toastSeq = 0;
const listeners = new Set<(t: Toast) => void>();

/**
 * Fire a transient toast from anywhere in the app. `ToastHost` is mounted once
 * in the app layout, so callers never mount their own.
 *
 * Delivery is synchronous to whoever is subscribed at that instant, so a caller
 * pushing from a mount effect needs the host to have subscribed first — which
 * is why the layout mounts `ToastHost` above `{children}`.
 */
export function pushToast(
  msg: string,
  kind: ToastKind = "ok",
  options: { action?: ToastAction } = {}
) {
  const t: Toast = { id: ++toastSeq, msg, kind, action: options.action };
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
    const fn = (t: Toast) => setItems((prev) => [...prev, t]);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-6 bottom-6 z-[200] flex flex-col items-end gap-2.5 max-[520px]:right-4 max-[520px]:left-4 max-[520px]:items-stretch"
      aria-live="polite"
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onExpire={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onExpire }: { toast: Toast; onExpire: (id: number) => void }) {
  useEffect(() => {
    // Long enough to be noticed away from the pointer — a save confirmation
    // is the whole reason the toast exists.
    // A toast with a link stays longer, so there is time to reach it.
    const timer = setTimeout(() => onExpire(toast.id), toast.action ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.action, onExpire]);

  const c =
    toast.kind === "danger" ? "var(--danger)" : toast.kind === "warm" ? "var(--warm)" : "var(--ok)";
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold",
        toast.action && "pointer-events-auto"
      )}
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
        {toast.kind === "danger" ? <TriangleAlert size={13} /> : <Check size={13} />}
      </span>
      {toast.msg}
      {toast.action ? (
        <Link
          href={toast.action.href}
          onClick={() => onExpire(toast.id)}
          className="underline underline-offset-2"
          style={{ color: "var(--primary-strong)" }}
        >
          {toast.action.label}
        </Link>
      ) : null}
    </div>
  );
}
