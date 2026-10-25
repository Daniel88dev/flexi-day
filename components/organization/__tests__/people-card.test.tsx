import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { AttendanceSettings } from "@/lib/api/attendance-settings";
import type { EmploymentListItem } from "@/lib/api/employment";
import { ApiError } from "@/lib/api/client";
import { PeopleCard } from "../people-card";

let settings: AttendanceSettings | undefined;
let employments: EmploymentListItem[] | undefined;
let employmentsPending: boolean;
let employmentsError: Error | null;
const updateRequired = vi.fn();
const endEmployment = vi.fn();

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
  useEndEmployment: () => ({ mutateAsync: endEmployment, isPending: false }),
}));

const baseSettings = (overrides: Partial<AttendanceSettings> = {}): AttendanceSettings => ({
  organizationId: "org-1",
  attendanceEnabled: true,
  locationEnabled: false,
  selfServiceEnabled: false,
  selfServiceDays: 0,
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
  accountDeletedAt: null,
  accountDeleted: false,
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
    endEmployment.mockReset();
    endEmployment.mockResolvedValue({ ...person(), ended: true, cancelledBookings: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("shows the roster with attendance off, without the required time", () => {
    settings = baseSettings({ attendanceEnabled: false, active: false });
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("Milo Member")).toBeInTheDocument();
    expect(screen.queryByLabelText("Required per day — Milo Member")).toBeNull();
    expect(screen.queryByText("Organization's 8:00")).toBeNull();
  });

  it("splits open Employments from former ones", () => {
    employments = [
      person(),
      person({
        id: "emp-2",
        userId: "user-2",
        ended: true,
        endedAt: "2026-06-30T08:00:00Z",
        user: { id: "user-2", name: "Fran Former", initials: "FF", avatarColor: "hsl(1 1% 1%)" },
      }),
    ];
    renderWithClient(<PeopleCard organizationId="org-1" />);

    const open = screen.getByRole("list", { name: "Open" });
    const former = screen.getByRole("list", { name: "Former" });
    expect(within(open).getByText("Milo Member")).toBeInTheDocument();
    expect(within(open).queryByText("Fran Former")).toBeNull();
    expect(within(former).getByText("Fran Former")).toBeInTheDocument();
    expect(within(former).getByText(/^Ended /)).toBeInTheDocument();
  });

  it("leaves the Former list out while nobody has left", () => {
    renderWithClient(<PeopleCard organizationId="org-1" />);

    expect(screen.queryByRole("list", { name: "Former" })).toBeNull();
  });

  describe("a Deleted account", () => {
    const deleted = (overrides: Partial<EmploymentListItem> = {}) =>
      person({
        id: "emp-del",
        userId: "user-del",
        email: "user-del@deleted.invalid",
        accountDeleted: true,
        accountDeletedAt: "2026-10-20T08:00:00Z",
        user: {
          id: "user-del",
          name: "Jana Nováková",
          initials: "JN",
          avatarColor: "hsl(9 9% 9%)",
        },
        ...overrides,
      });

    it("carries the label and End employment, and a live row carries neither", () => {
      employments = [person(), deleted()];
      renderWithClient(<PeopleCard organizationId="org-1" />);

      const rows = within(screen.getByRole("list", { name: "Open" })).getAllByRole("listitem");
      const [live, gone] = rows;
      expect(within(gone!).getByTestId("account-deleted")).toBeInTheDocument();
      expect(within(gone!).getByRole("button", { name: "End employment" })).toBeInTheDocument();
      expect(within(gone!).queryByText("user-del@deleted.invalid")).toBeNull();
      expect(within(live!).queryByTestId("account-deleted")).toBeNull();
      expect(within(live!).queryByRole("button", { name: "End employment" })).toBeNull();
    });

    it("keeps the label but offers no End once the Employment has ended", () => {
      employments = [deleted({ ended: true, endedAt: "2026-10-21T08:00:00Z" })];
      renderWithClient(<PeopleCard organizationId="org-1" />);

      const former = screen.getByRole("list", { name: "Former" });
      expect(within(former).getByTestId("account-deleted")).toBeInTheDocument();
      expect(within(former).queryByRole("button", { name: "End employment" })).toBeNull();
    });

    it("ends the Employment on today's date in the organization's zone by default", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-25T23:30:00Z"));
      employments = [deleted()];
      renderWithClient(<PeopleCard organizationId="org-1" />);

      await userEvent.click(screen.getByRole("button", { name: "End employment" }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByLabelText("Last day")).toHaveValue("2026-10-26");
      await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

      expect(endEmployment).toHaveBeenCalledWith({
        employmentId: "emp-del",
        endedOn: "2026-10-26",
      });
    });

    it("refuses a last day after today without asking the server", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-25T10:00:00Z"));
      employments = [deleted()];
      renderWithClient(<PeopleCard organizationId="org-1" />);

      await userEvent.click(screen.getByRole("button", { name: "End employment" }));
      const dialog = screen.getByRole("dialog");
      const date = within(dialog).getByLabelText("Last day");
      await userEvent.clear(date);
      await userEvent.type(date, "2026-10-26");
      await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

      expect(endEmployment).not.toHaveBeenCalled();
      expect(within(dialog).getByText("The last day can't be after today.")).toBeInTheDocument();
    });

    it("says why when the person still manages a group", async () => {
      endEmployment.mockRejectedValue(
        new ApiError(409, "This person manages a group", undefined, [
          { message: "This person manages a group", context: { code: "MANAGES_GROUP" } },
        ])
      );
      employments = [deleted()];
      renderWithClient(<PeopleCard organizationId="org-1" />);

      await userEvent.click(screen.getByRole("button", { name: "End employment" }));
      const dialog = screen.getByRole("dialog");
      await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

      expect(
        await within(dialog).findByText(
          "This person manages a group. Give the group another manager first."
        )
      ).toBeInTheDocument();
    });
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
