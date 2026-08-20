import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroEnter, Reveal } from "../reveal";

describe("Reveal", () => {
  it("renders the provided children", () => {
    render(<Reveal>scroll content</Reveal>);
    expect(screen.getByText("scroll content")).toBeInTheDocument();
  });
});

describe("HeroEnter", () => {
  it("renders the provided children", () => {
    render(<HeroEnter>hero content</HeroEnter>);
    expect(screen.getByText("hero content")).toBeInTheDocument();
  });
});
