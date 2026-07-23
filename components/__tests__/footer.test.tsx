import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer, FOOTER_LINKS } from "../footer";

describe("Footer", () => {
  it("renders the four policy links pointing at their routes", () => {
    render(<Footer />);
    for (const { href, label } of FOOTER_LINKS) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toMatch(new RegExp(href));
    }
  });

  it("shows the copyright with the current year", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it("renders the compact variant with all links", () => {
    render(<Footer minimal />);
    for (const { label } of FOOTER_LINKS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
