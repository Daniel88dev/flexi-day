import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequestsPage from "../page";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import { VacationKind, type VacationListItem } from "@/lib/api/types";

const approveMutate = vi.fn();
const rejectMutate = vi.fn();
const cancelMutate = vi.fn();

const employee = { id: "u-emp", name: "Dana Holt", initials: "DH", avatarColor: "hsl(0 0% 50%)" };

function day(id: string, requestedDay: string, canApprove = true): VacationListItem {
  return {
    id,
    userId: "u-emp",
    groupId: "g-1",
    requestedDay,
    startTime: null,
    endTime: null,
    vacationType: VacationKind.Vacation,
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
    return { data: vacations, isLoading: false, error: null };
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
      ["v-1", "v-2", "v-3"],
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
