"use client";

import { Quote } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useTranslation } from "@/lib/i18n/use-translation";

export function BrandPanel() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const mode: "signup" | "signin" = pathname.includes("sign-up") ? "signup" : "signin";
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
          {t.auth.brand[mode]}
        </p>
      </div>

      <div className="relative flex flex-wrap gap-6"></div>
    </div>
  );
}
