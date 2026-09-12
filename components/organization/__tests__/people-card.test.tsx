import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { AttendanceSettings } from "@/lib/api/attendance-settings";
import type { EmploymentListItem } from "@/lib/api/employment";
import { PeopleCard } from "../people-card";

let settings: AttendanceSettings | undefined;
let employments: EmploymentListItem[] | undefined;
let employmentsPending: boolean;
let employmentsError: Error | null;
const updateRequired = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useAttendanceSettings: () => ({ data: settings, isPending: false, error: null }),
  useEmployments: () => ({
    data: employments,
    isPending: employmentsPending,
    error: employmentsError,
  }),
  useUpdateEmploymentRequiredMinutes: () => ({
    mutateAsync: updateRequired,
    isPending: false,
  }),
}));

const baseSettings = (overrides: Partial<AttendanceSettings> = {}): AttendanceSettings => ({
  organizationId: "org-1",
  attendanceEnabled: true,
  locationEnabled: false,
  timezone: "Europe/Prague",
  holidayCountry: "CZ",
  workingDays: [1, 2, 3, 4, 5],
  breakMinutes: 30,
  breakThresholdMinutes: 360,
  requiredMinutesPerDay: 480,
  balanceMode: "DAILY",
  sessionCeilingMinutes: 960,
  breakCeilingMinutes: 120,
  active: true,
  ...overrides,
});

const person = (overrides: Partial<EmploymentListItem> = {}): EmploymentListItem => ({
  id: "emp-1",
  userId: "user-1",
  email: "milo@dev.local",
  startedAt: "2026-01-05T08:00:00Z",
  endedAt: null,
  ended: false,
  requiredMinutesPerDay: null,
  user: { id: "user-1", name: "Milo Member", initials: "MM", avatarColor: "hsl(200 50% 50%)" },
  ...overrides,
});

describe("PeopleCard", () => {
  beforeEach(() => {
    settings = baseSettings();
    employments = [person()];
    employmentsPending = false;
    employmentsError = null;
    updateRequired.mockReset();
    updateRequired.mockResolvedValue(person({ requiredMinutesPerDay: 360 }));
  });

  it("lists the roster with the organization's figure standing in", () => {
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByText("Milo Member")).toBeInTheDocument();
    expect(screen.getByText("milo@dev.local")).toBeInTheDocument();
    expect(screen.getByText("Organization's 8:00")).toBeInTheDocument();
    expect(screen.getByLabelText("Required per day — Milo Member")).toHaveValue("");
  });

  it("shows an override that is already set", () => {
    employments = [person({ requiredMinutesPerDay: 360 })];
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByLabelText("Required per day — Milo Member")).toHaveValue("6:00");
  });

  it("saves a new override as minutes", async () => {
    renderWithClient(<PeopleCard organizationId="org-1" />);

    await userEvent.type(screen.getByLabelText("Required per day — Milo Member"), "6:00");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRequired).toHaveBeenCalledWith({
      employmentId: "emp-1",
      requiredMinutesPerDay: 360,
    });
  });

  it("clears the override when the box is emptied", async () => {
    employments = [person({ requiredMinutesPerDay: 360 })];
    renderWithClient(<PeopleCard organizationId="org-1" />);

    await userEvent.clear(screen.getByLabelText("Required per day — Milo Member"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRequired).toHaveBeenCalledWith({
      employmentId: "emp-1",
      requiredMinutesPerDay: null,
    });
  });

  it("refuses a figure that is not a time rather than storing a zero", async () => {
    renderWithClient(<PeopleCard organizationId="org-1" />);

    await userEvent.type(screen.getByLabelText("Required per day — Milo Member"), "half");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRequired).not.toHaveBeenCalled();
    expect(screen.getByText("Use h:mm, for example 6:00.")).toBeInTheDocument();
  });

  it("leaves Save alone until the figure changes", () => {
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("stays away while attendance is off", () => {
    settings = baseSettings({ attendanceEnabled: false });
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.queryByText("People")).toBeNull();
  });

  it("marks somebody whose employment has ended", () => {
    employments = [person({ ended: true, endedAt: "2026-06-30T08:00:00Z" })];
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByText("Ended")).toBeInTheDocument();
  });

  it("says so when the roster could not be read, rather than vanishing", () => {
    employments = undefined;
    employmentsError = new Error("nope");
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("Could not load the people in this organization.")).toBeInTheDocument();
  });

  it("says so when nobody is employed yet", () => {
    employments = [];
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByText("Nobody is employed here yet.")).toBeInTheDocument();
  });
});
