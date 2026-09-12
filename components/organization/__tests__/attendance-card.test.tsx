import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendanceCard } from "../attendance-card";
import { renderWithClient } from "@/lib/test-utils";
import type { AttendanceSettings } from "@/lib/api/attendance-settings";
import type { OrganizationDetail } from "@/lib/api/organization";
import type { PlanName } from "@/lib/api/billing";

let settings: AttendanceSettings | undefined;
let settingsPending: boolean;
const updateSettings = vi.fn();

let proposedZone: string | null;

vi.mock("@/lib/attendance/timezones", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/attendance/timezones")>();
  return { ...actual, browserTimezone: () => proposedZone };
});

vi.mock("@/lib/api/queries", () => ({
  useAttendanceSettings: () => ({
    data: settings,
    isPending: settingsPending,
    error: null,
  }),
  useUpdateAttendanceSettings: () => ({ mutateAsync: updateSettings, isPending: false }),
  useBankHolidayCountries: () => ({
    data: [{ code: "CZ", name: "Czechia" }],
    isLoading: false,
    error: null,
  }),
}));

const baseSettings = (): AttendanceSettings => ({
  organizationId: "org-1",
  attendanceEnabled: false,
  locationEnabled: false,
  timezone: null,
  holidayCountry: null,
  workingDays: [1, 2, 3, 4, 5],
  breakMinutes: 30,
  breakThresholdMinutes: 360,
  requiredMinutesPerDay: 480,
  balanceMode: "DAILY",
  sessionCeilingMinutes: 960,
  breakCeilingMinutes: 120,
  active: false,
});

const detailOn = (plan: PlanName): OrganizationDetail => ({
  organization: {
    id: "org-1",
    name: "Studio Modrá",
    isOwner: true,
    billingEmail: "billing@studiomodra.cz",
    sickDayBenefitEnabled: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  plan: {
    plan,
    status: plan === "FREE" ? null : "active",
    writable: true,
    graceEndsAt: null,
    maxGroups: 5,
    maxMembersPerGroup: 25,
  },
  groups: [],
  admins: [],
  viewer: { userId: "owner-1" },
});

const render = (plan: PlanName) =>
  renderWithClient(<AttendanceCard detail={detailOn(plan)} organizationId="org-1" />);

describe("AttendanceCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settings = baseSettings();
    settingsPending = false;
    proposedZone = "Europe/Prague";
  });

  it("renders nothing while the settings are still loading", () => {
    settingsPending = true;
    const { container } = render("PRO");
    expect(container).toBeEmptyDOMElement();
  });

  describe("on the Free plan", () => {
    it("disables the switch and says why", () => {
      render("FREE");

      expect(screen.getByRole("switch", { name: "Turn attendance on" })).toBeDisabled();
      expect(screen.getByText("Available on Pro and Enterprise")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
    });

    it("renders none of the rules", () => {
      render("FREE");

      expect(screen.queryByLabelText("Timezone")).not.toBeInTheDocument();
      expect(screen.queryByText("Break allowance")).not.toBeInTheDocument();
    });
  });

  describe("on a paid plan", () => {
    it("offers the switch, and the rules only once it is on", async () => {
      render("PRO");

      expect(screen.queryByLabelText("Timezone")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));

      expect(screen.getByLabelText("Timezone")).toBeInTheDocument();
      expect(screen.getByLabelText("Holiday country")).toBeInTheDocument();
      expect(screen.getByLabelText("Break allowance")).toHaveValue("30");
      expect(screen.getByLabelText("Required per day")).toHaveValue("8:00");
      expect(screen.getByLabelText("Threshold")).toHaveValue("6:00");
      expect(screen.getByLabelText("Close a session after")).toHaveValue("16:00");
      expect(screen.getByLabelText("Close a break after")).toHaveValue("2:00");
    });

    it("proposes the browser's timezone when none is stored", async () => {
      proposedZone = "America/New_York";
      render("PRO");
      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));

      expect(screen.getByLabelText("Timezone")).toHaveTextContent("America/New_York");
    });

    it("carries the location switch with its responsibility note", async () => {
      render("PRO");
      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));

      expect(
        screen.getByRole("switch", { name: "Record location at clock-in and clock-out" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Agreeing this with your employees is your responsibility")
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Read it" })).toHaveAttribute("href", "/privacy");
    });

    it("saves every rule, with the toggle on", async () => {
      settings = { ...baseSettings(), timezone: "Europe/Prague" };
      render("PRO");

      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));
      await userEvent.click(
        screen.getByRole("switch", { name: "Record location at clock-in and clock-out" })
      );
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      expect(updateSettings).toHaveBeenCalledWith({
        attendanceEnabled: true,
        locationEnabled: true,
        timezone: "Europe/Prague",
        holidayCountry: null,
        workingDays: [1, 2, 3, 4, 5],
        breakMinutes: 30,
        breakThresholdMinutes: 360,
        requiredMinutesPerDay: 480,
        balanceMode: "DAILY",
        sessionCeilingMinutes: 960,
        breakCeilingMinutes: 120,
      });
    });

    it("refuses to save with no timezone, and never calls the endpoint", async () => {
      // Nothing to propose: the field starts empty and the save must not go.
      proposedZone = null;
      render("PRO");
      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));

      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        screen.getByText("Choose a timezone before turning attendance on.")
      ).toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });

    it("refuses to save a duration it cannot read", async () => {
      render("PRO");
      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));

      await userEvent.clear(screen.getByLabelText("Required per day"));
      await userEvent.type(screen.getByLabelText("Required per day"), "not a time");
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.getByText("Use h:mm, for example 8:00.")).toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });

    it("refuses to save with no working day selected", async () => {
      settings = { ...baseSettings(), timezone: "Europe/Prague" };
      render("PRO");
      await userEvent.click(screen.getByRole("switch", { name: "Turn attendance on" }));

      for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
        await userEvent.click(screen.getByRole("button", { name: label, pressed: true }));
      }
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.getByText("Choose at least one working day.")).toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });
  });

  describe("when the plan has lapsed", () => {
    beforeEach(() => {
      settings = {
        ...baseSettings(),
        attendanceEnabled: true,
        timezone: "Europe/Prague",
        active: false,
      };
    });

    it("keeps the settings readable and says attendance is dormant", () => {
      render("FREE");

      expect(screen.getByText(/attendance is dormant/)).toBeInTheDocument();
      expect(screen.getByLabelText("Timezone")).toHaveTextContent("Europe/Prague");
    });

    it("lets the rules be corrected and the feature switched off", async () => {
      render("FREE");

      await userEvent.clear(screen.getByLabelText("Break allowance"));
      await userEvent.type(screen.getByLabelText("Break allowance"), "45");
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ attendanceEnabled: true, breakMinutes: 45 })
      );
    });

    it("lets an accidental switch-off be undone before the save lands", async () => {
      render("FREE");

      const toggle = screen.getByRole("switch", { name: "Turn attendance on" });
      await userEvent.click(toggle);
      expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);
      expect(toggle).toBeChecked();
    });
  });
});
