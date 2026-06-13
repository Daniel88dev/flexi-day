import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BalanceWidget } from "../balance-widget";

describe("BalanceWidget", () => {
  it("renders the My balance heading and at least one row", () => {
    render(<BalanceWidget />);
    expect(screen.getByText("My balance")).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });
});
