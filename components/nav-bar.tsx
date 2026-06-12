"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { UserMenu } from "@/components/user-menu";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/requests", label: "Requests" },
];

function FlexiDayLogo() {
  return (
    <Link
      href="/"
      className="group focus-visible:ring-primary/50 flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2"
    >
      {/* Sun mark */}
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0 transition-transform duration-300 group-hover:rotate-45"
        aria-hidden="true"
      >
        {/* Core circle */}
        <circle cx="15" cy="15" r="6" fill="currentColor" />
        {/* Cardinal rays — rounded rectangles */}
        <rect x="13.5" y="1" width="3" height="6" rx="1.5" fill="currentColor" />
        <rect x="13.5" y="23" width="3" height="6" rx="1.5" fill="currentColor" />
        <rect x="1" y="13.5" width="6" height="3" rx="1.5" fill="currentColor" />
        <rect x="23" y="13.5" width="6" height="3" rx="1.5" fill="currentColor" />
        {/* Diagonal rays — shorter, lower opacity */}
        <rect
          x="5.5"
          y="4"
          width="3"
          height="5.5"
          rx="1.5"
          fill="currentColor"
          opacity="0.45"
          transform="rotate(-45 5.5 4)"
        />
        <rect
          x="21.5"
          y="4"
          width="3"
          height="5.5"
          rx="1.5"
          fill="currentColor"
          opacity="0.45"
          transform="rotate(45 21.5 4)"
        />
        <rect
          x="5.5"
          y="20.5"
          width="3"
          height="5.5"
          rx="1.5"
          fill="currentColor"
          opacity="0.45"
          transform="rotate(45 5.5 20.5)"
        />
        <rect
          x="21.5"
          y="20.5"
          width="3"
          height="5.5"
          rx="1.5"
          fill="currentColor"
          opacity="0.45"
          transform="rotate(-45 21.5 20.5)"
        />
      </svg>

      {/* Wordmark */}
      <span className="text-[15px] leading-none tracking-tight select-none">
        <span className="text-foreground/70 font-medium">flexi</span>
        <span className="text-foreground font-bold">day</span>
      </span>
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <header
      className="border-border/60 sticky top-0 z-50 border-b"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(16px) saturate(180%)" }}
    >
      <div className="container mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-6 px-4">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <FlexiDayLogo />

          <nav className="flex items-center">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="bg-primary absolute right-3 -bottom-[17px] left-3 h-[2px] rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <ModeToggle />
          <UserMenu />
          <div className="bg-border ml-1.5 h-5 w-px" aria-hidden="true" />
          <NewRequestDialog />
        </div>
      </div>
    </header>
  );
}
