"use client";

import { Logo } from "@/components/brand/logo";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { NotificationsBell } from "@/components/notifications-bell";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { UserMenu } from "@/components/user-menu";
import { useShellNav } from "@/lib/navigation/use-shell-nav";

export function TopBar() {
  const { active } = useShellNav();

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex h-[60px] items-center gap-2.5 px-6 max-md:h-14 max-md:px-4">
        <div className="md:hidden">
          <Logo size={25} href="/dashboard" />
        </div>

        {active.link ? (
          <nav aria-label="Breadcrumb" className="max-md:hidden">
            <ol className="flex items-center gap-2 text-[15px] font-semibold">
              {active.section ? (
                <>
                  <li style={{ color: "var(--text-muted)" }}>{active.section.label}</li>
                  <li aria-hidden style={{ color: "var(--text-faint)" }}>
                    /
                  </li>
                </>
              ) : null}
              <li aria-current="page">{active.link.label}</li>
            </ol>
          </nav>
        ) : null}

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <div className="max-md:hidden">
            <NewRequestDialog />
          </div>
          <NotificationsBell />
          <div className="max-md:hidden">
            <ModeToggle />
          </div>
          <div className="max-md:hidden">
            <LocaleToggle />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
