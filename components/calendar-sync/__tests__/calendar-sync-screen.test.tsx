import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

const noopMutation = { mutateAsync: vi.fn(), isPending: false };
const state = {
  configs: { data: [], isLoading: false, isError: false },
};

vi.mock("@/lib/api/queries", () => ({
  useCalendarSyncs: () => state.configs,
  useGroups: () => ({ data: [] }),
  useVacations: () => ({ data: [] }),
  useCreateCalendarSync: () => noopMutation,
  useUpdateCalendarSync: () => noopMutation,
  useDeleteCalendarSync: () => noopMutation,
  useRegenerateCalendarSyncToken: () => noopMutation,
}));

import { CalendarSyncScreen } from "../calendar-sync-screen";

describe("CalendarSyncScreen", () => {
  it("renders the heading and empty state, and opens the builder", () => {
    render(<CalendarSyncScreen />);
    expect(screen.getByText("Your calendars")).toBeInTheDocument();
    expect(screen.getByText("No calendars yet")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create your first calendar"));
    expect(screen.getByText("New calendar")).toBeInTheDocument();
  });
});
