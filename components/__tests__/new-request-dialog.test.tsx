import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { NewRequestDialog } from "../new-request-dialog";
import { renderWithClient } from "@/lib/test-utils";

const createMutate = vi.fn().mockResolvedValue({});
let canAdmin = false;
let sickDayActive = false;
// Per-group override so a test can present groups with different benefits.
let sickDayActiveByGroup: Record<string, boolean> = {};
let groups: { id: string; groupName: string }[] = [{ id: "g-1", groupName: "Platform" }];
let members: unknown[] = [];

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: groups, isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: createMutate, isPending: false }),
  useGroup: (id: string | null) => ({
    data: id
      ? {
          id,
          groupName: groups.find((g) => g.id === id)?.groupName ?? id,
          organization: { sickDayBenefitActive: sickDayActiveByGroup[id] ?? sickDayActive },
          access: { canView: true, canAdmin, viaOrgAdmin: false, isMember: true },
        }
      : undefined,
    isLoading: false,
    error: null,
  }),
  useGroupUsers: () => ({ data: members, isLoading: false, error: null }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-self" } } }),
}));

const member = {
  userId: "u-member",
  controlledUser: true,
  deletedAt: null,
  user: { id: "u-member", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
};

describe("NewRequestDialog", () => {
  beforeEach(() => {
    createMutate.mockClear();
    canAdmin = false;
    sickDayActive = false;
    sickDayActiveByGroup = {};
    groups = [{ id: "g-1", groupName: "Platform" }];
    members = [];
  });

  it("offers Sick day under Others only for a group whose benefit is active", async () => {
    sickDayActive = true;
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    expect(screen.getByRole("option", { name: "Sick day" })).toBeInTheDocument();
  });

  it("seeds From and To with initialDate when opened with a preset day", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.getByLabelText("From")).toHaveValue("2026-07-15");
    expect(screen.getByLabelText("To")).toHaveValue("2026-07-15");
  });

  it("hides the built-in trigger button when controlled", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    // The dialog title is "New Request" (not a button); the "+ New Request"
    // trigger button must be absent in controlled mode.
    expect(screen.queryByRole("button", { name: "+ New Request" })).toBeNull();
  });

  it("offers the three everyday types plus Others at the top level", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    for (const name of ["Vacation", "Home Office", "Sick", "Others"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("tab", { name: "Paid Time Off" })).toBeNull();
  });

  it("reveals the rarer types with their dashboard colors behind Others", async () => {
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));

    // The full Others set, in order — and neither Sick day (not offered until
    // the benefit ships) nor Bank Holiday (never requestable).
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Paid Time Off",
      "Non-Paid Leave",
      "Study Leave",
      "Other",
    ]);

    const dot = screen
      .getByRole("option", { name: "Paid Time Off" })
      .querySelector("[aria-hidden]");
    expect(dot?.getAttribute("style")).toContain("--c-pto");
  });

  it("submits the type picked in the Others select", async () => {
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    // Others open with nothing picked yet — there is no type to submit.
    expect(screen.getByRole("button", { name: "Submit Request" })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Study Leave" }));
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ vacationType: "STUDY_LEAVE" });
  });

  it("resets a Sick day selection when the selected group loses the benefit", async () => {
    sickDayActive = true;
    const user = userEvent.setup();
    const { rerender, client } = renderWithClient(
      <NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />
    );

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Sick day" }));

    // The user switches to a group without the benefit; the mocked useGroup
    // answers for whichever group is selected, so flipping the flag stands in
    // for the new group's badge arriving.
    sickDayActive = false;
    rerender(
      <QueryClientProvider client={client}>
        <NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Vacation" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
    expect(screen.getByRole("button", { name: "Submit Request" })).toBeEnabled();
  });

  it("clears a Sick day pick on group switch and submits the type it shows", async () => {
    groups = [
      { id: "g-1", groupName: "Platform" },
      { id: "g-2", groupName: "Retail" },
    ];
    sickDayActiveByGroup = { "g-1": true, "g-2": false };
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Sick day" }));

    await user.click(screen.getByRole("combobox", { name: "Group" }));
    await user.click(screen.getByRole("option", { name: "Retail" }));

    expect(screen.getByRole("tab", { name: "Vacation" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: "Submit Request" }));
    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      groupId: "g-2",
      vacationType: "VACATION",
    });
  });

  it("blocks an Other request until a note is written", async () => {
    const user = userEvent.setup();
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.click(screen.getByRole("combobox", { name: "Others" }));
    await user.click(screen.getByRole("option", { name: "Other" }));

    expect(screen.getByRole("button", { name: "Submit Request" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Note (required for Other)"), {
      target: { value: "Jury duty" },
    });
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      vacationType: "OTHER",
      note: "Jury duty",
    });
  });

  it("submits halfDay when the toggle is on", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Half day" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: true });
  });

  it("submits halfDay false by default", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: false });
  });

  it("hides the half-day toggle once the request spans more than one day", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "Half day" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-17" } });

    expect(screen.queryByRole("checkbox", { name: "Half day" })).toBeNull();
  });

  it("does not send a half day for a multi-day range", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Half day" }));
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: false });
  });

  it("hides the member picker for non-admins", () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.queryByLabelText("For")).toBeNull();
  });

  it("submits without on-behalf fields when an admin books for themselves", async () => {
    canAdmin = true;
    members = [member];
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    expect(screen.getByLabelText("For")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    const payload = createMutate.mock.calls[0][0];
    expect(payload.userId).toBeUndefined();
    expect(payload.autoApprove).toBeUndefined();
  });

  it("books on behalf with autoApprove pre-checked when a member is picked", async () => {
    canAdmin = true;
    members = [member];
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByLabelText("For"));
    fireEvent.click(await screen.findByRole("option", { name: "Dana Holt" }));

    expect(screen.getByLabelText("Approve immediately")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      userId: "u-member",
      autoApprove: true,
    });
  });

  it("sends autoApprove false when the admin unchecks it", async () => {
    canAdmin = true;
    members = [member];
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByLabelText("For"));
    fireEvent.click(await screen.findByRole("option", { name: "Dana Holt" }));
    fireEvent.click(screen.getByLabelText("Approve immediately"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      userId: "u-member",
      autoApprove: false,
    });
  });
});
