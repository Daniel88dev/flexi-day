"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  CircleCheckBig,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import { maskFeedUrl } from "@/lib/calendar-sync/meta";
import { AppleMark, GoogleMark, MicrosoftMark } from "./service-marks";
import { copyText, pushToast } from "./toast";

function ProviderRow({
  mark,
  name,
  href,
  steps,
}: {
  mark: ReactNode;
  name: string;
  href: string;
  steps: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3" style={{ padding: "12px 14px" }}>
        <span className="grid flex-none place-items-center">{mark}</span>
        <span className="flex-1 text-[14.5px] font-semibold">{name}</span>
        <button
          type="button"
          className="cs-btn cs-btn-soft cs-btn-sm"
          onClick={() => setOpen((o) => !o)}
        >
          How
        </button>
        <a
          className="cs-btn cs-btn-primary cs-btn-sm"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => pushToast(`Opening ${name}…`)}
        >
          Add
          <ExternalLink size={14} />
        </a>
      </div>
      {open ? (
        <ol
          className="text-[13px] leading-relaxed"
          style={{
            margin: 0,
            padding: "4px 16px 14px 34px",
            color: "var(--text-muted)",
            background: "var(--surface-2)",
          }}
        >
          {steps.map((s, i) => (
            <li key={i} style={{ marginTop: 4 }}>
              {s}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function SubscribePanel({
  name,
  feedUrl,
  onBack,
  onClose,
}: {
  name: string;
  feedUrl: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  const enc = encodeURIComponent(feedUrl);
  const google = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${enc}`;
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${enc}&name=${encodeURIComponent(
    name || "Flexi-Day"
  )}`;

  return (
    <div
      className="mx-auto"
      style={{ padding: "30px 34px 34px", maxWidth: 620, animation: "fx-fade .3s ease" }}
    >
      <div className="mb-6 text-center">
        <span
          className="mb-3.5 inline-grid place-items-center rounded-2xl"
          style={{ width: 54, height: 54, color: "var(--ok)", background: "var(--ok-soft)" }}
        >
          <CircleCheckBig size={30} />
        </span>
        <h2 className="mb-1.5 text-[26px]">“{name || "Your calendar"}” is ready</h2>
        <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
          Add the link to your calendar app once. New time off shows up on its own — no re-importing.
        </p>
      </div>

      <div className="cs-label flex items-center gap-1.5">
        <LinkIcon size={14} />
        Your private subscription link
      </div>
      <div
        className="flex items-center gap-2 rounded-xl"
        style={{
          padding: "8px 8px 8px 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <span
          className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}
        >
          {revealed ? feedUrl : maskFeedUrl(feedUrl)}
        </span>
        <button
          type="button"
          className="cs-btn cs-btn-soft cs-btn-sm"
          style={{ padding: "8px 10px" }}
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? "Hide link" : "Reveal link"}
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button
          type="button"
          className="cs-btn cs-btn-primary cs-btn-sm"
          style={{ padding: "8px 13px" }}
          onClick={() => {
            copyText(feedUrl);
            pushToast("Link copied to clipboard");
          }}
        >
          <Copy size={15} />
          Copy
        </button>
      </div>
      <p
        className="mt-2.5 flex items-start gap-2 text-xs"
        style={{ color: "var(--warm)" }}
      >
        <ShieldCheck size={15} style={{ flex: "none", marginTop: 1 }} />
        Treat this like a password. Anyone with the link can see every record in the feed. Regenerate
        it any time to revoke access.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <ProviderRow
          mark={<GoogleMark size={22} />}
          name="Google Calendar"
          href={google}
          steps={[
            "Click Add — Google opens “Add calendar from URL”.",
            "The link is filled in for you. Click “Add calendar”.",
            "Find it under “Other calendars”. Updates arrive automatically.",
          ]}
        />
        <ProviderRow
          mark={<MicrosoftMark size={22} />}
          name="Outlook / Microsoft 365"
          href={outlook}
          steps={[
            "Click Add — Outlook opens “Subscribe from web”.",
            "Give it a name and click Import.",
            "It appears in your calendar list and refreshes on its own.",
          ]}
        />
        <ProviderRow
          mark={<AppleMark size={20} />}
          name="Apple Calendar"
          href={webcal}
          steps={[
            "Click Add on your Mac or iPhone.",
            "Calendar asks to subscribe — confirm.",
            "Choose how often it refreshes, then Done.",
          ]}
        />
      </div>

      <div
        className="mt-4 flex gap-3 rounded-xl"
        style={{
          padding: "13px 15px",
          background: "var(--warm-soft)",
          border: "1px solid color-mix(in oklch, var(--warm) 28%, transparent)",
        }}
      >
        <Clock size={17} style={{ color: "var(--warm)", flex: "none", marginTop: 1 }} />
        <p
          className="text-xs leading-relaxed"
          style={{ color: "color-mix(in oklch, var(--warm) 62%, var(--text))" }}
        >
          <b>Updates aren&apos;t instant.</b> Your calendar app decides how often it checks this link
          — often just once a day, and the timing isn&apos;t guaranteed. For last-minute changes,
          check Flexi-Day directly.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2.5">
        <button type="button" className="cs-btn cs-btn-ghost" onClick={onBack}>
          <ChevronLeft size={16} />
          Back to settings
        </button>
        <button type="button" className="cs-btn cs-btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
