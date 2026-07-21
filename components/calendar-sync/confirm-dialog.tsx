"use client";

import { RefreshCw, Trash2 } from "lucide-react";

export type ConfirmKind = "delete" | "regen";

export function ConfirmDialog({
  kind,
  name,
  busy,
  onClose,
  onConfirm,
}: {
  kind: ConfirmKind;
  name: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const del = kind === "delete";
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] grid place-items-center p-5"
      style={{
        background: "oklch(0.2 0.02 288 / 0.5)",
        backdropFilter: "blur(4px)",
        animation: "fx-fade .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="cs-card"
        style={{
          width: "min(420px, 100%)",
          padding: 26,
          boxShadow: "var(--shadow-lg)",
          animation: "fx-pop .25s ease",
        }}
      >
        <span
          className="mb-4 grid place-items-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            color: del ? "var(--danger)" : "var(--warm)",
            background: del ? "var(--danger-soft)" : "var(--warm-soft)",
          }}
        >
          {del ? <Trash2 size={22} /> : <RefreshCw size={22} />}
        </span>
        <h3 className="mb-2 text-xl">
          {del ? "Delete this calendar?" : "Regenerate the token?"}
        </h3>
        <p className="mb-5 text-[14.5px]" style={{ color: "var(--text-muted)" }}>
          {del ? (
            <>“{name}” will stop updating for anyone subscribed. This can&apos;t be undone.</>
          ) : (
            <>
              The current link stops working immediately. Anyone subscribed will need the new link to
              keep seeing updates.
            </>
          )}
        </p>
        <div className="flex justify-end gap-2.5">
          <button type="button" className="cs-btn cs-btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="cs-btn cs-btn-primary"
            onClick={onConfirm}
            disabled={busy}
            style={del ? { background: "var(--danger)" } : undefined}
          >
            {busy ? "Working…" : del ? "Delete" : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}
