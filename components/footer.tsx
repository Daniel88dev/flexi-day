import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
] as const;

interface FooterProps {
  /** Compact links-only footer, used on the auth screens. */
  minimal?: boolean;
  /** Override the inner container width so the footer aligns with the page content above it. */
  containerClassName?: string;
}

export function Footer({ minimal = false, containerClassName }: FooterProps) {
  const year = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="mt-10 flex flex-col items-center gap-3 text-center">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] transition-colors hover:text-[color:var(--text)]"
              style={{ color: "var(--text-faint)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          © {year} flexiday
        </span>
      </footer>
    );
  }

  return (
    <footer style={{ borderTop: "1px solid var(--border)" }}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-7 py-10 max-[640px]:flex-col max-[640px]:text-center",
          containerClassName
        )}
      >
        <Logo size={24} />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14px] transition-colors hover:text-[color:var(--text)]"
              style={{ color: "var(--text-faint)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-[13.5px]" style={{ color: "var(--text-faint)" }}>
          © {year} flexiday. Rest well.
        </span>
      </div>
    </footer>
  );
}
