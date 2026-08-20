import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApprovalPreview } from "../approval-preview";
import { DEMO_TEAM } from "@/lib/demo/team";

describe("ApprovalPreview", () => {
  it("renders the demo person with approve and decline labels", () => {
    render(<ApprovalPreview />);
    expect(screen.getByText(DEMO_TEAM[1].name)).toBeInTheDocument();
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Decline")).toBeInTheDocument();
  });
});
