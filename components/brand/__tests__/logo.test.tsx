import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "../logo";

describe("Logo", () => {
  it("renders the flexiday wordmark by default", () => {
    render(<Logo />);
    expect(screen.getByText("flexi")).toBeInTheDocument();
    expect(screen.getByText("day")).toBeInTheDocument();
  });

  it("omits the wordmark when withWordmark is false", () => {
    render(<Logo withWordmark={false} />);
    expect(screen.queryByText("flexi")).not.toBeInTheDocument();
  });

  it("wraps in a link when href is set, plain span when null", () => {
    const { container, rerender } = render(<Logo href="/dashboard" />);
    expect(container.querySelector("a")).not.toBeNull();
    rerender(<Logo href={null} />);
    expect(container.querySelector("a")).toBeNull();
  });
});
