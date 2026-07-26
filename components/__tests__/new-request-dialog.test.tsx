import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { NewRequestDialog } from "../new-request-dialog";
import { renderWithClient } from "@/lib/test-utils";

const createMutate = vi.fn().mockResolvedValue({});

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({ data: [{ id: "g-1", groupName: "Platform" }], isLoading: false }),
  useCreateVacation: () => ({ mutateAsync: createMutate, isPending: false }),
}));

describe("NewRequestDialog", () => {
  beforeEach(() => {
    createMutate.mockClear();
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

    fireEvent.click(screen.getByRole("switch", { name: "Half day" }));
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

    expect(screen.getByRole("switch", { name: "Half day" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-17" } });

    expect(screen.queryByRole("switch", { name: "Half day" })).toBeNull();
  });

  it("does not send a half day for a multi-day range", async () => {
    renderWithClient(<NewRequestDialog open initialDate="2026-07-15" onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("switch", { name: "Half day" }));
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({ halfDay: false });
  });
});
