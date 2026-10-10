import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApprovalsWidget } from "../approvals-widget";
import { renderWithClient } from "@/lib/test-utils";
import { CalendarRecordType, type PendingApproval } from "@/lib/api/types";

const sample: PendingApproval[] = [
  {
    vacationIds: ["v-1", "v-2"],
    user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
    groupId: "g-1",
    groupName: "Product",
    vacationType: CalendarRecordType.Vacation,
    from: "2026-06-22",
    to: "2026-06-23",
    businessDays: 2,
    note: null,
    submittedAt: "2026-06-10T10:00:00.000Z",
  },
];

const ownPending: PendingApproval[] = [
  {
    vacationIds: ["own-1", "own-2", "own-3"],
    user: { id: "me", name: "Alice Member", initials: "AM", avatarColor: "hsl(10 60% 60%)" },
    groupId: "g-2",
    groupName: "Design",
    vacationType: CalendarRecordType.HomeOffice,
    from: "2026-11-30",
    to: "2026-12-02",
    businessDays: 3,
    note: null,
    submittedAt: "2026-10-10T10:00:00.000Z",
  },
];

const approveMutate = vi.fn();
const rejectMutate = vi.fn();
const replaceSpy = vi.fn();
let approvals: PendingApproval[] = [];
let pendingRequests: PendingApproval[] = [];
let roles = { isLoading: false, isApprover: false };

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: replaceSpy, push: vi.fn() }),
}));

vi.mock("@/lib/viewer/use-viewer-roles", () => ({
  useViewerRoles: () => roles,
}));

vi.mock("@/lib/api/queries", () => ({
  useMyApprovals: () => ({ data: approvals, isLoading: false, error: null }),
  useMyPendingRequests: () => ({ data: pendingRequests, isLoading: false, error: null }),
  useApproveVacations: () => ({ mutate: approveMutate, isPending: false }),
  useRejectVacations: () => ({ mutate: rejectMutate, isPending: false }),
}));

describe("ApprovalsWidget", () => {
  beforeEach(() => {
    approveMutate.mockClear();
    rejectMutate.mockClear();
    replaceSpy.mockClear();
    approvals = [];
    pendingRequests = [];
    roles = { isLoading: false, isApprover: false };
    window.history.replaceState({}, "", "/dashboard/");
  });

  describe("as an Approver", () => {
    beforeEach(() => {
      roles = { isLoading: false, isApprover: true };
      approvals = sample;
    });

    it("renders pending approval rows under Waiting on you", () => {
      renderWithClient(<ApprovalsWidget />);
      expect(screen.getByText("Pending approvals")).toBeInTheDocument();
      const section = screen.getByRole("region", { name: "Waiting on you" });
      expect(within(section).getByText("Dana Holt")).toBeInTheDocument();
      expect(within(section).getByRole("button", { name: /Approve/i })).toBeInTheDocument();
    });

    it("calls approve.mutate with the full vacationIds array when Approve is clicked", async () => {
      const user = userEvent.setup();
      renderWithClient(<ApprovalsWidget />);
      await user.click(screen.getByRole("button", { name: /Approve/i }));
      expect(approveMutate).toHaveBeenCalledWith(["v-1", "v-2"]);
    });

    it("calls reject.mutate with the full vacationIds array when Decline is clicked", async () => {
      const user = userEvent.setup();
      renderWithClient(<ApprovalsWidget />);
      await user.click(screen.getByRole("button", { name: /Decline/i }));
      expect(rejectMutate).toHaveBeenCalledWith({ ids: ["v-1", "v-2"] });
    });

    it("shows both sections, each with its own empty state", () => {
      approvals = [];
      renderWithClient(<ApprovalsWidget />);
      const waiting = screen.getByRole("region", { name: "Waiting on you" });
      expect(within(waiting).getByText(/All caught up/)).toBeInTheDocument();
      const mine = screen.getByRole("region", { name: "Your requests" });
      expect(
        within(mine).getByText("None of your requests is waiting on approval.")
      ).toBeInTheDocument();
    });

    it("shows Waiting on you as soon as there is something to decide, before roles are known", () => {
      roles = { isLoading: true, isApprover: false };
      renderWithClient(<ApprovalsWidget />);
      expect(screen.getByRole("region", { name: "Waiting on you" })).toBeInTheDocument();
    });

    it("renders neither Waiting on you nor its empty state while roles are still loading", () => {
      roles = { isLoading: true, isApprover: false };
      approvals = [];
      renderWithClient(<ApprovalsWidget />);
      expect(screen.queryByRole("region", { name: "Waiting on you" })).not.toBeInTheDocument();
      expect(screen.queryByText(/All caught up/)).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Your requests" })).toBeInTheDocument();
    });
  });

  describe("as a member who is not an Approver", () => {
    it("shows only Your requests", () => {
      renderWithClient(<ApprovalsWidget />);
      expect(screen.getByText("Pending approvals")).toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Waiting on you" })).not.toBeInTheDocument();
      expect(screen.queryByText(/All caught up/)).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Your requests" })).toBeInTheDocument();
    });

    it("says none of their requests is waiting when the list is empty", () => {
      renderWithClient(<ApprovalsWidget />);
      expect(screen.getByText("None of your requests is waiting on approval.")).toBeInTheDocument();
    });

    it("lists each request with its type, range, business days and the group it waits in", () => {
      pendingRequests = ownPending;
      renderWithClient(<ApprovalsWidget />);
      const row = screen.getByRole("button", { name: /Home Office/i });
      expect(within(row).getByText("Nov 30 – Dec 2 · 3 days")).toBeInTheDocument();
      expect(within(row).getByText("Waiting on approval in Design")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Approve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Decline/i })).not.toBeInTheDocument();
    });

    it("opens the request detail when a row is clicked", async () => {
      pendingRequests = ownPending;
      const user = userEvent.setup();
      renderWithClient(<ApprovalsWidget />);
      await user.click(screen.getByRole("button", { name: /Home Office/i }));
      expect(replaceSpy).toHaveBeenCalledWith("/dashboard/?vacationId=own-1", { scroll: false });
    });
  });
});
