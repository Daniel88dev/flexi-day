import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryList, DirectoryListKind } from "@/lib/api/directory-lists";
import { DirectoryListsPanel } from "../directory-lists-panel";

const add = vi.fn();
const update = vi.fn();
const remove = vi.fn();
let lists: Record<DirectoryListKind, DirectoryList>;
let failure: unknown = null;

vi.mock("@/lib/api/queries", () => ({
  useDirectoryList: (_org: string, kind: DirectoryListKind) => ({
    data: lists[kind],
    isLoading: false,
    error: null,
  }),
  useAddDirectoryListEntry: (_org: string, kind: DirectoryListKind) => ({
    mutate: (...args: unknown[]) => add(kind, ...args),
    isPending: false,
    error: failure,
  }),
  useUpdateDirectoryListEntry: (_org: string, kind: DirectoryListKind) => ({
    mutate: (...args: unknown[]) => update(kind, ...args),
    isPending: false,
    error: null,
  }),
  useDeleteDirectoryListEntry: (_org: string, kind: DirectoryListKind) => ({
    mutate: (...args: unknown[]) => remove(kind, ...args),
    isPending: false,
    error: null,
  }),
}));

const departments = (editable: boolean, writable: boolean): DirectoryList => ({
  editable,
  writable,
  entries: [
    { id: "d-sales", name: "Sales", archived: true, ...(editable && { inUse: true }) },
    { id: "d-support", name: "Support", archived: false, ...(editable && { inUse: true }) },
    { id: "d-legal", name: "Legal", archived: false, ...(editable && { inUse: false }) },
  ],
});

const locations = (editable: boolean, writable: boolean): DirectoryList => ({
  editable,
  writable,
  entries: [
    {
      id: "l-berlin",
      name: "Berlin",
      archived: false,
      country: { code: "DE", name: "Germany" },
      ...(editable && { inUse: false }),
    },
  ],
});

const entry = (id: string) => within(screen.getByTestId(`list-entry-${id}`));

describe("DirectoryListsPanel", () => {
  beforeEach(() => {
    add.mockReset();
    update.mockReset();
    remove.mockReset();
    failure = null;
    lists = { departments: departments(true, true), locations: locations(true, true) };
  });

  it("adds a department and a location with its country", async () => {
    renderWithClient(<DirectoryListsPanel organizationId="org-1" />);

    await userEvent.type(screen.getByLabelText("New department"), "  Finance ");
    await userEvent.click(screen.getAllByRole("button", { name: "Add" })[0]!);
    expect(add).toHaveBeenCalledWith("departments", { name: "Finance" }, expect.anything());

    await userEvent.type(screen.getByLabelText("New location"), "Prague");
    await userEvent.selectOptions(screen.getByLabelText("Country"), "CZ");
    await userEvent.click(screen.getAllByRole("button", { name: "Add" })[1]!);
    expect(add).toHaveBeenCalledWith(
      "locations",
      { name: "Prague", country: "CZ" },
      expect.anything()
    );
    expect(entry("l-berlin").getByText("Germany")).toBeInTheDocument();
  });

  it("deletes only an entry nobody holds, and archives or restores the others", async () => {
    renderWithClient(<DirectoryListsPanel organizationId="org-1" />);

    expect(entry("d-support").getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(entry("d-support").getByText("In use")).toBeInTheDocument();
    await userEvent.click(entry("d-legal").getByRole("button", { name: "Delete" }));
    expect(remove).toHaveBeenCalledWith("departments", "d-legal");

    await userEvent.click(entry("d-support").getByRole("button", { name: "Archive" }));
    expect(update).toHaveBeenCalledWith("departments", {
      entryId: "d-support",
      change: { archived: true },
    });
    expect(entry("d-sales").getByText("Archived")).toBeInTheDocument();
    await userEvent.click(entry("d-sales").getByRole("button", { name: "Restore" }));
    expect(update).toHaveBeenCalledWith("departments", {
      entryId: "d-sales",
      change: { archived: false },
    });
  });

  it("renames an entry", async () => {
    renderWithClient(<DirectoryListsPanel organizationId="org-1" />);

    await userEvent.click(entry("d-support").getByRole("button", { name: "Rename" }));
    const input = screen.getByLabelText("New name for Support");
    await userEvent.clear(input);
    await userEvent.type(input, "Customer support");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(update).toHaveBeenCalledWith("departments", {
      entryId: "d-support",
      change: { name: "Customer support" },
    });
  });

  it("disables adding and restoring on a lapsed plan, and keeps rename, archive and delete", () => {
    lists = { departments: departments(true, false), locations: locations(true, false) };
    renderWithClient(<DirectoryListsPanel organizationId="org-1" />);

    expect(screen.getAllByText(/but not add new ones/)).toHaveLength(2);
    expect(screen.getByLabelText("New department")).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "Add" })) {
      expect(button).toBeDisabled();
    }
    expect(entry("d-sales").getByRole("button", { name: "Restore" })).toBeDisabled();
    expect(entry("d-support").getByRole("button", { name: "Archive" })).toBeEnabled();
    expect(entry("d-support").getByRole("button", { name: "Rename" })).toBeEnabled();
    expect(entry("d-legal").getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("shows anyone without the act cell the lists read-only", () => {
    lists = { departments: departments(false, true), locations: locations(false, true) };
    renderWithClient(<DirectoryListsPanel organizationId="org-1" />);

    expect(screen.getAllByText(/Only people allowed to manage/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByLabelText("New department")).toBeNull();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("explains a refusal by its code", () => {
    failure = new ApiError(409, "Conflict", undefined, [
      { message: "x", context: { code: "NAME_TAKEN" } },
    ]);
    renderWithClient(<DirectoryListsPanel organizationId="org-1" />);

    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "The list already has an entry with this name."
    );
  });
});
