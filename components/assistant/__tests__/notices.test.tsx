import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Notice } from "../notices";

describe("Notice", () => {
  it("should render the notice text", () => {
    render(<Notice text="Stopped here: Acme reached this week's Assistant limit." />);
    expect(
      screen.getByText("Stopped here: Acme reached this week's Assistant limit.")
    ).toBeInTheDocument();
  });
});
