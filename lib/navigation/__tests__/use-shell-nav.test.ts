// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ViewerRoles } from "@/lib/viewer/use-viewer-roles";
import type { DirectoryOrganization } from "@/lib/api/directory";

const member: ViewerRoles = {
  isLoading: false,
  isOrgAdmin: false,
  isOrgOwner: false,
  organization: null,
  isGroupAdmin: false,
  administeredGroups: [],
  isApprover: false,
  plan: null,
  attendanceActive: false,
};
const state = {
  pathname: "/dashboard/",
  supportAdmin: false,
  roles: member,
  attendanceActive: false,
  directoryOrganizations: undefined as DirectoryOrganization[] | undefined,
};

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/lib/support/use-support-admin", () => ({
  useSupportAdmin: () => ({ supportAdmin: state.supportAdmin, isPending: false }),
}));
vi.mock("@/lib/viewer/use-viewer-roles", () => ({ useViewerRoles: () => state.roles }));
vi.mock("@/lib/api/queries", () => ({
  useAttendanceState: () => ({ data: { active: state.attendanceActive } }),
  useDirectoryOrganizations: () => ({ data: state.directoryOrganizations }),
}));

import { useShellNav } from "../use-shell-nav";

const labels = (links: { label: string }[]) => links.map((link) => link.label);

describe("useShellNav", () => {
  beforeEach(() => {
    state.pathname = "/dashboard/";
    state.supportAdmin = false;
    state.roles = member;
    state.attendanceActive = false;
    state.directoryOrganizations = undefined;
  });

  it("adds the People section once a Directory organization answers", () => {
    state.directoryOrganizations = [
      {
        organizationId: "org-1",
        name: "Acme",
        role: "MEMBER",
        enabled: true,
        writable: true,
        newAgreementVersionReady: false,
      },
    ];
    const { result } = renderHook(() => useShellNav());

    expect(result.current.sections.map((section) => section.id)).toEqual(["timeOff", "people"]);
    expect(result.current.sections[1]!.links).toEqual([
      expect.objectContaining({ href: "/directory", label: "Directory" }),
    ]);
  });

  it("gives a member Time off, Settings and the dashboard as the active page", () => {
    const { result } = renderHook(() => useShellNav());

    expect(result.current.sections.map((section) => section.id)).toEqual(["timeOff"]);
    expect(labels(result.current.utility)).toEqual(["Settings"]);
    expect(result.current.active.section?.id).toBe("timeOff");
    expect(result.current.active.link?.href).toBe("/dashboard");
    expect(result.current.isActive("/dashboard")).toBe(true);
    expect(result.current.isActive("/requests")).toBe(false);
  });

  it("adds the Organization section for a group admin and Support for a support admin", () => {
    state.roles = { ...member, isGroupAdmin: true };
    state.supportAdmin = true;
    state.pathname = "/support/organization/";
    const { result } = renderHook(() => useShellNav());

    expect(result.current.sections.map((section) => section.id)).toEqual([
      "timeOff",
      "organization",
    ]);
    expect(labels(result.current.utility)).toEqual(["Settings", "Support"]);
    expect(result.current.active).toEqual({
      section: null,
      link: expect.objectContaining({ href: "/support" }),
    });
  });

  it("holds the admin section back while roles load", () => {
    state.roles = { ...member, isOrgAdmin: true, isLoading: true };
    const { result } = renderHook(() => useShellNav());

    expect(result.current.sections.map((section) => section.id)).toEqual(["timeOff"]);
  });

  it("adds the Attendance section once the viewer's own clock is live", () => {
    state.attendanceActive = true;

    const { result } = renderHook(() => useShellNav());

    const attendance = result.current.sections.find((section) => section.id === "attendance");
    expect(labels(attendance?.links ?? [])).toEqual(["My attendance"]);
  });
});
