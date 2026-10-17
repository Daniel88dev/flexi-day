import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GroupEventGroup, GroupEventRow, RepeatRule } from "@/lib/api/group-events";
import { ApiError } from "@/lib/api/client";
import { renderWithClient } from "@/lib/test-utils";
import {
  closeGroupEventSheet,
  confirmGroupEventDelete,
  openGroupEventEditor,
  openGroupEventSheet,
} from "@/lib/group-events/sheet-store";

const groupsMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const impactMock = vi.fn();
vi.mock("@/lib/api/group-events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/group-events")>()),
  listGroupEventGroups: (...args: unknown[]) => groupsMock(...args),
  createGroupEvent: (...args: unknown[]) => createMock(...args),
  updateGroupEvent: (...args: unknown[]) => updateMock(...args),
  deleteGroupEvent: (...args: unknown[]) => deleteMock(...args),
  groupEventImpact: (...args: unknown[]) => impactMock(...args),
}));

import { GroupEventSheetHost } from "../group-event-sheet-host";

const GROUPS: GroupEventGroup[] = [
  { groupId: "g-1", groupName: "Dev Team", canCreate: true },
  { groupId: "g-2", groupName: "Design", canCreate: true },
  { groupId: "g-3", groupName: "Free crew", canCreate: false },
];

const weekly = (weekdays: number[]): RepeatRule => ({
  freq: "weekly",
  interval: 1,
  weekdays,
  monthlyMode: null,
  until: null,
});

const STANDUP: GroupEventRow = {
  id: "ge-1",
  groupId: "g-1",
  groupName: "Dev Team",
  title: "Standup",
  note: null,
  startDate: "2026-10-05",
  endDate: "2026-10-05",
  startTime: "09:30",
  endTime: "09:45",
  repeat: weekly([0]),
  skippedDates: [],
  recurringEventId: null,
  originalDate: null,
  createdBy: null,
  canEdit: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const OFFSITE: GroupEventRow = {
  ...STANDUP,
  id: "ge-2",
  title: "Offsite",
  startDate: "2026-11-02",
  endDate: "2026-11-04",
  startTime: null,
  endTime: null,
  repeat: null,
};

const WRITE = { droppedOneOffs: 0, events: [], deletedIds: [] };

function setup() {
  return { user: userEvent.setup(), ...renderWithClient(<GroupEventSheetHost />) };
}

function sheet() {
  return screen.getByRole("dialog");
}

beforeEach(() => {
  groupsMock.mockReset().mockResolvedValue(GROUPS);
  createMock.mockReset();
  updateMock.mockReset().mockResolvedValue(WRITE);
  deleteMock.mockReset().mockResolvedValue(WRITE);
  impactMock.mockReset().mockResolvedValue({ droppedOneOffs: 0 });
});

afterEach(() => act(() => closeGroupEventSheet()));

describe("GroupEventSheetHost, creating", () => {
  it("creates a weekly group event and previews the six dates it lands on", async () => {
    const created = { ...STANDUP, id: "ge-9", title: "Retro" };
    createMock.mockResolvedValue(created);
    const onCreated = vi.fn();
    const { user } = setup();
    act(() => openGroupEventSheet({ date: "2026-10-21", groupId: "g-2", onCreated }));

    expect(within(sheet()).getByRole("heading", { name: "New group event" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Title"), "Retro");
    await user.click(screen.getByRole("combobox", { name: "Repeat" }));
    await user.click(screen.getByRole("option", { name: "Weekly" }));
    await user.click(screen.getByRole("button", { name: "Fri" }));

    const preview = screen.getByRole("list", { name: "Next dates" });
    expect(
      within(preview)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual(["Wed 21 Oct", "Fri 23 Oct", "Wed 28 Oct", "Fri 30 Oct", "Wed 4 Nov", "Fri 6 Nov"]);

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(createMock).toHaveBeenCalledWith({
      groupId: "g-2",
      title: "Retro",
      note: null,
      startDate: "2026-10-21",
      endDate: "2026-10-21",
      startTime: null,
      endTime: null,
      repeat: { ...weekly([2, 4]) },
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("lists only the groups that can create and falls back to the first of them", async () => {
    const { user } = setup();
    act(() => openGroupEventSheet({ date: "2026-10-21", groupId: "g-3" }));

    const select = await screen.findByRole("combobox", { name: "Group" });
    await waitFor(() => expect(select).toHaveTextContent("Dev Team"));
    await user.click(select);
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Dev Team", "Design"]);
  });

  it("names the group as plain text when only one can create", async () => {
    groupsMock.mockResolvedValue([GROUPS[0], GROUPS[2]]);
    setup();
    act(() => openGroupEventSheet({ date: "2026-10-21" }));

    expect(await within(sheet()).findByText("Dev Team")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Group" })).not.toBeInTheDocument();
  });

  it("turns repeat off and disables it once the event runs over more than one day", async () => {
    const { user } = setup();
    act(() => openGroupEventSheet({ date: "2026-10-21" }));
    await user.click(screen.getByRole("combobox", { name: "Repeat" }));
    await user.click(screen.getByRole("option", { name: "Daily" }));

    fireEvent.change(screen.getByLabelText("Until"), { target: { value: "2026-10-23" } });

    expect(screen.getByRole("combobox", { name: "Repeat" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Repeat" })).toHaveTextContent("Does not repeat");
    expect(screen.getByText("A recurring group event lasts one day")).toBeInTheDocument();
    expect(screen.getByLabelText("From")).toHaveValue("2026-10-21");
  });

  it("shows a plan message inline when the group lost its paid plan", async () => {
    createMock.mockRejectedValue(
      new ApiError(402, "Payment required", undefined, [
        {
          message: "Payment required",
          context: { reason: "PLAN_LIMIT", code: "GROUP_EVENTS_PLAN_REQUIRED" },
        },
      ])
    );
    const { user } = setup();
    act(() => openGroupEventSheet({ date: "2026-10-21", groupId: "g-1" }));
    await waitFor(() => expect(groupsMock).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Title"), "Retro");

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("This group isn't on a paid plan, so it can't take new group events.")
    ).toBeInTheDocument();
    expect(sheet()).toBeInTheDocument();
    await waitFor(() => expect(groupsMock).toHaveBeenCalledTimes(2));
  });

  it("keeps Create disabled until the group event has a title", async () => {
    setup();
    act(() => openGroupEventSheet({ date: "2026-10-21" }));
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });
});

describe("GroupEventSheetHost, editing", () => {
  it("saves a one-off without asking which dates", async () => {
    const { user } = setup();
    act(() => openGroupEventEditor({ event: OFFSITE, occurrenceDate: "2026-11-02" }));

    expect(within(sheet()).getByRole("heading", { name: "Edit group event" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Team offsite");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock).toHaveBeenCalledWith("ge-2", {
      changes: expect.objectContaining({ title: "Team offsite", startDate: "2026-11-02" }),
    });
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("asks which dates a recurring save applies to and sends the choice", async () => {
    const { user } = setup();
    act(() => openGroupEventEditor({ event: STANDUP, occurrenceDate: "2026-10-12" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Daily sync");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const scope = await screen.findByRole("alertdialog");
    expect(within(scope).getByRole("heading", { name: "Change “Standup”" })).toBeInTheDocument();
    expect(within(scope).getByRole("radio", { name: /This event/ })).toBeChecked();
    expect(within(scope).getByRole("radio", { name: /This event/ })).toBeEnabled();
    expect(within(scope).getByText("Only Mon 12 Oct")).toBeInTheDocument();

    await user.click(within(scope).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("ge-1", {
        scope: "this",
        occurrenceDate: "2026-10-12",
        changes: expect.objectContaining({ title: "Daily sync", startDate: "2026-10-12" }),
      })
    );
    expect(impactMock).not.toHaveBeenCalled();
  });

  it("disables This event when the rule changed and names the one-off changes it drops", async () => {
    impactMock.mockResolvedValue({ droppedOneOffs: 2 });
    const { user } = setup();
    act(() => openGroupEventEditor({ event: STANDUP, occurrenceDate: "2026-10-12" }));
    await user.click(screen.getByRole("button", { name: "Wed" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const scope = await screen.findByRole("alertdialog");
    const thisEvent = within(scope).getByRole("radio", { name: /This event/ });
    expect(thisEvent).toBeDisabled();
    expect(
      within(scope).getByText("A new repeat rule can't apply to one date")
    ).toBeInTheDocument();
    expect(within(scope).getByRole("radio", { name: /This and following/ })).toBeChecked();

    await user.click(within(scope).getByRole("radio", { name: /All events/ }));

    expect(
      await within(scope).findByText(
        "2 changes made to single dates will be lost, deleted dates included."
      )
    ).toBeInTheDocument();
    expect(impactMock).toHaveBeenLastCalledWith("ge-1", {
      scope: "all",
      occurrenceDate: "2026-10-12",
      changes: expect.objectContaining({ repeat: weekly([0, 2]) }),
    });

    await user.click(within(scope).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        "ge-1",
        expect.objectContaining({ scope: "all", occurrenceDate: "2026-10-12" })
      )
    );
  });
});

describe("GroupEventSheetHost, deleting", () => {
  it("asks a plain confirm for a one-off and says there is no undo", async () => {
    const { user } = setup();
    act(() => confirmGroupEventDelete({ event: OFFSITE, occurrenceDate: "2026-11-02" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Delete “Offsite”?" })).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "It leaves every calendar, .ics feeds and synced Google or Microsoft calendars included. This can't be undone."
      )
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("ge-2", {}));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("asks which dates for a recurring group event and deletes the choice", async () => {
    const { user } = setup();
    act(() => confirmGroupEventDelete({ event: STANDUP, occurrenceDate: "2026-10-19" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("radio", { name: /This and following/ }));
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(deleteMock).toHaveBeenCalledWith("ge-1", {
        scope: "following",
        occurrenceDate: "2026-10-19",
      })
    );
  });
});
