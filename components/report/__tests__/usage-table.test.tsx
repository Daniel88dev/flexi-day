import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { UsageTable } from "../usage-table";
import { renderWithClient } from "@/lib/test-utils";
import type { MemberCard } from "@/lib/report/series";
import { VacationKind } from "@/lib/api/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/report",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

const card = (over: Partial<MemberCard> = {}): MemberCard => ({
  member: {
    id: "u1",
    name: "Ada Lovelace",
    initials: "AL",
    avatarColor: "hsl(200, 65%, 50%)",
    groupId: "g1",
  },
  vacationType: VacationKind.Vacation,
  series: [],
  quota: 23,
  carriedOver: 3,
  yearQuota: 20,
  usedToDate: 5,
  plannedRemaining: 2,
  pending: 1,
  remaining: 16,
  ...over,
});

describe("UsageTable", () => {
  it("renders a row per member with their figures", () => {
    renderWithClient(<UsageTable cards={[card()]} year={2026} />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("links each member to their detail for the selected year", () => {
    renderWithClient(<UsageTable cards={[card()]} year={2026} />);

    expect(screen.getByRole("link", { name: /Ada Lovelace/ })).toHaveAttribute(
      "href",
      "/report/member?userId=u1&year=2026"
    );
  });

  it("shows a half day as 0.5 rather than rounding it away", () => {
    renderWithClient(<UsageTable cards={[card({ usedToDate: 5.5 })]} year={2026} />);

    expect(screen.getByText("5.5")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the filters", () => {
    renderWithClient(<UsageTable cards={[]} year={2026} />);

    expect(screen.getByText(/No members match/i)).toBeInTheDocument();
  });
});
