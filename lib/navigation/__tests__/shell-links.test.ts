import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import {
  BOTTOM_BAR_CLOCK_INDEX,
  buildSections,
  buildUtilityLinks,
  findActive,
  isLinkActive,
  splitForBottomBar,
  type ShellAccess,
} from "../shell-links";

const member: ShellAccess = {
  rolesLoading: false,
  administersSomething: false,
  supportAdmin: false,
  attendanceActive: false,
};
const admin: ShellAccess = { ...member, administersSomething: true };
const loading: ShellAccess = { ...admin, rolesLoading: true };
const clocking: ShellAccess = { ...member, attendanceActive: true };

const labels = (links: { label: string }[]) => links.map((link) => link.label);

describe("isLinkActive", () => {
  it("matches the exact path", () => {
    expect(isLinkActive("/dashboard", "/dashboard")).toBe(true);
    expect(isLinkActive("/requests", "/requests")).toBe(true);
  });

  it("matches nested paths except under the dashboard", () => {
    expect(isLinkActive("/groups/detail", "/groups")).toBe(true);
    expect(isLinkActive("/dashboard/anything", "/dashboard")).toBe(false);
  });

  it("does not match unrelated paths", () => {
    expect(isLinkActive("/report", "/requests")).toBe(false);
  });

  it("ignores the trailing slash the static export adds", () => {
    expect(isLinkActive("/dashboard/", "/dashboard")).toBe(true);
    expect(isLinkActive("/groups/", "/groups")).toBe(true);
    expect(isLinkActive("/dashboard/x/", "/dashboard")).toBe(false);
  });
});

describe("buildSections", () => {
  it("returns Time off and Organization for an admin, in mockup order", () => {
    const sections = buildSections(en, admin);

    expect(sections.map((section) => section.id)).toEqual(["timeOff", "organization"]);
    expect(labels(sections[0]!.links)).toEqual([
      "Dashboard",
      "Requests",
      "Report",
      "Groups",
      "Calendar sync",
    ]);
    expect(labels(sections[1]!.links)).toEqual(["Organization", "Billing"]);
  });

  it("returns only Time off for a plain member", () => {
    expect(buildSections(en, member).map((section) => section.id)).toEqual(["timeOff"]);
  });

  it("leaves the Organization section out while roles are loading", () => {
    expect(buildSections(en, loading).map((section) => section.id)).toEqual(["timeOff"]);
  });

  it("adds Attendance, between Time off and Organization, once the viewer's clock is live", () => {
    const sections = buildSections(en, { ...admin, attendanceActive: true });

    expect(sections.map((section) => section.id)).toEqual([
      "timeOff",
      "attendance",
      "organization",
    ]);
    expect(sections[1]!.links).toEqual([
      expect.objectContaining({ href: "/my-attendance", label: "My attendance" }),
    ]);
  });

  it("leaves Attendance out for a viewer whose organization has it switched off", () => {
    expect(buildSections(en, admin).map((section) => section.id)).toEqual([
      "timeOff",
      "organization",
    ]);
  });

  it("never returns a section without links", () => {
    for (const access of [member, admin, loading, clocking]) {
      for (const section of buildSections(en, access)) {
        expect(section.links.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildUtilityLinks", () => {
  it("returns Settings for everyone", () => {
    expect(labels(buildUtilityLinks(en, member))).toEqual(["Settings"]);
  });

  it("adds Support for a support admin", () => {
    expect(labels(buildUtilityLinks(en, { ...member, supportAdmin: true }))).toEqual([
      "Settings",
      "Support",
    ]);
  });
});

describe("splitForBottomBar", () => {
  it("puts Dashboard, Requests and Report on the bar and the rest in the sheet", () => {
    const { bar, sheet } = splitForBottomBar(buildSections(en, admin));

    expect(labels(bar)).toEqual(["Dashboard", "Requests", "Report"]);
    expect(sheet.map((section) => [section.id, labels(section.links)])).toEqual([
      ["timeOff", ["Groups", "Calendar sync"]],
      ["organization", ["Organization", "Billing"]],
    ]);
  });

  it("holds the centre slot for the clock", () => {
    expect(BOTTOM_BAR_CLOCK_INDEX).toBe(2);
  });

  it("prefers the first Attendance link over the third Time off link", () => {
    const { bar, sheet } = splitForBottomBar(buildSections(en, clocking));

    expect(labels(bar)).toEqual(["Dashboard", "Requests", "My attendance"]);
    expect(sheet.map((section) => section.id)).toEqual(["timeOff"]);
    expect(labels(sheet[0]!.links)).toEqual(["Report", "Groups", "Calendar sync"]);
  });
});

describe("findActive", () => {
  const sections = buildSections(en, admin);
  const utility = buildUtilityLinks(en, { ...admin, supportAdmin: true });

  it("returns the section and link for a section path", () => {
    const { section, link } = findActive(sections, utility, "/billing");
    expect(section?.id).toBe("organization");
    expect(link?.label).toBe("Billing");
  });

  it("returns the utility link without a section", () => {
    const { section, link } = findActive(sections, utility, "/support/group");
    expect(section).toBeNull();
    expect(link?.label).toBe("Support");
  });

  it("returns nothing for an unknown path", () => {
    expect(findActive(sections, utility, "/nowhere")).toEqual({ section: null, link: null });
  });
});
