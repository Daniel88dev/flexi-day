import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  LayoutGrid,
  LifeBuoy,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export type NavLink = { href: string; label: string; icon: LucideIcon };

export type NavSectionId = "timeOff" | "attendance" | "organization";

export type NavSection = { id: NavSectionId; label: string; links: NavLink[] };

export type ShellAccess = {
  /** While `useViewerRoles` is still answering, nothing admin-shaped may render. */
  rolesLoading: boolean;
  /** Org admin (owner or delegate) or group admin. */
  administersSomething: boolean;
  supportAdmin: boolean;
};

export const BOTTOM_BAR_CLOCK_INDEX = 2;

export type ActiveNav = { section: NavSection | null; link: NavLink | null };

/**
 * Exact match for the dashboard, prefix match for everything else. The app
 * exports with trailing slashes, so `usePathname` reports `/dashboard/`; the
 * slash is dropped before comparing.
 */
export function isLinkActive(pathname: string, href: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return path === href || (href !== "/dashboard" && path.startsWith(href));
}

/**
 * The sidebar's sections in mockup order. A section is returned only when it
 * has at least one link, so Attendance stays out until its screens exist and
 * Organization stays out for a plain member.
 */
export function buildSections(t: Dictionary, access: ShellAccess): NavSection[] {
  const admin = !access.rolesLoading && access.administersSomething;
  const sections: NavSection[] = [
    {
      id: "timeOff",
      label: t.nav.sections.timeOff,
      links: [
        { href: "/dashboard", label: t.nav.dashboard, icon: LayoutGrid },
        { href: "/requests", label: t.nav.requests, icon: Calendar },
        { href: "/report", label: t.nav.report, icon: BarChart3 },
        { href: "/groups", label: t.nav.groups, icon: Users },
        { href: "/calendar-sync", label: t.nav.calendarSync, icon: RefreshCw },
      ],
    },
    // The attendance screens land in later tickets; until then the section has
    // no links and therefore does not render.
    { id: "attendance", label: t.nav.sections.attendance, links: [] },
    {
      id: "organization",
      label: t.nav.sections.organization,
      links: admin
        ? [
            { href: "/organization", label: t.nav.organization, icon: Building2 },
            { href: "/billing", label: t.nav.billing, icon: CreditCard },
          ]
        : [],
    },
  ];
  return sections.filter((section) => section.links.length > 0);
}

/** The links below the sections: the viewer's own settings, and Support for a support admin. */
export function buildUtilityLinks(t: Dictionary, access: ShellAccess): NavLink[] {
  return [
    { href: "/settings", label: t.nav.settings, icon: Settings },
    ...(access.supportAdmin ? [{ href: "/support", label: t.nav.support, icon: LifeBuoy }] : []),
  ];
}

/**
 * Which links sit on the bottom bar and which go behind More. The bar takes
 * the first two Time off links, then the first Attendance link when there is
 * one, else the next Time off link; everything else stays in its section for
 * the sheet.
 */
export function splitForBottomBar(sections: NavSection[]): {
  bar: NavLink[];
  sheet: NavSection[];
} {
  const timeOff = sections.find((section) => section.id === "timeOff")?.links ?? [];
  const attendance = sections.find((section) => section.id === "attendance")?.links ?? [];
  const bar = timeOff.slice(0, 2);
  const third = attendance[0] ?? timeOff[2];
  if (third) bar.push(third);
  const onBar = new Set(bar.map((link) => link.href));
  const sheet = sections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => !onBar.has(link.href)),
    }))
    .filter((section) => section.links.length > 0);
  return { bar, sheet };
}

/** The section and link the current path belongs to, for the top bar's breadcrumb. */
export function findActive(
  sections: NavSection[],
  utility: NavLink[],
  pathname: string
): ActiveNav {
  for (const section of sections) {
    const link = section.links.find((candidate) => isLinkActive(pathname, candidate.href));
    if (link) return { section, link };
  }
  const link = utility.find((candidate) => isLinkActive(pathname, candidate.href)) ?? null;
  return { section: null, link };
}
