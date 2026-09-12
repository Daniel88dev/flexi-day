import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { NO_SESSION_LOCATION, renderWithClient } from "@/lib/test-utils";
import type { AttendanceSession } from "@/lib/api/attendance";
import { SessionLocation } from "../session-location";

const session = (overrides: Partial<AttendanceSession> = {}): AttendanceSession => ({
  id: "session-1",
  businessDate: "2026-09-11",
  startedAt: "2026-09-11T06:00:00Z",
  endedAt: "2026-09-11T14:00:00Z",
  timezone: "Europe/Prague",
  closedBy: "USER",
  open: false,
  ...NO_SESSION_LOCATION,
  breaks: [],
  ...overrides,
});

describe("SessionLocation", () => {
  it("shows the coordinates and the accuracy of each end", () => {
    renderWithClient(
      <SessionLocation
        session={session({
          startLatitude: 50.075538,
          startLongitude: 14.437801,
          startAccuracy: 12.4,
          endLatitude: 50.09,
          endLongitude: 14.45,
          endAccuracy: 30,
        })}
      />
    );

    expect(screen.getByText("50.0755, 14.4378 ±12 m")).toBeInTheDocument();
    expect(screen.getByText("50.0900, 14.4500 ±30 m")).toBeInTheDocument();
  });

  it("leaves a missing fix as an empty cell, not a flag", () => {
    renderWithClient(<SessionLocation session={session()} />);

    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("fills only the end that answered", () => {
    renderWithClient(
      <SessionLocation
        session={session({ startLatitude: 50.0755, startLongitude: 14.4378, startAccuracy: 8 })}
      />
    );

    expect(screen.getByText("50.0755, 14.4378 ±8 m")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(1);
  });

  it("shows the coordinates without an accuracy the browser never reported", () => {
    renderWithClient(
      <SessionLocation
        session={session({ startLatitude: 50.0755, startLongitude: 14.4378, startAccuracy: null })}
      />
    );

    expect(screen.getByText("50.0755, 14.4378")).toBeInTheDocument();
  });
});
