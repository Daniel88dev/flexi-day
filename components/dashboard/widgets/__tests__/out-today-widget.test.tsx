import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OutTodayWidget } from "../out-today-widget";

describe("OutTodayWidget", () => {
  it("renders the Out today heading", () => {
    render(<OutTodayWidget />);
    expect(screen.getByText("Out today")).toBeInTheDocument();
  });
});
