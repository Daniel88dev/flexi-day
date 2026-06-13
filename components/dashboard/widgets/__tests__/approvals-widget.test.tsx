import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApprovalsWidget } from "../approvals-widget";

describe("ApprovalsWidget", () => {
  it("renders the heading and seeded approval cards", () => {
    render(<ApprovalsWidget />);
    expect(screen.getByText("Pending approvals")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Approve/i }).length).toBeGreaterThan(0);
  });

  it("removes a row when Approve is clicked", async () => {
    const user = userEvent.setup();
    render(<ApprovalsWidget />);
    const approveButtons = screen.getAllByRole("button", { name: /Approve/i });
    const before = approveButtons.length;
    await user.click(approveButtons[0]);
    const after = screen.queryAllByRole("button", { name: /Approve/i }).length;
    expect(after).toBe(before - 1);
  });
});
