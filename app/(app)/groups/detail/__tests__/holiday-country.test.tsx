import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetailPage from "../page";
import { renderWithClient } from "@/lib/test-utils";

const updateHolidayCountryMutate = vi.fn().mockResolvedValue({});

const group = {
  id: "g-1",
  groupName: "Platform",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  holidayCountry: null as string | null,
  managerUserId: "u-1",
  organization: null,
  access: { canView: true, canAdmin: true, viaOrgAdmin: false, isMember: true },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams({ groupId: "g-1", tab: "settings" }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useBankHolidayCountries: () => ({
    data: [
      { code: "CZ", name: "Czech Republic" },
      { code: "DE", name: "Germany" },
    ],
    isLoading: false,
    error: null,
  }),
  useUpdateGroupHolidayCountry: () => ({
    mutateAsync: updateHolidayCountryMutate,
    isPending: false,
  }),
  useGroup: () => ({ data: group, isLoading: false, error: null }),
  useGroupUsers: () => ({ data: [], isLoading: false, error: null }),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useSetUserQuota: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupQuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGroupWorkingDays: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGroupInvites: () => ({ data: [], isLoading: false, error: null }),
  useCreateGroupInvite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeGroupInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useGroupMirrors: () => ({ data: undefined, isLoading: false, error: null }),
  useSetGroupMirrors: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("GroupDetailPage holiday country", () => {
  beforeEach(() => {
    updateHolidayCountryMutate.mockClear();
    group.holidayCountry = null;
    group.access = { canView: true, canAdmin: true, viaOrgAdmin: false, isMember: true };
  });

  it("renders the card with the off state preselected", () => {
    renderWithClient(<GroupDetailPage />);

    expect(screen.getByText("Public holidays")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent(
      "None (no public holidays shown)"
    );
  });

  it("hides the card from non-admins", () => {
    group.access = { canView: true, canAdmin: false, viaOrgAdmin: false, isMember: true };
    renderWithClient(<GroupDetailPage />);

    expect(screen.queryByText("Public holidays")).not.toBeInTheDocument();
  });

  it("saves a selected country", async () => {
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "Czech Republic (CZ)" }));
    await user.click(screen.getByRole("button", { name: "Save public holidays" }));

    expect(updateHolidayCountryMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      holidayCountry: "CZ",
    });
  });

  it("saves null when switching back to none", async () => {
    group.holidayCountry = "CZ";
    const user = userEvent.setup();
    renderWithClient(<GroupDetailPage />);

    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "None (no public holidays shown)" }));
    await user.click(screen.getByRole("button", { name: "Save public holidays" }));

    expect(updateHolidayCountryMutate).toHaveBeenCalledWith({
      groupId: "g-1",
      holidayCountry: null,
    });
  });
});
