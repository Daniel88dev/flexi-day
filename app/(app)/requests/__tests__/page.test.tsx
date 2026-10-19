import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequestsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { AWAY_RECORD_TYPE, CalendarRecordType, type VacationListItem } from "@/lib/api/types";

const approveMutate = vi.fn();
const rejectMutate = vi.fn();
const cancelMutate = vi.fn();

const employee = { id: "u-emp", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" };

function day(id: string, requestedDay: string, canApprove = true): VacationListItem {
  return {
    id,
    userId: "u-emp",
    groupId: "g-1",
    requestId: "r-1",
    requestedDay,
    startTime: null,
    endTime: null,
    vacationType: CalendarRecordType.Vacation,
    halfDay: false,
    note: null,
    rejectionReason: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    deletedByUserId: null,
    createdByUserId: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
    user: employee,
    canApprove,
  };
}

// A single 3-day pending request, stored as three per-day rows.
const vacations: VacationListItem[] = [
  day("v-1", "2026-08-17"),
  day("v-2", "2026-08-18"),
  day("v-3", "2026-08-19"),
];

const useVacationsSpy = vi.fn();
let listOverride: VacationListItem[] | null = null;

const replaceSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/requests/",
  useRouter: () => ({ replace: replaceSpy, push: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "approver-1" } } }),
}));

vi.mock("@/lib/api/queries", () => ({
  useGroups: () => ({
    data: [{ id: "g-1", groupName: "Platform" }],
    isLoading: false,
    error: null,
  }),
  useVacations: (params: unknown) => {
    useVacationsSpy(params);
    return { data: listOverride ?? vacations, isLoading: false, error: null };
  },
  // The page scopes the list to a group it may see in full — without one the
  // API only ever returns the caller's own rows.
  useReportScope: () => ({
    data: { groups: [{ groupId: "g-1", groupName: "Platform", access: "all" }] },
    isLoading: false,
    error: null,
  }),
  useApproveVacations: () => ({ mutate: approveMutate, isPending: false }),
  useRejectVacations: () => ({ mutate: rejectMutate, isPending: false }),
  useCancelVacations: () => ({ mutate: cancelMutate, isPending: false }),
  // Rendered (closed) dialog pulls these from the same module.
  useVacation: () => ({ data: undefined, isLoading: false, error: null }),
  useCommentVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("RequestsPage grouping", () => {
  beforeEach(() => {
    approveMutate.mockClear();
    rejectMutate.mockClear();
    cancelMutate.mockClear();
  });

  it("shows one row with the full range for a multi-day request", () => {
    renderWithClient(<RequestsPage />);

    // One collapsed row, not three per-day rows.
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
    expect(screen.getByText(/17 Aug 2026 –.*19 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText("(3 days)")).toBeInTheDocument();
  });

  it("approves the whole range in one call", async () => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(approveMutate).toHaveBeenCalledWith(
      { ids: ["v-1", "v-2", "v-3"] },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });

  it("rejects the whole range in one call", async () => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(rejectMutate).toHaveBeenCalledWith(
      { ids: ["v-1", "v-2", "v-3"] },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });
});

describe("RequestsPage decision actions", () => {
  it("offers no decision buttons when the backend says the caller may not decide", () => {
    vacations.forEach((v) => (v.canApprove = false));
    try {
      renderWithClient(<RequestsPage />);

      expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    } finally {
      vacations.forEach((v) => (v.canApprove = true));
    }
  });
});

describe("RequestsPage cancelled visibility", () => {
  it("asks the API for cancelled rows and offers a Cancelled tab with its count", async () => {
    // Owned by the session user: `mine` is true, so the missing Cancel button
    // below proves the cancelled-status guard, not just the ownership one.
    const cancelled = {
      ...day("v-9", "2026-08-20", false),
      userId: "approver-1",
      deletedAt: "2026-08-05T09:00:00.000Z",
      deletedByUserId: "approver-1",
    };
    vacations.push(cancelled);
    try {
      const user = userEvent.setup();
      renderWithClient(<RequestsPage />);

      expect(useVacationsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ includeCancelled: true })
      );

      const cancelledTab = screen.getByRole("button", { name: /Cancelled/ });
      expect(cancelledTab).toHaveTextContent("1");
      await user.click(cancelledTab);

      // Only the cancelled run remains, with no inline cancel action on it.
      expect(screen.getByText(/20 Aug 2026/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    } finally {
      vacations.pop();
    }
  });
});

describe("RequestsPage action errors", () => {
  // Owned by the session user, so the row offers Cancel.
  const own = { ...day("v-7", "2026-08-21", false), userId: "approver-1" };

  beforeEach(() => {
    approveMutate.mockReset();
    cancelMutate.mockReset();
  });

  it("translates the conflict when someone else cancelled the request first", async () => {
    cancelMutate.mockImplementation((_vars: unknown, options?: { onError?: (e: Error) => void }) =>
      options?.onError?.(
        new ApiError(409, "One or more of these requests has already been cancelled")
      )
    );
    vacations.push(own);
    try {
      const user = userEvent.setup();
      renderWithClient(<RequestsPage />);

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This request was already cancelled, so nothing changed."
      );
    } finally {
      vacations.pop();
    }
  });

  it("drops the message when the user switches to a different list", async () => {
    cancelMutate.mockImplementation((_vars: unknown, options?: { onError?: (e: Error) => void }) =>
      options?.onError?.(
        new ApiError(409, "One or more of these requests has already been cancelled")
      )
    );
    vacations.push(own);
    try {
      const user = userEvent.setup();
      renderWithClient(<RequestsPage />);

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(await screen.findByRole("alert")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Rejected/ }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      vacations.pop();
    }
  });

  it("surfaces a failed approval instead of leaving the row silent", async () => {
    approveMutate.mockImplementation((_vars: unknown, options?: { onError?: (e: Error) => void }) =>
      options?.onError?.(new ApiError(409, "This request has already been decided"))
    );
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This request has already been decided"
    );
  });

  it("clears the message once an action succeeds", async () => {
    approveMutate
      .mockImplementationOnce((_vars: unknown, options?: { onError?: (e: Error) => void }) =>
        options?.onError?.(new ApiError(500, "Failed to approve vacation"))
      )
      .mockImplementationOnce((_vars: unknown, options?: { onSuccess?: () => void }) =>
        options?.onSuccess?.()
      );
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("RequestsPage teammate's Away", () => {
  it("labels a teammate's Sick as Away with a colour, never the raw value", () => {
    const bob = { id: "u-bob", name: "Bob Dvorak", initials: "BD", avatarColor: "hsl(0 0% 30%)" };
    // The shape the backend sends a teammate for a Sick row: AWAY, no note.
    const away = {
      ...day("v-away", "2026-08-25", false),
      userId: bob.id,
      user: bob,
      requestId: "r-away",
      vacationType: AWAY_RECORD_TYPE,
      note: null,
    };
    vacations.push(away);
    try {
      renderWithClient(<RequestsPage />);

      const row = screen.getByText("Bob Dvorak").closest("tr") as HTMLElement;
      const type = within(row).getByText("Away");
      expect(type.className).toMatch(/\bbg-/);
      expect(within(row).getByText("Pending")).toBeInTheDocument();
      expect(row).not.toHaveTextContent("AWAY");
    } finally {
      vacations.pop();
    }
  });
});

describe("RequestsPage row keyboard", () => {
  const ownRequest = {
    ...day("v-7", "2026-08-21", false),
    userId: "approver-1",
    requestId: "r-own",
  };

  beforeEach(() => {
    approveMutate.mockReset();
    rejectMutate.mockReset();
    cancelMutate.mockReset();
    replaceSpy.mockClear();
  });

  afterEach(() => {
    listOverride = null;
  });

  const openedDetail = () =>
    replaceSpy.mock.calls.some(([url]) => String(url).includes("vacationId="));

  it.each(["{Enter}", " "])("approves on %s from the focused Approve button", async (key) => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    screen.getByRole("button", { name: "Approve" }).focus();
    await user.keyboard(key);

    expect(approveMutate).toHaveBeenCalledWith(
      { ids: ["v-1", "v-2", "v-3"] },
      expect.objectContaining({ onError: expect.any(Function) })
    );
    expect(openedDetail()).toBe(false);
  });

  it.each(["{Enter}", " "])("declines on %s from the focused Reject button", async (key) => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    screen.getByRole("button", { name: "Reject" }).focus();
    await user.keyboard(key);

    expect(rejectMutate).toHaveBeenCalledWith(
      { ids: ["v-1", "v-2", "v-3"] },
      expect.objectContaining({ onError: expect.any(Function) })
    );
    expect(openedDetail()).toBe(false);
  });

  it.each(["{Enter}", " "])("cancels on %s from the focused Cancel button", async (key) => {
    listOverride = [ownRequest];
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    screen.getByRole("button", { name: "Cancel" }).focus();
    await user.keyboard(key);

    expect(cancelMutate).toHaveBeenCalledWith(
      { ids: ["v-7"] },
      expect.objectContaining({ onError: expect.any(Function) })
    );
    expect(openedDetail()).toBe(false);
  });

  it.each(["{Enter}", " "])("opens the detail on %s from the focused row", async (key) => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    screen.getByRole("button", { name: /^Open request details/ }).focus();
    await user.keyboard(key);

    expect(openedDetail()).toBe(true);
    expect(approveMutate).not.toHaveBeenCalled();
  });

  it("leaves other keys on a row button alone", async () => {
    const prevented: boolean[] = [];
    const record = (e: KeyboardEvent) => prevented.push(e.defaultPrevented);
    document.addEventListener("keydown", record);
    try {
      const user = userEvent.setup();
      renderWithClient(<RequestsPage />);

      screen.getByRole("button", { name: "Approve" }).focus();
      await user.keyboard("{Escape}");

      expect(prevented).toEqual([false]);
      expect(openedDetail()).toBe(false);
      expect(approveMutate).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener("keydown", record);
    }
  });

  it("opens the detail on a row click but not on an action click", async () => {
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(approveMutate).toHaveBeenCalledTimes(1);
    expect(openedDetail()).toBe(false);

    await user.click(screen.getByText("Dana Holt"));
    expect(openedDetail()).toBe(true);
  });
});

describe("RequestsPage whole Request", () => {
  // Thu 29 Oct – Tue 3 Nov 2026: a weekend and a month edge inside one Request.
  const crossing = () => [
    { ...day("w-1", "2026-10-29"), requestId: "r-cross" },
    { ...day("w-2", "2026-10-30"), requestId: "r-cross" },
    { ...day("w-3", "2026-11-02"), requestId: "r-cross" },
    { ...day("w-4", "2026-11-03"), requestId: "r-cross" },
  ];

  beforeEach(() => {
    approveMutate.mockClear();
    rejectMutate.mockClear();
    cancelMutate.mockClear();
  });

  afterEach(() => {
    listOverride = null;
  });

  it("asks the API for whole Requests", () => {
    renderWithClient(<RequestsPage />);

    expect(useVacationsSpy).toHaveBeenCalledWith(expect.objectContaining({ wholeRequests: true }));
  });

  it("shows a Request across a weekend and a month edge as one row with its full range", () => {
    listOverride = crossing();
    renderWithClient(<RequestsPage />);

    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
    expect(screen.getByText(/29 Oct 2026 –.*3 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByText("(4 days)")).toBeInTheDocument();
  });

  it("approves and declines every day of the Request, in both months", async () => {
    listOverride = crossing();
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));

    const all = { ids: ["w-1", "w-2", "w-3", "w-4"] };
    expect(approveMutate).toHaveBeenCalledWith(all, expect.anything());
    expect(rejectMutate).toHaveBeenCalledWith(all, expect.anything());
  });

  it("cancels every day of the caller's own Request, in both months", async () => {
    listOverride = crossing().map((row) => ({ ...row, userId: "approver-1", canApprove: false }));
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(cancelMutate).toHaveBeenCalledWith(
      { ids: ["w-1", "w-2", "w-3", "w-4"] },
      expect.anything()
    );
  });

  it("acts only on the pending days of a partly approved Request", async () => {
    const approvedAt = "2026-10-20T09:00:00.000Z";
    listOverride = crossing().map((row, index) =>
      index % 2 === 0 ? { ...row, approvedAt, canApprove: false } : row
    );
    const user = userEvent.setup();
    renderWithClient(<RequestsPage />);

    expect(screen.getByRole("button", { name: /^Pending/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /^Approved/ })).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(approveMutate).toHaveBeenCalledWith({ ids: ["w-2", "w-4"] }, expect.anything());
  });
});
