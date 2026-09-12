"use client";

import { usePathname } from "next/navigation";
import { useAttendanceState } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useSupportAdmin } from "@/lib/support/use-support-admin";
import { useViewerRoles } from "@/lib/viewer/use-viewer-roles";
import {
  buildSections,
  buildUtilityLinks,
  findActive,
  isLinkActive,
  type ActiveNav,
  type NavLink,
  type NavSection,
} from "./shell-links";

export type ShellNav = {
  sections: NavSection[];
  utility: NavLink[];
  active: ActiveNav;
  isActive: (href: string) => boolean;
};

/** The sections, footer links and active page for whichever part of the shell asks. */
export function useShellNav(): ShellNav {
  const pathname = usePathname();
  const { t } = useTranslation();
  const roles = useViewerRoles();
  const { supportAdmin } = useSupportAdmin();
  const attendance = useAttendanceState();

  const access = {
    rolesLoading: roles.isLoading,
    administersSomething: roles.isOrgAdmin || roles.isGroupAdmin,
    supportAdmin,
    attendanceActive: attendance.data?.active ?? false,
  };
  const sections = buildSections(t, access);
  const utility = buildUtilityLinks(t, access);

  return {
    sections,
    utility,
    active: findActive(sections, utility, pathname),
    isActive: (href) => isLinkActive(pathname, href),
  };
}
