import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
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
});
