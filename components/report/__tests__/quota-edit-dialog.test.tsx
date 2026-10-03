import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { QuotaEditDialog } from "../quota-edit-dialog";
import { renderWithClient, withClient } from "@/lib/test-utils";
import type { ReportQuotaRow, ReportScopeGroup } from "@/lib/api/report-types";

const setQuotaMutate = vi.fn();
let sickDayActive = false;
let groupState: "loaded" | "loading" | "error" = "loaded";

vi.mock("@/lib/api/queries", () => ({
  useSetUserQuota: () => ({ mutate: setQuotaMutate, isPending: false }),
  useCarryOverSuggestion: () => ({ data: undefined, isLoading: false, error: null }),
  useGroup: () => ({
    data:
      groupState === "loaded"
        ? {
            id: "g-1",
            organization: { sickDayBenefitActive: sickDayActive },
            defaultVacationDays: 25,
            defaultHomeOfficeDays: 12,
            defaultSickDays: 5,
          }
        : undefined,
    isLoading: groupState === "loading",
    isError: groupState === "error",
    error: groupState === "error" ? new Error("boom") : null,
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

function dialogElement(row: ReportQuotaRow | undefined) {
  return (
    <QuotaEditDialog
      open
      onOpenChange={() => {}}
      userId="u-1"
      year={2026}
      group={group}
      quota={row}
    />
  );
}

function renderDialog(row: ReportQuotaRow | undefined) {
  return renderWithClient(dialogElement(row));
}

describe("QuotaEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sickDayActive = false;
    groupState = "loaded";
  });

  it("edits the sick day allowance while the benefit is active", () => {
    sickDayActive = true;
    renderDialog(quota);

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
    renderDialog(quota);

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

  it("opens with the stored row rather than the group defaults", () => {
    sickDayActive = true;
    renderDialog(quota);

    expect(screen.getByLabelText("Vacation days")).toHaveValue(20);
    expect(screen.getByLabelText("Home office days")).toHaveValue(5);
    expect(screen.getByLabelText("Sick days")).toHaveValue(2);
    expect(screen.getByLabelText("Carried over from previous year")).toHaveValue(1);
    expect(screen.queryByText(/group defaults/)).toBeNull();
  });

  it("opens with the group defaults and no carry-over for a member with no stored row", () => {
    sickDayActive = true;
    renderDialog(undefined);

    expect(screen.getByLabelText("Vacation days")).toHaveValue(25);
    expect(screen.getByLabelText("Home office days")).toHaveValue(12);
    expect(screen.getByLabelText("Sick days")).toHaveValue(5);
    expect(screen.getByLabelText("Carried over from previous year")).toHaveValue(0);
    expect(screen.getByText(/group defaults/)).toBeInTheDocument();
  });

  it("saves the group defaults as a new row for a member with no stored row", () => {
    sickDayActive = true;
    renderDialog(undefined);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(setQuotaMutate.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      userId: "u-1",
      year: 2026,
      vacationDays: 25,
      homeOfficeDays: 12,
      sickDays: 5,
      carriedOverDays: 0,
    });
  });

  it("leaves sick days out of the defaults while the benefit is not active", () => {
    renderDialog(undefined);

    expect(screen.queryByLabelText("Sick days")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(setQuotaMutate.mock.calls[0][0]).toEqual({
      groupId: "g-1",
      userId: "u-1",
      year: 2026,
      vacationDays: 25,
      homeOfficeDays: 12,
      carriedOverDays: 0,
    });
  });

  it("holds the form until the group defaults load, then fills them in", () => {
    groupState = "loading";
    const { rerender } = renderDialog(undefined);

    expect(screen.getByLabelText("Vacation days")).toBeDisabled();
    expect(screen.getByLabelText("Vacation days")).not.toHaveValue(0);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    groupState = "loaded";
    rerender(withClient(dialogElement(undefined)));

    expect(screen.getByLabelText("Vacation days")).toBeEnabled();
    expect(screen.getByLabelText("Vacation days")).toHaveValue(25);
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("keeps the save disabled when the group defaults fail to load", () => {
    groupState = "error";
    renderDialog(undefined);

    expect(screen.getByText("Could not load the group's defaults.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
