import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { NewRequestDialog } from "../new-request-dialog";
import { renderWithClient } from "@/lib/test-utils";

const createMutate = vi.fn().mockResolvedValue({});
let canAdmin = false;
let members: unknown[] = [];

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: [{ id: "g-1", groupName: "Platform" }], isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: createMutate, isPending: false }),
  useGroup: () => ({
    data: {
      id: "g-1",
      groupName: "Platform",
      access: { canView: true, canAdmin, viaOrgAdmin: false, isMember: true },
    },
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
    members = [];
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
