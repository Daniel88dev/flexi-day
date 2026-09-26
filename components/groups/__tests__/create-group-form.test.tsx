import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CreateGroupForm } from "../create-group-form";
import { renderWithClient } from "@/lib/test-utils";

vi.mock("@/lib/api/queries", () => ({
  useCreateGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscription: () => ({ data: undefined, isLoading: false, error: null }),
}));

describe("CreateGroupForm", () => {
  it("renders the name and default fields, with Create disabled until named", () => {
    renderWithClient(<CreateGroupForm />);

    expect(screen.getByLabelText("Group name")).toBeInTheDocument();
    expect(screen.getByLabelText("Default vacation days")).toHaveValue(20);
    expect(screen.getByRole("button", { name: "Create group" })).toBeDisabled();
  });
});
