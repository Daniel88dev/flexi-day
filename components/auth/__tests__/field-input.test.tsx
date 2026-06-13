import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldInput } from "../field-input";

describe("FieldInput", () => {
  it("renders label and associates it with the input", () => {
    render(<FieldInput id="email" label="Email" placeholder="you@example.com" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");
  });
});
