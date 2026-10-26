import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  addDirectoryListEntry,
  deleteDirectoryListEntry,
  getDirectoryList,
  updateDirectoryListEntry,
} from "../directory-lists";

describe("directory lists API", () => {
  beforeEach(() => apiMock.mockReset());

  it("reads a list, naming countries in the requested language", async () => {
    apiMock.mockResolvedValue({ entries: [] });
    await getDirectoryList("org 1", "locations", "cs");
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org%201/locations?language=cs");
  });

  it("adds an entry", async () => {
    apiMock.mockResolvedValue({ id: "d1" });
    await addDirectoryListEntry("org-1", "departments", { name: "Support" });
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/departments", {
      method: "POST",
      body: { name: "Support" },
    });
  });

  it("renames, archives or restores an entry", async () => {
    apiMock.mockResolvedValue({ id: "l1" });
    await updateDirectoryListEntry("org-1", "locations", "l 1", { archived: true }, "en");
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/locations/l%201?language=en", {
      method: "PATCH",
      body: { archived: true },
    });
  });

  it("deletes an entry", async () => {
    apiMock.mockResolvedValue(undefined);
    await deleteDirectoryListEntry("org-1", "departments", "d1");
    expect(apiMock).toHaveBeenCalledWith("/api/directory/org-1/departments/d1", {
      method: "DELETE",
    });
  });
});
