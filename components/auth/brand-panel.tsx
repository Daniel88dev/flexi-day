"use client";

import { Quote } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { demoById } from "@/lib/demo/team";

const QUOTES = {
  signup:
    "Set up your whole team in under five minutes — and never chase a time-off request again.",
  signin: "The calmest part of our week is knowing exactly who's in and who's away.",
};

const STATS: Array<[string, string]> = [
  ["2,400+", "teams"],
  ["180k", "days off booked"],
  ["4.9/5", "avg rating"],
];

export function BrandPanel() {
  const pathname = usePathname();
  const mode: keyof typeof QUOTES = pathname.includes("sign-up") ? "signup" : "signin";
  const p = demoById("pn")!;
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden p-11 md:flex"
      style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 10%, oklch(1 0 0 / .16), transparent 42%), radial-gradient(circle at 10% 95%, oklch(0 0 0 / .16), transparent 45%)",
        }}
      />
      <div className="relative">
        <Logo size={26} invert href={null} />
      </div>

      <div className="relative">
        <Quote className="mb-4 h-10 w-10 opacity-60" />
        <p
          className="font-display mb-6 font-medium"
          style={{
            fontSize: 27,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {QUOTES[mode]}
        </p>
        <div className="flex items-center gap-3">
          <AvatarBubble initials={p.initials} background={p.av} size={44} name={p.name} />
          <div>
            <div className="text-[15px] font-semibold">{p.name}</div>
            <div className="text-[13.5px] opacity-85">People Ops · Northwind</div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-6">
        {STATS.map(([a, b]) => (
          <div key={b}>
            <div className="font-display text-[24px] font-bold">{a}</div>
            <div className="text-[13px] opacity-80">{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
