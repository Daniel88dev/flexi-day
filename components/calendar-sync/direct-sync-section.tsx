"use client";

import { useState, type ReactNode } from "react";
import { Info, Lock, RefreshCw, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { GoogleMark, MicrosoftMark } from "./service-marks";

function LockedProvider({
  mark,
  label,
  active,
  onEnter,
  onLeave,
}: {
  mark: ReactNode;
  label: string;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="relative"
      style={{ flex: "1 1 200px" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        disabled
        className="cs-btn cs-btn-ghost cs-btn-block"
        style={{ padding: "14px 18px", justifyContent: "flex-start", gap: 11 }}
      >
        <span className="grid place-items-center" style={{ filter: "grayscale(1)", opacity: 0.8 }}>
          {mark}
        </span>
        <span className="flex-1 text-left">{t.calSync.direct.connect(label)}</span>
        <Lock size={15} style={{ color: "var(--text-faint)" }} />
      </button>
      {active ? (
        <div
          role="tooltip"
          className="absolute z-[5] rounded-lg text-xs leading-snug font-medium"
          style={{
            bottom: "calc(100% + 8px)",
            left: 0,
            right: 0,
            padding: "8px 12px",
            background: "var(--text)",
            color: "var(--bg)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {t.calSync.direct.tooltip}
        </div>
      ) : null}
    </div>
  );
}

export function DirectSyncSection() {
  const { t } = useTranslation();
  const [tip, setTip] = useState<string | null>(null);
  return (
    <div
      className="cs-card relative mt-6 overflow-hidden"
      style={{ padding: 26, background: "var(--bg-tint)" }}
    >
      <div className="mb-5 flex flex-wrap items-start gap-3.5">
        <span
          className="grid flex-none place-items-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            color: "var(--text-muted)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw size={22} />
        </span>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg">{t.calSync.direct.title}</h3>
            <span
              className="cs-chip"
              style={{
                color: "var(--warm)",
                background: "var(--warm-soft)",
                borderColor: "transparent",
              }}
            >
              <Sparkles size={13} />
              {t.calSync.direct.comingSoon}
            </span>
          </div>
          <p className="mt-1.5 text-[14.5px]" style={{ color: "var(--text-muted)", maxWidth: 560 }}>
            {t.calSync.direct.body}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <LockedProvider
          mark={<GoogleMark size={20} />}
          label="Google"
          active={tip === "g"}
          onEnter={() => setTip("g")}
          onLeave={() => setTip(null)}
        />
        <LockedProvider
          mark={<MicrosoftMark size={20} />}
          label="Microsoft"
          active={tip === "m"}
          onEnter={() => setTip("m")}
          onLeave={() => setTip(null)}
        />
      </div>
      <p
        className="mt-3.5 flex items-center gap-1.5 text-xs"
        style={{ color: "var(--text-faint)" }}
      >
        <Info size={14} /> {t.calSync.direct.emailNotice}
      </p>
    </div>
  );
}
