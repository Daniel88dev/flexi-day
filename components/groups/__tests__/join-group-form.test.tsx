import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { JoinGroupForm } from "../join-group-form";
import { renderWithClient } from "@/lib/test-utils";

vi.mock("@/lib/api/queries", () => ({
  useJoinGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJoinGroupByLink: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("JoinGroupForm", () => {
  it("renders one field for an invite link or code, with Join disabled until it has one", () => {
    renderWithClient(<JoinGroupForm />);

    expect(screen.getByLabelText("Invite link or code")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join group" })).toBeDisabled();
  });
});
