import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import MyAttendancePage from "../page";

let search = "";
let mounts = 0;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

vi.mock("@/components/attendance/my-attendance-screen", () => ({
  MyAttendanceScreen: ({ linkedDate }: { linkedDate: string | null }) => {
    const [mount] = useState(() => ++mounts);
    return (
      <div data-testid="screen" data-mount={mount}>
        {linkedDate ?? "none"}
      </div>
    );
  },
}));

describe("MyAttendancePage", () => {
  beforeEach(() => {
    search = "";
    mounts = 0;
  });

  it("hands ?date= to the screen as the linked date", () => {
    search = "date=2026-09-08";
    render(<MyAttendancePage />);

    expect(screen.getByTestId("screen")).toHaveTextContent("2026-09-08");
  });

  it("hands no linked date when the URL has none", () => {
    render(<MyAttendancePage />);

    expect(screen.getByTestId("screen")).toHaveTextContent("none");
  });

  it("remounts the screen when a new link changes the date", () => {
    search = "date=2026-09-08";
    const { rerender } = render(<MyAttendancePage />);
    expect(screen.getByTestId("screen")).toHaveAttribute("data-mount", "1");

    search = "date=2026-09-15";
    rerender(<MyAttendancePage />);

    expect(screen.getByTestId("screen")).toHaveTextContent("2026-09-15");
    expect(screen.getByTestId("screen")).toHaveAttribute("data-mount", "2");
  });
});
