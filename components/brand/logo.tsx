import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  href?: string | null;
  className?: string;
  invert?: boolean;
}

export function Logo({
  size = 26,
  withWordmark = true,
  href = "/",
  className,
  invert = false,
}: LogoProps) {
  const wordmark = (
    <span
      className="font-display font-bold tracking-tight"
      style={{ fontSize: size * 0.74, letterSpacing: "-0.03em" }}
    >
      flexi
      <span style={{ color: invert ? "var(--primary-fg)" : "var(--primary)" }}>day</span>
    </span>
  );

  const mark = (
    <span
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: invert ? "var(--primary-fg)" : "var(--primary)",
          opacity: 0.18,
        }}
      />
      <span
        className="rounded-full"
        style={{
          width: size * 0.52,
          height: size * 0.52,
          background: invert ? "var(--primary-fg)" : "var(--primary)",
          boxShadow: invert
            ? "0 0 0 3px var(--primary), 0 0 0 4.5px var(--primary-fg)"
            : "0 0 0 3px var(--bg), 0 0 0 4.5px var(--primary)",
        }}
      />
    </span>
  );

  const content = (
    <span
      className={cn("flex items-center gap-2.5 select-none", className)}
      style={{ color: invert ? "var(--primary-fg)" : "var(--text)" }}
    >
      {mark}
      {withWordmark ? wordmark : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className="focus-visible:ring-primary/40 rounded-lg outline-none focus-visible:ring-2"
    >
      {content}
    </Link>
  );
}
