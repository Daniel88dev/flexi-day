import { describe, expect, it } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { FieldInput } from "../field-input";

describe("FieldInput", () => {
  it("renders label and associates it with the input", () => {
    render(<FieldInput id="email" label="Email" placeholder="you@example.com" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");
  });

  it("forwards a ref to the underlying input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<FieldInput id="email" label="Email" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText("Email"));
  });
});
