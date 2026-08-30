import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { QuotasTab } from "../quotas-tab";
import { renderWithClient } from "@/lib/test-utils";
import type { Group } from "@/lib/api/types";

const setQuota = vi.fn().mockResolvedValue({});
const updateGroupQuotas = vi.fn().mockResolvedValue({});

vi.mock("@/lib/api/queries", () => ({
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useGroupUsers: () => ({
    data: [
      {
        id: "gu-1",
        userId: "u-1",
        user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(1 65% 50%)" },
      },
    ],
    isLoading: false,
    error: null,
  }),
  useSetUserQuota: () => ({ mutateAsync: setQuota, isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: updateGroupQuotas, isPending: false }),
}));

const group = (sickDayBenefitActive: boolean): Group => ({
  id: "g-1",
  organizationId: "org-1",
  organization: {
    id: "org-1",
    name: "Acme",
    plan: "PRO",
    status: "active",
    active: true,
    sickDayBenefitActive,
  },
  groupName: "Platform",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  defaultSickDays: 3,
  workingDays: [1, 2, 3, 4, 5],
  holidayCountry: null,
  managerUserId: "u-owner",
  mainApprovalUser: null,
  tempApprovalUser: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const year = new Date().getFullYear();

describe("QuotasTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the sick day column and defaults field while the benefit is active", () => {
    renderWithClient(<QuotasTab groupId="g-1" group={group(true)} isAdmin />);

    expect(screen.getByRole("columnheader", { name: "Sick days" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sick days")).toHaveValue(3);
  });

  it("saves the sick day allowance alongside the other quotas", async () => {
    renderWithClient(<QuotasTab groupId="g-1" group={group(true)} isAdmin />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Sick days for Dana Holt"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(setQuota).toHaveBeenCalled());
    expect(setQuota.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      userId: "u-1",
      year,
      vacationDays: 20,
      homeOfficeDays: 0,
      sickDays: 4,
    });
  });

  it("saves the sick day group default", async () => {
    renderWithClient(<QuotasTab groupId="g-1" group={group(true)} isAdmin />);

    fireEvent.change(screen.getByLabelText("Sick days"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save defaults" }));

    await waitFor(() => expect(updateGroupQuotas).toHaveBeenCalled());
    expect(updateGroupQuotas.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      defaultVacationDays: 20,
      defaultHomeOfficeDays: 0,
      defaultSickDays: 5,
    });
  });

  it("hides sick days and omits them from saves while the benefit is not active", async () => {
    renderWithClient(<QuotasTab groupId="g-1" group={group(false)} isAdmin />);

    expect(screen.queryByRole("columnheader", { name: "Sick days" })).toBeNull();
    expect(screen.queryByLabelText("Sick days")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(setQuota).toHaveBeenCalled());
    // Omitted, not zeroed: the backend preserves a stored allowance on omission.
    expect(setQuota.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      userId: "u-1",
      year,
      vacationDays: 20,
      homeOfficeDays: 0,
    });

    fireEvent.click(screen.getByRole("button", { name: "Save defaults" }));
    await waitFor(() => expect(updateGroupQuotas).toHaveBeenCalled());
    expect(updateGroupQuotas.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      defaultVacationDays: 20,
      defaultHomeOfficeDays: 0,
    });
  });
});
