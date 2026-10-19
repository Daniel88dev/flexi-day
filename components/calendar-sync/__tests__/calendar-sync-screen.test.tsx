import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CalendarRecordType, type Group } from "@/lib/api/types";
import type { CalendarSyncConfig } from "@/lib/api/calendar-sync";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/calendar-sync/",
  useRouter: () => ({ replace: vi.fn() }),
}));

const noopMutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
const startMutation = { mutate: vi.fn(), isPending: false };
const disconnectMutation = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };
const state: {
  configs: { data: CalendarSyncConfig[]; isLoading: boolean; isError: boolean };
  groups: Group[];
} = {
  configs: { data: [], isLoading: false, isError: false },
  groups: [],
};

vi.mock("@/lib/api/queries", () => ({
  useCalendarSyncs: () => state.configs,
  useCalendarConnections: () => ({
    data: { providers: { google: true, microsoft: false }, connections: [] },
  }),
  useGroups: () => ({ data: state.groups }),
  useVacations: () => ({ data: [] }),
  useCreateCalendarSync: () => noopMutation,
  useUpdateCalendarSync: () => noopMutation,
  useDeleteCalendarSync: () => noopMutation,
  useRegenerateCalendarSyncToken: () => noopMutation,
  useStartCalendarConnection: () => startMutation,
  useDisconnectCalendar: () => disconnectMutation,
  useSetCalendarTarget: () => noopMutation,
  useSyncCalendarNow: () => noopMutation,
}));

import { CalendarSyncScreen } from "../calendar-sync-screen";

function config(target: CalendarSyncConfig["target"]): CalendarSyncConfig {
  return {
    id: "cfg-1",
    name: "My time off",
    scope: "ME",
    distinguishMine: false,
    timeZone: "Europe/Prague",
    includeGroupEvents: false,
    groupEventsColor: null,
    includeBirthdays: false,
    birthdaysColor: null,
    teamIds: [],
    types: [
      { type: CalendarRecordType.Vacation, label: "Vacation", color: "violet", mineColor: null },
    ],
    feedUrl: "https://api.example.test/feed.ics",
    tokenMasked: true,
    lastFetchedAt: null,
    target,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  state.configs = { data: [], isLoading: false, isError: false };
  state.groups = [];
  startMutation.mutate.mockReset();
  disconnectMutation.mutateAsync.mockClear();
  window.sessionStorage.clear();
});

describe("CalendarSyncScreen", () => {
  it("renders the heading and empty state, and opens the builder", () => {
    render(<CalendarSyncScreen />);
    expect(screen.getByText("Your calendars")).toBeInTheDocument();
    expect(screen.getByText("No calendars yet")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create your first calendar"));
    expect(screen.getByText("New calendar")).toBeInTheDocument();
  });

  it("offers only the enabled provider and starts its consent round", () => {
    state.configs.data = [config(null)];
    render(<CalendarSyncScreen />);

    expect(screen.queryByRole("button", { name: "Connect Microsoft" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connect Google" }));
    expect(startMutation.mutate).toHaveBeenCalledWith(
      { provider: "google", configId: "cfg-1" },
      expect.any(Object)
    );
    expect(window.sessionStorage.getItem("flexi-day.calendar-connect-provider")).toBe("google");
  });

  it("keeps Connect disabled once the consent round has started", () => {
    state.configs.data = [config(null)];
    startMutation.mutate.mockImplementation((_vars, opts: { onSuccess: () => void }) =>
      opts.onSuccess()
    );
    render(<CalendarSyncScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Connect Google" }));
    expect(screen.getByRole("button", { name: "Connect Google" })).toBeDisabled();
  });

  it("enables Connect again when Back restores the page from the bfcache", () => {
    state.configs.data = [config(null)];
    startMutation.mutate.mockImplementation((_vars, opts: { onSuccess: () => void }) =>
      opts.onSuccess()
    );
    render(<CalendarSyncScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Connect Google" }));

    const restored = new Event("pageshow") as PageTransitionEvent;
    Object.defineProperty(restored, "persisted", { value: true });
    act(() => {
      window.dispatchEvent(restored);
    });
    expect(screen.getByRole("button", { name: "Connect Google" })).toBeEnabled();
  });

  it("confirms before disconnecting the provider", async () => {
    state.configs.data = [
      config({
        provider: "GOOGLE",
        status: "ACTIVE",
        capability: "STATUS",
        timeZone: "Europe/Prague",
        lastSyncedAt: null,
        lastError: null,
        syncing: false,
      }),
    ];
    render(<CalendarSyncScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Sync actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(screen.getByText("Disconnect from Google?")).toBeInTheDocument();
    expect(disconnectMutation.mutateAsync).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(disconnectMutation.mutateAsync).toHaveBeenCalledWith("google");
  });

  it("tells the disconnect dialog how many calendars the provider syncs", () => {
    const target = {
      provider: "GOOGLE" as const,
      status: "ACTIVE" as const,
      capability: "STATUS" as const,
      timeZone: "Europe/Prague",
      lastSyncedAt: null,
      lastError: null,
      syncing: false,
    };
    state.configs.data = [config(target), { ...config(target), id: "cfg-2", name: "Sick days" }];
    render(<CalendarSyncScreen />);

    fireEvent.click(screen.getAllByRole("button", { name: "Sync actions" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(
      screen.getByText(/wrote to the 2 calendars synced through this Google account/)
    ).toBeInTheDocument();
  });

  it("no longer shows the old coming-soon block", () => {
    state.configs.data = [config(null)];
    render(<CalendarSyncScreen />);
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  describe("the team count on a feed whose owner left one of its groups", () => {
    const qa = { id: "qa", groupName: "QA Team" } as Group;
    const dev = { id: "dev", groupName: "Dev Team" } as Group;
    const teamFeed = (teamIds: string[]): CalendarSyncConfig => ({
      ...config(null),
      scope: "TEAM",
      teamIds,
    });

    it("names the one selected group the owner is still in", () => {
      state.groups = [qa, dev];
      state.configs.data = [teamFeed(["qa", "left"])];
      render(<CalendarSyncScreen />);

      expect(screen.getByText("Team records · QA Team")).toBeInTheDocument();
    });

    it("names the group when the owner is in only that one", () => {
      state.groups = [qa];
      state.configs.data = [teamFeed(["qa", "left"])];
      render(<CalendarSyncScreen />);

      expect(screen.getByText("Team records · QA Team")).toBeInTheDocument();
    });

    it("says all teams when the live groups are all selected", () => {
      state.groups = [qa, dev];
      state.configs.data = [teamFeed(["qa", "dev", "left"])];
      render(<CalendarSyncScreen />);

      expect(screen.getByText("Team records · All teams")).toBeInTheDocument();
    });
  });
});
