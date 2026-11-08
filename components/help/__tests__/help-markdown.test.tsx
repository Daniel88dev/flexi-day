import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpMarkdown } from "../help-markdown";

describe("HelpMarkdown", () => {
  it("renders headings, paragraphs, lists and inline marks", () => {
    const { container } = render(
      <HelpMarkdown
        markdown={
          "## Steps\n\nOpen **Settings** and copy `https://api.flexi-day.com/mcp`.\n\n1. One\n2. Two\n\n- *Off*\n- On"
        }
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "Steps" })).toBeInTheDocument();
    expect(screen.getByText("Settings").tagName).toBe("STRONG");
    expect(screen.getByText("https://api.flexi-day.com/mcp").tagName).toBe("CODE");
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(screen.getByText("Off").tagName).toBe("EM");
  });

  it("links to our own pages in place and opens other sites in a new tab", () => {
    render(
      <HelpMarkdown markdown="See [the Assistant](/help/assistant/) and [Claude](https://claude.ai)." />
    );

    const own = screen.getByRole("link", { name: "the Assistant" });
    expect(own).toHaveAttribute("href", "/help/assistant/");
    expect(own).not.toHaveAttribute("target");
    const other = screen.getByRole("link", { name: "Claude" });
    expect(other).toHaveAttribute("target", "_blank");
    expect(other).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("drops images and raw HTML", () => {
    const { container } = render(
      <HelpMarkdown
        markdown={'![logo](https://example.com/x.png)\n\n<script>alert("x")</script>'}
      />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).not.toContain("alert");
  });
});
