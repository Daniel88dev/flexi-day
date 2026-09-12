"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { ClockSlot } from "@/components/attendance/clock-slot";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { ModeToggle } from "@/components/ui/ModeToggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  BOTTOM_BAR_CLOCK_INDEX,
  splitForBottomBar,
  type NavLink,
} from "@/lib/navigation/shell-links";
import { useShellNav } from "@/lib/navigation/use-shell-nav";
import { cn } from "@/lib/utils";

const tabClass =
  "flex flex-col items-center gap-1 pt-1.5 text-[11px] font-semibold transition-colors [&_svg]:size-[22px]";

function Tab({ link, isActive }: { link: NavLink; isActive: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={tabClass}
      style={{ color: isActive ? "var(--primary-strong)" : "var(--text-muted)" }}
    >
      <Icon />
      <span>{link.label}</span>
    </Link>
  );
}

function SheetLink({
  link,
  isActive,
  onNavigate,
}: {
  link: NavLink;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-semibold transition-colors"
      style={{
        background: isActive ? "var(--primary-soft)" : "transparent",
        color: isActive ? "var(--primary-strong)" : "var(--text-muted)",
      }}
    >
      <Icon className="size-[18px]" />
      {link.label}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="px-3 pt-3 pb-1.5 text-[11px] font-bold tracking-[0.08em] uppercase"
      style={{ color: "var(--text-faint)" }}
    >
      {children}
    </div>
  );
}

/**
 * Mobile navigation: at most five slots, the centre one held for the clock
 * widget, and the rest of the links behind More in a bottom sheet. Hidden by
 * CSS from `md` up rather than by `useIsMobile`, so a phone never sees it pop
 * in after hydration.
 */
export function BottomBar() {
  const { t } = useTranslation();
  const { sections, utility, isActive } = useShellNav();
  const [moreOpen, setMoreOpen] = useState(false);

  const { bar, sheet } = splitForBottomBar(sections);
  const slots: (NavLink | null)[] = [...bar];
  slots.splice(BOTTOM_BAR_CLOCK_INDEX, 0, null);
  const close = () => setMoreOpen(false);

  return (
    <>
      <nav
        aria-label={t.nav.menu}
        className="fixed inset-x-0 bottom-0 z-30 grid h-[72px] grid-cols-5 border-t px-1.5 pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(14px)",
          borderColor: "var(--border)",
        }}
      >
        {slots.map((link, index) =>
          link ? (
            <Tab key={link.href} link={link} isActive={isActive(link.href)} />
          ) : (
            <ClockSlot key={`slot-${index}`} />
          )
        )}
        <button
          type="button"
          aria-label={t.nav.more}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
          className={cn(tabClass, "cursor-pointer")}
          style={{ color: moreOpen ? "var(--primary-strong)" : "var(--text-muted)" }}
        >
          <Menu />
          <span>{t.nav.more}</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-t-[28px] border-t-0 px-3 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)]"
          style={{ background: "var(--surface)" }}
        >
          <div
            aria-hidden
            className="mx-auto mb-3 h-1 w-9 rounded-full"
            style={{ background: "var(--border-strong)" }}
          />
          <SheetHeader className="sr-only">
            <SheetTitle>{t.nav.menu}</SheetTitle>
            <SheetDescription>{t.nav.more}</SheetDescription>
          </SheetHeader>

          <nav aria-label={t.nav.more} className="flex flex-col">
            {sheet.map((section) => (
              <div key={section.id} className="flex flex-col gap-0.5">
                <SectionLabel>{section.label}</SectionLabel>
                {section.links.map((link) => (
                  <SheetLink
                    key={link.href}
                    link={link}
                    isActive={isActive(link.href)}
                    onNavigate={close}
                  />
                ))}
              </div>
            ))}
            <div className="my-2.5 h-px" style={{ background: "var(--border)" }} />
            {utility.map((link) => (
              <SheetLink
                key={link.href}
                link={link}
                isActive={isActive(link.href)}
                onNavigate={close}
              />
            ))}
          </nav>

          <div
            className="mt-3 flex items-center gap-3 border-t pt-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex-1">
              <NewRequestDialog />
            </div>
            <ModeToggle />
            <LocaleToggle />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
