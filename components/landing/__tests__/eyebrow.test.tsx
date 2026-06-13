import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow } from "../eyebrow";

describe("Eyebrow", () => {
  it("renders the provided children", () => {
    render(<Eyebrow>Hello world</Eyebrow>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
