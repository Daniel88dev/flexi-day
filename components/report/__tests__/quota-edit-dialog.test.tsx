import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { QuotaEditDialog } from "../quota-edit-dialog";
import { renderWithClient } from "@/lib/test-utils";
import type { ReportQuotaRow, ReportScopeGroup } from "@/lib/api/report-types";

const setQuotaMutate = vi.fn();
let sickDayActive = false;

vi.mock("@/lib/api/queries", () => ({
  useSetUserQuota: () => ({ mutate: setQuotaMutate, isPending: false }),
  useCarryOverSuggestion: () => ({ data: undefined, isLoading: false, error: null }),
  useGroup: () => ({
    data: { id: "g-1", organization: { sickDayBenefitActive: sickDayActive } },
    isLoading: false,
    error: null,
  }),
}));

const group: ReportScopeGroup = {
  groupId: "g-1",
  groupName: "Platform",
  access: "all",
  canEditQuotas: true,
};

const quota: ReportQuotaRow = {
  userId: "u-1",
  groupId: "g-1",
  vacationDays: 20,
  homeOfficeDays: 5,
  sickDays: 2,
  carriedOverDays: 1,
};

function renderDialog() {
  renderWithClient(
    <QuotaEditDialog
      open
      onOpenChange={() => {}}
      userId="u-1"
      year={2026}
      group={group}
      quota={quota}
    />
  );
}

describe("QuotaEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sickDayActive = false;
  });

  it("edits the sick day allowance while the benefit is active", () => {
    sickDayActive = true;
    renderDialog();

    const input = screen.getByLabelText("Sick days");
    expect(input).toHaveValue(2);

    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(setQuotaMutate.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      userId: "u-1",
      year: 2026,
      vacationDays: 20,
      homeOfficeDays: 5,
      sickDays: 4,
      carriedOverDays: 1,
    });
  });

  it("hides sick days and omits them from the save while the benefit is not active", () => {
    renderDialog();

    expect(screen.queryByLabelText("Sick days")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    // Omitted, not zeroed: the backend preserves a stored allowance on omission.
    expect(setQuotaMutate.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      userId: "u-1",
      year: 2026,
      vacationDays: 20,
      homeOfficeDays: 5,
      carriedOverDays: 1,
    });
  });
});
