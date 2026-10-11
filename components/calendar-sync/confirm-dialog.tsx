"use client";

import type { ReactNode } from "react";
import { RefreshCw, Trash2, Unlink } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

export type ConfirmKind = "delete" | "regen" | "disconnect";

/**
 * `name` is the calendar's name, or the provider's for `disconnect`, where `syncedCount` is how
 * many of the user's calendars that one provider connection writes to.
 */
export function ConfirmDialog({
  kind,
  name,
  syncedCount = 1,
  busy,
  onClose,
  onConfirm,
}: {
  kind: ConfirmKind;
  name: string;
  syncedCount?: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const danger = kind !== "regen";
  const copy: Record<ConfirmKind, { icon: ReactNode; title: string; body: string; cta: string }> = {
    delete: {
      icon: <Trash2 size={22} />,
      title: t.calSync.confirm.deleteTitle,
      body: t.calSync.confirm.deleteBody(name),
      cta: t.calSync.confirm.delete,
    },
    regen: {
      icon: <RefreshCw size={22} />,
      title: t.calSync.confirm.regenTitle,
      body: t.calSync.confirm.regenBody,
      cta: t.calSync.confirm.regenerate,
    },
    disconnect: {
      icon: <Unlink size={22} />,
      title: t.calSync.connect.disconnectTitle(name),
      body:
        syncedCount > 1
          ? t.calSync.connect.disconnectBodyMany(syncedCount, name)
          : t.calSync.connect.disconnectBody,
      cta: t.calSync.connect.disconnect,
    },
  };
  const { icon, title, body, cta } = copy[kind];
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
            color: danger ? "var(--danger)" : "var(--warm)",
            background: danger ? "var(--danger-soft)" : "var(--warm-soft)",
          }}
        >
          {icon}
        </span>
        <h3 className="mb-2 text-xl">{title}</h3>
        <p className="mb-5 text-[14.5px]" style={{ color: "var(--text-muted)" }}>
          {body}
        </p>
        <div className="flex justify-end gap-2.5">
          <button type="button" className="cs-btn cs-btn-ghost" onClick={onClose} disabled={busy}>
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="cs-btn cs-btn-primary"
            onClick={onConfirm}
            disabled={busy}
            style={danger ? { background: "var(--danger)" } : undefined}
          >
            {busy ? t.calSync.confirm.working : cta}
          </button>
        </div>
      </div>
    </div>
  );
}
