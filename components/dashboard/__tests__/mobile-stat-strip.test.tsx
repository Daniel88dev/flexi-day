import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileStatStrip, type MobileStat } from "../mobile-stat-strip";

const stats: MobileStat[] = [
  {
    id: "pending",
    icon: <span data-testid="icon-pending" />,
    tint: "var(--warm)",
    label: "Pending approvals",
    value: 3,
    sub: "need review",
    href: "/requests",
    accentValue: true,
  },
  {
    id: "out-today",
    icon: <span data-testid="icon-out" />,
    tint: "var(--c-vacation)",
    label: "Out today",
    value: 1,
    sub: "away from desk",
  },
];

describe("MobileStatStrip", () => {
  it("renders one collapsed tile per stat with icon and value only", () => {
    render(<MobileStatStrip stats={stats} />);
    expect(screen.getByTestId("icon-pending")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("Pending approvals")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("reveals label, sub text and link when a tile is tapped", async () => {
    const user = userEvent.setup();
    render(<MobileStatStrip stats={stats} />);

    await user.click(screen.getByRole("button", { name: "Pending approvals: 3" }));

    expect(screen.getByText("Pending approvals")).toBeInTheDocument();
    expect(screen.getByText("3 need review")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/requests");
  });

  it("keeps only one tile expanded at a time", async () => {
    const user = userEvent.setup();
    render(<MobileStatStrip stats={stats} />);

    await user.click(screen.getByRole("button", { name: "Pending approvals: 3" }));
    await user.click(screen.getByRole("button", { name: "Out today: 1" }));

    expect(screen.queryByText("Pending approvals")).not.toBeInTheDocument();
    expect(screen.getByText("Out today")).toBeInTheDocument();
  });

  it("collapses when the open tile is tapped again", async () => {
    const user = userEvent.setup();
    render(<MobileStatStrip stats={stats} />);

    const tile = screen.getByRole("button", { name: "Out today: 1" });
    await user.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "true");

    await user.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Out today")).not.toBeInTheDocument();
  });

  it("omits the link for stats without a destination", async () => {
    const user = userEvent.setup();
    render(<MobileStatStrip stats={stats} />);

    await user.click(screen.getByRole("button", { name: "Out today: 1" }));

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
