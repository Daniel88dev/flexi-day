import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DashboardStats } from "@/components/dashboard-stats";
import type { LeaveRequest } from "@/lib/data";

// Fixed "today" so tests aren't date-sensitive
const TODAY = "2026-06-12";

vi.useFakeTimers();
vi.setSystemTime(new Date(TODAY));

const APPROVED = (id: string, memberId: string, start: string, end: string): LeaveRequest => ({
  id,
  memberId,
  type: "vacation",
  startDate: start,
  endDate: end,
  status: "approved",
  submittedAt: TODAY,
});

const PENDING = (id: string, memberId: string, start: string): LeaveRequest => ({
  id,
  memberId,
  type: "vacation",
  startDate: start,
  endDate: start,
  status: "pending",
  submittedAt: TODAY,
});

describe("DashboardStats", () => {
  it("renders all three stat cards", () => {
    render(<DashboardStats requests={[]} />);
    expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    expect(screen.getByText("Out Today")).toBeInTheDocument();
    expect(screen.getByText("Starting This Week")).toBeInTheDocument();
  });

  it("shows 0 pending approvals when there are none", () => {
    const requests = [APPROVED("a1", "1", "2026-06-10", "2026-06-11")];
    render(<DashboardStats requests={requests} />);
    // Scope to the Pending Approvals card to avoid matching other "0" values
    const card = screen.getByText("Pending Approvals").closest("[data-slot=card]")!;
    expect(within(card).getByText("0")).toBeInTheDocument();
    expect(screen.getByText("All caught up!")).toBeInTheDocument();
  });

  it("counts pending approvals correctly", () => {
    const requests = [PENDING("p1", "1", "2026-06-15"), PENDING("p2", "2", "2026-06-16")];
    render(<DashboardStats requests={requests} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("2 requests waiting")).toBeInTheDocument();
  });

  it("shows singular 'request' for exactly 1 pending", () => {
    render(<DashboardStats requests={[PENDING("p1", "1", "2026-06-15")]} />);
    expect(screen.getByText("1 request waiting")).toBeInTheDocument();
  });

  it("counts members out today correctly", () => {
    const requests = [
      // spans today (2026-06-12)
      APPROVED("a1", "1", "2026-06-10", "2026-06-13"),
      APPROVED("a2", "2", "2026-06-12", "2026-06-12"),
      // doesn't span today
      APPROVED("a3", "3", "2026-06-13", "2026-06-15"),
    ];
    render(<DashboardStats requests={requests} />);
    // "Out Today" card shows "2/5"
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it("shows 'No upcoming leave' when nothing starts this week", () => {
    render(<DashboardStats requests={[]} />);
    expect(screen.getByText("No upcoming leave")).toBeInTheDocument();
  });
});
