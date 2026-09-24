import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelfServiceLine } from "../self-service-line";

describe("SelfServiceLine", () => {
  it("is read-only for a group admin, naming who sets it", () => {
    render(<SelfServiceLine selfService={{ enabled: true, days: 7 }} canChange={false} />);

    expect(screen.getByText("Self-service is on, 7 days back.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Members can enter and correct their own attendance for today and the 7 days before it."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Set by organization admins")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Change" })).not.toBeInTheDocument();
  });

  it("links an org admin to the setting", () => {
    render(<SelfServiceLine selfService={{ enabled: true, days: 7 }} canChange />);

    expect(screen.getByRole("link", { name: "Change" })).toHaveAttribute("href", "/organization");
    expect(screen.queryByText("Set by organization admins")).not.toBeInTheDocument();
  });

  it("says when it is off", () => {
    render(<SelfServiceLine selfService={{ enabled: false, days: 0 }} canChange={false} />);

    expect(screen.getByText("Self-service is off.")).toBeInTheDocument();
  });

  it("says today only for 0 days, and no limit for null", () => {
    const { rerender } = render(
      <SelfServiceLine selfService={{ enabled: true, days: 0 }} canChange={false} />
    );
    expect(screen.getByText("Self-service is on, today only.")).toBeInTheDocument();

    rerender(<SelfServiceLine selfService={{ enabled: true, days: null }} canChange={false} />);
    expect(screen.getByText("Self-service is on, no limit.")).toBeInTheDocument();
  });
});
