import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { fetchers, mockFunctions, uploadToTargetMock } = vi.hoisted(() => {
  const fetchers: Record<string, Mock> = {};
  const mockFunctions = (module: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(module).map(([name, value]) => {
        if (typeof value !== "function" || name === "withLanguage") return [name, value];
        fetchers[name] ??= vi.fn();
        return [name, (...args: unknown[]) => fetchers[name](...args)];
      })
    );
  return { fetchers, mockFunctions, uploadToTargetMock: vi.fn() };
});

vi.mock("../directory", async (importOriginal) =>
  mockFunctions(await importOriginal<typeof import("../directory")>())
);
vi.mock("../directory-lists", async (importOriginal) =>
  mockFunctions(await importOriginal<typeof import("../directory-lists")>())
);
vi.mock("../attachment-upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../attachment-upload")>()),
  uploadToTarget: (...args: unknown[]) => uploadToTargetMock(...args),
}));

import {
  qk,
  useAcceptDirectoryAgreement,
  useAddDirectoryListEntry,
  useChangeWorkerType,
  useCheckDirectoryEmail,
  useCopyFromPreviousSpell,
  useCreateDirectoryPerson,
  useDeleteAllDirectoryData,
  useDeleteDirectoryListEntry,
  useDirectoryChecklist,
  useDirectoryGeneralSettings,
  useDirectoryList,
  useDirectoryOrganizations,
  useDirectoryPeople,
  useDirectoryProfile,
  useDirectoryRoles,
  useDirectoryState,
  useDisableDirectory,
  useEnableDirectory,
  useEndPreview,
  useFormerDirectoryPeople,
  useHideDirectoryChecklist,
  usePermissionHistory,
  usePermissionTable,
  usePreviousSpell,
  useProfileHistory,
  useReadLog,
  useRemoveProfilePhoto,
  useRetentionPreview,
  useRetentionSettings,
  useSendDirectoryInvite,
  useSetDirectoryRoles,
  useSetRetentionHold,
  useUpdateDirectoryGeneralSettings,
  useUpdateDirectoryListEntry,
  useUpdateDirectoryProfile,
  useUpdatePermissionCell,
  useUpdateRetentionPeriod,
  useUploadProfilePhoto,
} from "../queries";

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapperFor =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

const answer = { answer: true };

beforeEach(() => {
  for (const mock of Object.values(fetchers)) {
    mock.mockReset();
    mock.mockResolvedValue(answer);
  }
  uploadToTargetMock.mockReset();
});

type QueryCase = {
  name: string;
  useHook: () => unknown;
  fetcher: string;
  /** Null for a fetcher TanStack calls with its query context. */
  args: unknown[] | null;
  key: readonly unknown[];
};

const queryCases: QueryCase[] = [
  {
    name: "useDirectoryState",
    useHook: () => useDirectoryState("org-1"),
    fetcher: "getDirectoryState",
    args: ["org-1"],
    key: qk.directoryState("org-1"),
  },
  {
    name: "useDirectoryOrganizations",
    useHook: () => useDirectoryOrganizations(),
    fetcher: "listDirectoryOrganizations",
    args: null,
    key: qk.directoryOrganizations(),
  },
  {
    name: "useDirectoryPeople",
    useHook: () => useDirectoryPeople("org-1"),
    fetcher: "listDirectoryPeople",
    args: ["org-1"],
    key: qk.directoryPeople("org-1"),
  },
  {
    name: "useFormerDirectoryPeople",
    useHook: () => useFormerDirectoryPeople("org-1", true),
    fetcher: "listFormerDirectoryPeople",
    args: ["org-1"],
    key: qk.directoryFormer("org-1"),
  },
  {
    name: "useDirectoryProfile",
    useHook: () => useDirectoryProfile("org-1", "emp-1"),
    fetcher: "getDirectoryProfile",
    args: ["org-1", "emp-1", "en"],
    key: ["directory", "profile", "org-1", "emp-1", "en"],
  },
  {
    name: "useProfileHistory",
    useHook: () => useProfileHistory("org-1", "emp-1", true),
    fetcher: "getProfileHistory",
    args: ["org-1", "emp-1"],
    key: qk.directoryProfileHistory("org-1", "emp-1"),
  },
  {
    name: "useEndPreview",
    useHook: () => useEndPreview("org-1", "emp-1", true),
    fetcher: "getEndPreview",
    args: ["org-1", "emp-1"],
    key: qk.directoryEndPreview("org-1", "emp-1"),
  },
  {
    name: "usePreviousSpell",
    useHook: () => usePreviousSpell("org-1", "emp-1", true),
    fetcher: "getPreviousSpell",
    args: ["org-1", "emp-1"],
    key: qk.directoryPreviousSpell("org-1", "emp-1"),
  },
  {
    name: "usePermissionTable",
    useHook: () => usePermissionTable("org-1", true),
    fetcher: "getPermissionTable",
    args: ["org-1"],
    key: qk.directoryPermissions("org-1"),
  },
  {
    name: "usePermissionHistory",
    useHook: () => usePermissionHistory("org-1", true),
    fetcher: "getPermissionHistory",
    args: ["org-1"],
    key: ["directory", "permission-history", "org-1"],
  },
  {
    name: "useDirectoryChecklist",
    useHook: () => useDirectoryChecklist("org-1", true),
    fetcher: "getDirectoryChecklist",
    args: ["org-1"],
    key: qk.directoryChecklist("org-1"),
  },
  {
    name: "useDirectoryRoles",
    useHook: () => useDirectoryRoles("org-1", true),
    fetcher: "getDirectoryRoles",
    args: ["org-1"],
    key: qk.directoryRoles("org-1"),
  },
  {
    name: "useDirectoryGeneralSettings",
    useHook: () => useDirectoryGeneralSettings("org-1", true),
    fetcher: "getDirectoryGeneralSettings",
    args: ["org-1"],
    key: qk.directoryGeneralSettings("org-1"),
  },
  {
    name: "useRetentionSettings",
    useHook: () => useRetentionSettings("org-1", true),
    fetcher: "getRetentionSettings",
    args: ["org-1"],
    key: qk.directoryRetention("org-1"),
  },
  {
    name: "useRetentionPreview",
    useHook: () => useRetentionPreview("org-1", { section: "JOB", period: "AT_END" }),
    fetcher: "getRetentionPreview",
    args: ["org-1", { section: "JOB", period: "AT_END" }],
    key: qk.directoryRetentionPreview("org-1", "JOB", "AT_END"),
  },
  {
    name: "useDirectoryList",
    useHook: () => useDirectoryList("org-1", "locations"),
    fetcher: "getDirectoryList",
    args: ["org-1", "locations", "en"],
    key: ["directory", "list", "org-1", "locations", "en"],
  },
];

describe.each(queryCases)("$name", ({ useHook, fetcher, args, key }) => {
  it("reads through its fetcher and caches the answer under its key", async () => {
    const client = newClient();
    const { result } = renderHook(() => useHook() as { isSuccess: boolean }, {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    if (args) expect(fetchers[fetcher]).toHaveBeenCalledWith(...args);
    else expect(fetchers[fetcher]).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(key)).toEqual(answer);
  });
});

describe("gated directory reads", () => {
  it.each([
    ["useDirectoryState without an organization", () => useDirectoryState(null)],
    ["useDirectoryPeople without an organization", () => useDirectoryPeople(null)],
    ["useFormerDirectoryPeople without formerList", () => useFormerDirectoryPeople("org-1", false)],
    ["useProfileHistory without canReadHistory", () => useProfileHistory("org-1", "emp-1", false)],
    ["useRetentionPreview without a change", () => useRetentionPreview("org-1", null)],
    ["useDirectoryList when disabled", () => useDirectoryList("org-1", "departments", false)],
    ["useReadLog when disabled", () => useReadLog("org-1", {}, false)],
  ])("should not fetch for %s", async (_label, useGated) => {
    const { result } = renderHook(() => useGated() as { fetchStatus: string }, {
      wrapper: wrapperFor(newClient()),
    });
    await Promise.resolve();
    expect(result.current.fetchStatus).toBe("idle");
    for (const mock of Object.values(fetchers)) expect(mock).not.toHaveBeenCalled();
  });
});

describe("useReadLog", () => {
  it("pages back from the newest row with nextBefore", async () => {
    fetchers.getReadLog
      .mockResolvedValueOnce({ entries: [], nextBefore: "r-5", people: [], readers: [] })
      .mockResolvedValueOnce({ entries: [], nextBefore: null, people: [], readers: [] });
    const { result } = renderHook(() => useReadLog("org-1", { employmentId: "emp-1" }, true), {
      wrapper: wrapperFor(newClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(fetchers.getReadLog.mock.calls).toEqual([
      ["org-1", { employmentId: "emp-1", before: undefined }],
      ["org-1", { employmentId: "emp-1", before: "r-5" }],
    ]);
    expect(result.current.hasNextPage).toBe(false);
  });
});

type Mutation = { mutateAsync: (input: never) => Promise<unknown> };

type MutationCase = {
  name: string;
  useHook: () => unknown;
  input: unknown;
  fetcher: string;
  args: unknown[];
  /** Keys the answer lands under. */
  sets?: readonly (readonly unknown[])[];
  invalidates?: readonly (readonly unknown[])[];
  removes?: readonly (readonly unknown[])[];
};

const profileKey = ["directory", "profile", "org-1", "emp-1", "en"] as const;

const mutationCases: MutationCase[] = [
  {
    name: "useSendDirectoryInvite",
    useHook: () => useSendDirectoryInvite("org-1", "emp-1"),
    input: "g-1",
    fetcher: "sendDirectoryInvite",
    args: ["org-1", "emp-1", "g-1"],
    invalidates: [["directory"]],
  },
  {
    name: "useCheckDirectoryEmail",
    useHook: () => useCheckDirectoryEmail("org-1"),
    input: "ada@example.com",
    fetcher: "checkDirectoryEmail",
    args: ["org-1", "ada@example.com"],
  },
  {
    name: "useCopyFromPreviousSpell",
    useHook: () => useCopyFromPreviousSpell("org-1", "emp-1"),
    input: ["contact"],
    fetcher: "copyFromPreviousSpell",
    args: ["org-1", "emp-1", ["contact"], "en"],
    sets: [profileKey],
    removes: [qk.directoryPreviousSpell("org-1", "emp-1")],
    invalidates: [["directory"]],
  },
  {
    name: "useChangeWorkerType",
    useHook: () => useChangeWorkerType("org-1", "emp-1"),
    input: "external",
    fetcher: "changeWorkerType",
    args: ["org-1", "emp-1", "external", "en"],
    sets: [profileKey],
    invalidates: [["directory"]],
  },
  {
    name: "useUpdateDirectoryProfile",
    useHook: () => useUpdateDirectoryProfile("org-1", "emp-1"),
    input: { card: { jobTitle: "Agent" } },
    fetcher: "updateDirectoryProfile",
    args: ["org-1", "emp-1", { card: { jobTitle: "Agent" } }, "en"],
    sets: [profileKey],
    invalidates: [["directory"]],
  },
  {
    name: "useHideDirectoryChecklist",
    useHook: () => useHideDirectoryChecklist("org-1"),
    input: undefined,
    fetcher: "hideDirectoryChecklist",
    args: ["org-1"],
    sets: [qk.directoryChecklist("org-1")],
  },
  {
    name: "useUpdatePermissionCell",
    useHook: () => useUpdatePermissionCell("org-1"),
    input: { row: "JOB", audience: "HR", value: "READ" },
    fetcher: "updatePermissionCell",
    args: ["org-1", { row: "JOB", audience: "HR", value: "READ" }],
    sets: [qk.directoryPermissions("org-1")],
    invalidates: [["directory"]],
  },
  {
    name: "useSetDirectoryRoles",
    useHook: () => useSetDirectoryRoles("org-1"),
    input: { employmentId: "emp-1", roles: ["HR"] },
    fetcher: "setDirectoryRoles",
    args: ["org-1", "emp-1", ["HR"]],
    sets: [qk.directoryRoles("org-1")],
    invalidates: [["directory"]],
  },
  {
    name: "useUpdateDirectoryGeneralSettings",
    useHook: () => useUpdateDirectoryGeneralSettings("org-1"),
    input: { cs: null },
    fetcher: "updateDirectoryGeneralSettings",
    args: ["org-1", { cs: null }],
    sets: [qk.directoryGeneralSettings("org-1")],
    invalidates: [["directory", "profile"]],
  },
  {
    name: "useUpdateRetentionPeriod",
    useHook: () => useUpdateRetentionPeriod("org-1"),
    input: { section: "CONTACT", period: "YEAR_1" },
    fetcher: "updateRetentionPeriod",
    args: ["org-1", { section: "CONTACT", period: "YEAR_1" }],
    sets: [qk.directoryRetention("org-1")],
    invalidates: [
      qk.directoryGeneralSettings("org-1"),
      ["directory", "profile"],
      ["directory", "former"],
      ["directory", "end-preview"],
    ],
  },
  {
    name: "useSetRetentionHold",
    useHook: () => useSetRetentionHold("org-1", "emp-1"),
    input: true,
    fetcher: "setRetentionHold",
    args: ["org-1", "emp-1", true],
    invalidates: [["directory"]],
  },
  {
    name: "useAddDirectoryListEntry",
    useHook: () => useAddDirectoryListEntry("org-1", "locations"),
    input: { name: "Brno", country: "CZ" },
    fetcher: "addDirectoryListEntry",
    args: ["org-1", "locations", { name: "Brno", country: "CZ" }, "en"],
    invalidates: [["directory"]],
  },
  {
    name: "useUpdateDirectoryListEntry",
    useHook: () => useUpdateDirectoryListEntry("org-1", "departments"),
    input: { entryId: "d-1", change: { archived: true } },
    fetcher: "updateDirectoryListEntry",
    args: ["org-1", "departments", "d-1", { archived: true }, "en"],
    invalidates: [["directory"]],
  },
  {
    name: "useDeleteDirectoryListEntry",
    useHook: () => useDeleteDirectoryListEntry("org-1", "departments"),
    input: "d-1",
    fetcher: "deleteDirectoryListEntry",
    args: ["org-1", "departments", "d-1"],
    invalidates: [["directory"]],
  },
  {
    name: "useRemoveProfilePhoto",
    useHook: () => useRemoveProfilePhoto("org-1", "emp-1"),
    input: undefined,
    fetcher: "removeProfilePhoto",
    args: ["org-1", "emp-1"],
    invalidates: [["directory"]],
  },
  {
    name: "useEnableDirectory",
    useHook: () => useEnableDirectory("org-1"),
    input: { agreementVersion: 1, tellMembers: false },
    fetcher: "enableDirectory",
    args: ["org-1", { agreementVersion: 1, tellMembers: false }],
    sets: [qk.directoryState("org-1")],
    invalidates: [["directory"]],
  },
  {
    name: "useDisableDirectory",
    useHook: () => useDisableDirectory("org-1"),
    input: undefined,
    fetcher: "disableDirectory",
    args: ["org-1"],
    sets: [qk.directoryState("org-1")],
    invalidates: [["directory"], qk.employments("org-1")],
  },
  {
    name: "useDeleteAllDirectoryData",
    useHook: () => useDeleteAllDirectoryData("org-1"),
    input: "Acme",
    fetcher: "deleteAllDirectoryData",
    args: ["org-1", "Acme"],
    sets: [qk.directoryState("org-1")],
    invalidates: [
      ["directory"],
      qk.employments("org-1"),
      qk.requestedExports("org-1"),
      qk.organizationExport("org-1"),
      qk.organization("org-1"),
    ],
  },
  {
    name: "useAcceptDirectoryAgreement",
    useHook: () => useAcceptDirectoryAgreement("org-1"),
    input: 2,
    fetcher: "acceptDirectoryAgreement",
    args: ["org-1", 2],
    sets: [qk.directoryState("org-1")],
    invalidates: [["directory"]],
  },
];

describe.each(mutationCases)(
  "$name",
  ({ useHook, input, fetcher, args, sets = [], invalidates = [], removes = [] }) => {
    it("writes through its fetcher and updates the cache", async () => {
      const client = newClient();
      const invalidate = vi.spyOn(client, "invalidateQueries");
      const remove = vi.spyOn(client, "removeQueries");
      const { result } = renderHook(() => useHook() as Mutation, { wrapper: wrapperFor(client) });

      await result.current.mutateAsync(input as never);

      expect(fetchers[fetcher]).toHaveBeenCalledWith(...args);
      for (const key of sets) expect(client.getQueryData(key)).toEqual(answer);
      for (const key of invalidates) expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
      for (const key of removes) expect(remove).toHaveBeenCalledWith({ queryKey: key });
      if (invalidates.length === 0) expect(invalidate).not.toHaveBeenCalled();
    });
  }
);

describe("useCreateDirectoryPerson", () => {
  it("caches the new profile under the id it got and refreshes the lists", async () => {
    const created = { employmentId: "emp-new", name: "Ada" };
    fetchers.createDirectoryPerson.mockResolvedValue(created);
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateDirectoryPerson("org-1"), {
      wrapper: wrapperFor(client),
    });

    await result.current.mutateAsync({ name: "Ada", type: "employee" });

    expect(fetchers.createDirectoryPerson).toHaveBeenCalledWith(
      "org-1",
      { name: "Ada", type: "employee" },
      "en"
    );
    expect(client.getQueryData(qk.directoryProfile("org-1", "emp-new", "en"))).toEqual(created);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["directory"] });
  });
});

describe("useUploadProfilePhoto", () => {
  it("registers, uploads, waits for the processing and refreshes the directory", async () => {
    const target = { url: "https://store/put", method: "PUT", headers: {} };
    fetchers.startProfilePhotoUpload.mockResolvedValue({
      photo: { id: "ph-1", status: "UPLOADING", rejectionReason: null },
      upload: target,
    });
    fetchers.getProfilePhotoUpload.mockResolvedValue({
      id: "ph-1",
      status: "READY",
      rejectionReason: null,
    });
    uploadToTargetMock.mockResolvedValue(undefined);
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUploadProfilePhoto("org-1", "emp-1"), {
      wrapper: wrapperFor(client),
    });
    const file = new File(["x"], "me.png", { type: "image/png" });

    const settled = await result.current.mutateAsync(file);

    expect(fetchers.startProfilePhotoUpload).toHaveBeenCalledWith("org-1", "emp-1", {
      contentType: "image/png",
      size: 1,
    });
    expect(uploadToTargetMock).toHaveBeenCalledWith(target, file);
    expect(fetchers.getProfilePhotoUpload).toHaveBeenCalledWith("org-1", "emp-1", "ph-1");
    expect(settled).toEqual({ id: "ph-1", status: "READY", rejectionReason: null });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["directory"] });
  });

  it("still refreshes the directory when the upload fails", async () => {
    fetchers.startProfilePhotoUpload.mockRejectedValue(new Error("refused"));
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUploadProfilePhoto("org-1", "emp-1"), {
      wrapper: wrapperFor(client),
    });

    await expect(
      result.current.mutateAsync(new File(["x"], "me.png", { type: "image/png" }))
    ).rejects.toThrow("refused");
    expect(uploadToTargetMock).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["directory"] });
  });
});
