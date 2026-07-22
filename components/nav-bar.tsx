"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutGrid, Menu, RefreshCw, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { NotificationsBell } from "@/components/notifications-bell";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { UserMenu } from "@/components/user-menu";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/requests", label: "Requests", icon: Calendar },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/calendar-sync", label: "Calendar sync", icon: RefreshCw },
];

function isLinkActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function NavBar() {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-[66px] max-w-[1340px] items-center gap-7 px-7 max-[820px]:gap-3 max-[820px]:px-4">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((o) => !o)}
          className="grid h-10 w-10 flex-none place-items-center rounded-[11px] border min-[821px]:hidden"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Logo size={25} href="/dashboard" />

        <nav className="ml-2 flex items-center gap-7 max-[820px]:hidden">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-2 text-[15px] font-semibold transition-colors",
                  isActive
                    ? "text-[color:var(--text)]"
                    : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                )}
              >
                {link.label}
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute right-0 -bottom-[19px] left-0 h-[2.5px] rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="max-[820px]:hidden">
            <NotificationsBell />
          </div>
          <ModeToggle />
          <UserMenu />
          <div className="max-[820px]:hidden">
            <NewRequestDialog />
          </div>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      <div
        className="overflow-hidden min-[821px]:hidden"
        style={{
          maxHeight: navOpen ? 360 : 0,
          borderTop: navOpen ? "1px solid var(--border)" : "none",
          transition: "max-height .28s ease",
        }}
      >
        <nav className="flex flex-col gap-1 p-3">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-3 text-base font-semibold transition-colors"
                style={{
                  background: isActive ? "var(--primary-soft)" : "transparent",
                  color: isActive ? "var(--primary-strong)" : "var(--text-muted)",
                }}
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
                {isActive ? (
                  <span
                    aria-hidden
                    className="ml-auto h-[7px] w-[7px] rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div
          className="flex items-center gap-3 border-t px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="flex-1">
            <NewRequestDialog />
          </div>
          <NotificationsBell />
        </div>
      </div>
    </header>
  );
}
