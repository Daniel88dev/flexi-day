import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
  it("renders label, value and sub", () => {
    render(
      <StatCard
        icon={<span data-testid="icon" />}
        tint="var(--c-vacation)"
        label="Pending"
        value={7}
        sub="to review"
      />
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("to review")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
