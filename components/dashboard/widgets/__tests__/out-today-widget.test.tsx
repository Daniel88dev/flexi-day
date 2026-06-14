import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OutTodayWidget } from "../out-today-widget";
import { VacationKind, type VacationListItem } from "@/lib/api/types";

function buildVacation(overrides: Partial<VacationListItem>): VacationListItem {
  return {
    id: "v",
    userId: "u-1",
    groupId: "g-1",
    requestedDay: "2026-06-13",
    startTime: null,
    endTime: null,
    vacationType: VacationKind.Vacation,
    note: null,
    rejectionReason: null,
    approvedAt: "2026-06-10T00:00:00Z",
    approvedBy: "u-mgr",
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    createdAt: "2026-06-10T00:00:00Z",
    updatedAt: "2026-06-10T00:00:00Z",
    user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" },
    ...overrides,
  };
}

describe("OutTodayWidget", () => {
  it("renders the heading and notes another-month view when todayDay is null", () => {
    render(<OutTodayWidget vacations={[]} todayDay={null} />);
    expect(screen.getByText("Out today")).toBeInTheDocument();
    expect(screen.getByText(/Viewing another month/i)).toBeInTheDocument();
  });

  it("lists approved users whose requestedDay matches today", () => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayDay = Number(todayIso.slice(8, 10));
    const vacations = [buildVacation({ requestedDay: todayIso })];
    render(<OutTodayWidget vacations={vacations} todayDay={todayDay} />);
    expect(screen.getByText("Dana Holt")).toBeInTheDocument();
    expect(screen.getByText(/1 away/i)).toBeInTheDocument();
  });
});
