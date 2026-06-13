"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { UserMenu } from "@/components/user-menu";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests", label: "Requests" },
  { href: "/groups", label: "Groups" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-[66px] max-w-[1340px] items-center gap-7 px-7">
        <Logo size={25} href="/dashboard" />
        <nav className="ml-2 flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
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
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full border"
            style={{
              borderColor: "var(--border-strong)",
              background: "var(--surface)",
              color: "var(--text-muted)",
            }}
          >
            <Bell className="h-[18px] w-[18px]" />
            <span
              className="absolute top-[9px] right-[10px] h-[7px] w-[7px] rounded-full"
              style={{
                background: "var(--warm)",
                boxShadow: "0 0 0 2px var(--surface)",
              }}
            />
          </button>
          <ModeToggle />
          <UserMenu />
          <NewRequestDialog />
        </div>
      </div>
    </header>
  );
}
